import { getActiveEndpoint } from './endpoint';

interface R2ApiOptions {
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
}

async function r2ApiRequest({ method, path, body, headers = {} }: R2ApiOptions) {
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
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    // 检查是否支持分片上传
    const supportMpu = await r2ApiRequest({
      method: 'GET',
      path: '/support_mpu',
    }).then(() => true).catch(() => false);

    if (supportMpu && file.size > 100 * 1024 * 1024) { // 大于100MB使用分片上传
      return this.multipartUpload(file, onProgress);
    }

    await r2ApiRequest({
      method: 'PUT',
      path: `/${file.name}`,
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
    return true;
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

      const partResponse = await r2ApiRequest({
        method: 'PUT',
        path: `/mpu/${file.name}?partNumber=${i + 1}&uploadId=${uploadId}`,
        body: chunk,
      });
      
      const { ETag } = await partResponse.json();
      parts.push({ ETag, PartNumber: i + 1 });

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