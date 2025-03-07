import { getActiveEndpoint } from './endpoint';

interface R2ApiOptions {
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
}

async function r2ApiRequest({ method, path, body, headers = {}, signal }: R2ApiOptions & { signal?: AbortSignal }) {
  const endpoint = getActiveEndpoint();
  if (!endpoint) {
    throw new Error('No active R2 endpoint configured');
  }

  const url = `${endpoint.workerEndpointUrl}${path}`;
  console.log('API Request:', { url, method, headers });

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'X-API-Key': endpoint.workerEndpointApiKey,
        ...headers,
      },
      body,
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  } catch (error) {
    console.error('Network Error:', error);
    throw error;
  }
}

export interface FileItem {
  name: string;
  type: "file" | "folder";
  size?: string;
  modified: string;
  fileType?: "document" | "image" | "archive" | "other";
}

export const r2Api = {
  // 获取文件列表
  async listFiles(): Promise<FileItem[]> {
    const response = await r2ApiRequest({
      method: 'PATCH',
      path: '/',
    });
    const data = await response.json();
    
    // 转换 API 返回的数据格式
    return data.objects?.map((obj: any) => ({
      name: obj.key,
      type: obj.httpMetadata?.contentType === "application/x-directory" ? "folder" : "file",
      size: obj.httpMetadata?.contentType === "application/x-directory" ? "-" : formatFileSize(obj.size),
      modified: new Date(obj.uploaded).toLocaleString(),
      fileType: getFileType(obj.httpMetadata?.contentType)
    })) || [];
  },

  // 上传文件
  async uploadFile(file: File, onProgress?: (progress: number) => void, parentPath: string = '', signal?: AbortSignal) {
    const filePath = `${parentPath}${file.name}`;
    
    // 检查是否支持分片上传
    const supportMpu = await r2ApiRequest({
      method: 'GET',
      path: '/support_mpu',
    }).then(() => true).catch(() => false);

    if (supportMpu && file.size > 100 * 1024 * 1024) {
      return this.multipartUpload(file, onProgress);
    }

    // 使用 XMLHttpRequest 来获取上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };

      xhr.onabort = () => {
        reject(new Error('Upload aborted'));
      };

      // 获取当前的 endpoint
      const endpoint = getActiveEndpoint();
      if (!endpoint) {
        reject(new Error('No active R2 endpoint configured'));
        return;
      }

      xhr.open('PUT', `${endpoint.workerEndpointUrl}/${filePath}`);
      xhr.setRequestHeader('X-API-Key', endpoint.workerEndpointApiKey);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      
      // 监听取消信号
      if (signal) {
        signal.addEventListener('abort', () => xhr.abort());
      }

      xhr.send(file);
    });
  },

  // 分片上传
  async multipartUpload(file: File, onProgress?: (progress: number) => void) {
    // 初始化分片上传
    const initResponse = await r2ApiRequest({
      method: 'POST',
      path: `/mpu/create/${file.name}`,
    });
    const { uploadId } = await initResponse.json();

    const chunkSize = 5 * 1024 * 1024; // 5MB
    const chunks = Math.ceil(file.size / chunkSize);
    const parts: { ETag: string, PartNumber: number }[] = [];

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      const partNumber = i + 1; // 分片编号从 1 开始

      const partResponse = await r2ApiRequest({
        method: 'PUT',
        path: `/mpu/${file.name}?partNumber=${partNumber}&uploadId=${uploadId}`,
        body: chunk,
      });
      
      const { ETag } = await partResponse.json();
      parts.push({ ETag, PartNumber: partNumber }); // 使用正确的分片编号

      if (onProgress) {
        onProgress((i + 1) / chunks * 100);
      }
    }

    // 完成分片上传
    await r2ApiRequest({
      method: 'POST',
      path: `/mpu/complete/${file.name}?uploadId=${uploadId}`,
      body: JSON.stringify({ parts }),
    });

    return true;
  },

  // 删除文件
  async deleteFile(key: string) {
    await r2ApiRequest({
      method: 'DELETE',
      path: `/${key}`,
    });
    return true;
  },

  // 下载文件
  async downloadFile(key: string) {
    const response = await r2ApiRequest({
      method: 'GET',
      path: `/${key}`,
    });
    return response.blob();
  },

  async createFile(fileName: string, extension: string) {
    await r2ApiRequest({
      method: 'PUT',
      path: `/${fileName}.${extension}`,
      body: '', // 空文件内容
      headers: {
        'Content-Type': extension === 'md' ? 'text/markdown' : 'text/plain',
      },
    });
    return true;
  },

  async createFolder(folderName: string) {
    await r2ApiRequest({
      method: 'PUT',
      path: `/${folderName}/`, // 文件夹以斜杠结尾
      body: '',
      headers: {
        'Content-Type': 'application/x-directory',
      },
    });
    return true;
  },

  // 添加上传文件夹的方法
  async uploadFolder(folder: FileSystemDirectoryEntry, parentPath: string = ''): Promise<boolean> {
    try {
      // 创建当前文件夹
      const folderPath = `${parentPath}${folder.name}/`;
      console.log('Creating folder:', folderPath);
      await this.createFolder(folderPath.replace(/^\//, '')); // 移除开头的斜杠

      // 读取文件夹内容
      console.log('Reading directory entries for:', folder.name);
      const entries = await this.readDirectoryEntries(folder);
      console.log('Found entries:', entries.length);
      
      for (const entry of entries) {
        if (entry.isFile) {
          // 处理文件
          console.log('Processing file:', entry.name);
          const file = await this.fileEntryToFile(entry as FileSystemFileEntry);
          console.log('Uploading file:', file.name, 'to path:', folderPath);
          await this.uploadFile(file, undefined, folderPath);
        } else if (entry.isDirectory) {
          // 递归处理子文件夹
          console.log('Processing subfolder:', entry.name);
          await this.uploadFolder(entry as FileSystemDirectoryEntry, folderPath);
        }
      }
      return true;
    } catch (error) {
      console.error('Upload folder error:', error);
      throw error;
    }
  },

  // 辅助方法：读取目录内容
  async readDirectoryEntries(dirEntry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
    return new Promise((resolve, reject) => {
      const entries: FileSystemEntry[] = [];
      const reader = dirEntry.createReader();
      
      function readEntries() {
        reader.readEntries((results) => {
          console.log('Read entries batch:', results.length);
          if (results.length === 0) {
            console.log('Finished reading directory, total entries:', entries.length);
            resolve(entries);
          } else {
            entries.push(...results);
            readEntries(); // 继续读取，直到没有更多条目
          }
        }, (error) => {
          console.error('Error reading entries:', error);
          reject(error);
        });
      }
      
      readEntries();
    });
  },

  // 辅助方法：将 FileEntry 转换为 File
  async fileEntryToFile(fileEntry: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve, reject) => {
      console.log('Converting FileEntry to File:', fileEntry.name);
      fileEntry.file(
        (file) => {
          console.log('Successfully converted to File:', file.name);
          resolve(file);
        },
        (error) => {
          console.error('Error converting to File:', error);
          reject(error);
        }
      );
    });
  },
};

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// 辅助函数：根据 contentType 判断文件类型
function getFileType(contentType: string = ''): "document" | "image" | "archive" | "other" {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.includes('text/') || contentType.includes('document')) return 'document';
  if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('rar')) return 'archive';
  return 'other';
} 