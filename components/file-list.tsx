"use client"

import { useState, useEffect, useRef } from "react"
import { File, Folder, MoreVertical, FileText, Image, FileArchive, ChevronLeft } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { FileItem } from "@/lib/r2Api"

interface FileListProps {
  viewMode: "grid" | "list"
  searchQuery: string
  files: FileItem[]
  onRefresh: () => void
}

export function FileList({ viewMode, searchQuery, files, onRefresh }: FileListProps) {
  const [currentPath, setCurrentPath] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    // 返回清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []); // 空依赖数组，只在组件挂载时执行


  /**
   * 预处理文件列表，确保所有隐含的目录都被添加到列表中
   * @param fileList 原始文件列表
   * @returns 预处理后的文件列表，包含所有隐含的目录
  */
  function preprocessFileList(fileList: FileItem[]): FileItem[] {
    const result = [...fileList]; // 复制原始列表
    const directories = new Set<string>();
    
    // 提取所有隐含的目录路径
    for (const file of fileList) {
      const path = file.name;
      const parts = path.split('/');
      
      // 如果路径包含目录部分
      if (parts.length > 1) {
        // 构建每一级目录路径
        let dirPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          dirPath += parts[i] + '/';
          directories.add(dirPath);
        }
      }
    }
    
    // 检查哪些目录不在原始列表中
    for (const dir of Array.from(directories)) {
      // 检查目录是否已经在列表中
      const exists = fileList.some(item => item.name === dir);
      if (!exists) {
        // 如果目录不存在，添加到结果中
        result.push({
          name: dir,
          type: "folder",
          modified: "",
          size: "",
          r2Type: "application/x-directory"
        });
      }
    }
    
    return result;
  }


  /**
   * 获取当前目录下的文件列表
   * @returns 当前目录下的文件列表
  */
  const getCurrentFiles = () => {
    // 预处理文件列表，确保所有目录都被包含
    const fileList = preprocessFileList(files);
    
    const result: FileItem[] = [];
    const currentPathLength = currentPath.length;
    const seen = new Set<string>();

    // 遍历文件列表
    for (const file of fileList) {
      const filePath = file.name;
      
      // 跳过不在当前目录的文件
      if (!filePath.startsWith(currentPath) && currentPath !== "") {
        continue;
      }

      // 获取相对于当前目录的文件路径
      const relativePath = currentPath === "" ? filePath : filePath.slice(currentPathLength);
      
      // 如果文件不在当前目录下或是当前目录本身，跳过
      if (relativePath === "") {
        continue;
      }

      // 检查是否是子目录中的文件
      const parts = relativePath.split('/');
      
      // 如果是当前目录下的文件或直接子目录
      if (parts.length === 1 || (parts.length === 2 && parts[1] === '')) {
        const fileName = relativePath;
        
        // 如果已经添加过这个文件或目录，跳过
        if (seen.has(fileName)) {
          continue;
        }
        
        seen.add(fileName);
        
        // 创建一个新的文件项对象
        const fileItem: FileItem = {
          ...file,
          name: fileName,
          type: file.type
        };
        
        result.push(fileItem);
      }
    }

    return result;
  }

  const filteredFiles = getCurrentFiles().filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理文件夹双击
  const handleFolderDoubleClick = (folderName: string) => {
    // 确保当前路径以 / 结尾
    if (folderName && !folderName.endsWith("/")) {
      folderName += "/";
    }
    const newPath = currentPath ? `${currentPath}${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  // 返回上级目录
  const handleBackClick = () => {
    const lastSlashIndex = currentPath.lastIndexOf('/');
    const newPath = lastSlashIndex === -1 ? "" : currentPath.substring(0, lastSlashIndex);
    setCurrentPath(newPath);
  };

  if (files.length === 0) {
    return (
      <div className="container p-4">
        {currentPath && (
          <div className="flex items-center flex-wrap gap-1 mb-2">
            <Button
              variant="ghost"
              className="px-2 h-7"
              onClick={() => setCurrentPath("")}
            >
              ルート/
            </Button>
            {currentPath.split('/').filter(Boolean).map((part, index, array) => (
              index === array.length - 1 ? (
                <span key={index} className="text-muted-foreground px-2">
                  {part}/
                </span>
              ) : (
                <Button
                  key={index}
                  variant="ghost"
                  className="px-2 h-7"
                  onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}
                >
                  {part}/
                </Button>
              )
            ))}
          </div>
        )}
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <File className="h-12 w-12 mb-4" />
          <p className="text-lg">ファイルがありません</p>
          <p className="text-sm">右下のボタンからファイルをアップロードしてください</p>
        </div>
      </div>
    )
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="container p-4">
        {currentPath && (
          <div className="flex items-center flex-wrap gap-1 mb-2">
            <Button
              variant="ghost"
              className="px-2 h-7"
              onClick={() => setCurrentPath("")}
            >
              ルート/
            </Button>
            {currentPath.split('/').filter(Boolean).map((part, index, array) => (
              index === array.length - 1 ? (
                <span key={index} className="text-muted-foreground px-2">
                  {part}/
                </span>
              ) : (
                <Button
                  key={index}
                  variant="ghost"
                  className="px-2 h-7"
                  onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}
                >
                  {part}/
                </Button>
              )
            ))}
          </div>
        )}
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <File className="h-12 w-12 mb-4" />
          <p className="text-lg">検索結果がありません</p>
          <p className="text-sm">検索条件を変更してお試しください</p>
        </div>
      </div>
    )
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder") return <Folder className="h-8 w-8 text-blue-500" />

    switch (file.fileType) {
      case "document":
        return <FileText className="h-8 w-8 text-green-500" />
      case "image":
        return <Image className="h-8 w-8 text-purple-500" />
      case "archive":
        return <FileArchive className="h-8 w-8 text-yellow-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  if (viewMode === "grid") {
    return (
      <div className="container p-4">
        {currentPath && (
          <div className="flex items-center flex-wrap gap-1 mb-2">
            {/* 根目录 */}
            <Button
              variant="ghost"
              className="px-2 h-7"
              onClick={() => setCurrentPath("")}
            >
              ルート/
            </Button>

            {/* 中间路径 */}
            {currentPath.split('/').filter(Boolean).map((part, index, array) => {
              // 如果是最后一个（当前目录），不可点击
              if (index === array.length - 1) {
                return (
                  <span key={index} className="text-muted-foreground px-2">
                    {part}/
                  </span>
                );
              }

              // 可点击的上级目录
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="px-2 h-7"
                  onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}
                >
                  {part}/
                </Button>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredFiles.map((file) => (
            <Card
              key={file.name}
              className="overflow-hidden"
              onDoubleClick={() => file.type === "folder" && handleFolderDoubleClick(file.name)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center pt-6">
                {getFileIcon(file)}
                <div className="mt-2 text-center">
                  <div className="font-medium truncate max-w-[120px]">{file.name}</div>
                  {file.type === "file" && <div className="text-xs text-muted-foreground">{file.size}</div>}
                </div>
              </CardContent>
              <CardFooter className="p-2 flex justify-between bg-muted/50">
                <span className="text-xs text-muted-foreground">{file.modified}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">メニュー</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>開く</DropdownMenuItem>
                    <DropdownMenuItem>ダウンロード</DropdownMenuItem>
                    <DropdownMenuItem>名前変更</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container p-4">
      {currentPath && (
        <div className="flex items-center flex-wrap gap-1 mb-2">
          {/* 根目录 */}
          <Button
            variant="ghost"
            className="px-2 h-7"
            onClick={() => setCurrentPath("")}
          >
            ルート
          </Button>

          {/* 中间路径 */}
          {currentPath.split('/').filter(Boolean).map((part, index, array) => {
            // 如果是最后一个（当前目录），不可点击
            if (index === array.length - 1) {
              return (
                <span key={index} className="text-muted-foreground px-2">
                  {part}/
                </span>
              );
            }

            // 可点击的上级目录
            return (
              <Button
                key={index}
                variant="ghost"
                className="px-2 h-7"
                onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}
              >
                {part}/
              </Button>
            );
          })}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">名前</TableHead>
            <TableHead>タイプ</TableHead>
            <TableHead>サイズ</TableHead>
            <TableHead>更新日</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFiles.map((file) => (
            <TableRow
              key={file.name}
              onDoubleClick={() => file.type === "folder" && handleFolderDoubleClick(file.name)}
              className={file.type === "folder" ? "cursor-pointer" : ""}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <span>{file.name}</span>
                </div>
              </TableCell>
              <TableCell>{file.r2Type || "-"}</TableCell>
              <TableCell>{file.size || "-"}</TableCell>
              <TableCell>{file.modified}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">メニュー</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>開く</DropdownMenuItem>
                    <DropdownMenuItem>ダウンロード</DropdownMenuItem>
                    <DropdownMenuItem>名前変更</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

