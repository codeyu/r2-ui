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

  const getCurrentFiles = () => {
    const result: FileItem[] = [];
    const currentPathLength = currentPath.length;
    const seen = new Set<string>();

    // 遍历文件列表
    for (const file of files) {
      const filePath = file.name;

      // 跳过不在当前目录的文件
      if (!filePath.startsWith(currentPath) && currentPath !== "") {
        continue;
      }

      // 获取相对于当前目录的文件路径
      const relativePath = currentPath === "" ? filePath : filePath.slice(currentPathLength);

      // 如果文件不在当前目录下，跳过
      if (relativePath === "") {
        continue;
      }

      // 获取文件或目录名
      const slashIndex = relativePath.indexOf("/");

      // 如果没有斜杠，或者斜杠在末尾，则是当前目录的直接文件或子目录
      if (slashIndex === -1 || (slashIndex === relativePath.length - 1 && relativePath.split("/").length - 1 === 1)) {
        // 构建当前层级的文件名
        const fileName = slashIndex === -1 ? relativePath : relativePath;

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

        // 对于子目录中的文件，需要特殊处理
        if (slashIndex !== -1 && slashIndex !== relativePath.length - 1) {
          continue; // 跳过子目录中的文件
        }

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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <File className="h-12 w-12 mb-4" />
        <p className="text-lg">ファイルがありません</p>
        <p className="text-sm">右下のボタンからファイルをアップロードしてください</p>
      </div>
    )
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <File className="h-12 w-12 mb-4" />
        <p className="text-lg">検索結果がありません</p>
        <p className="text-sm">検索条件を変更してお試しください</p>
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
          <div className="flex items-center gap-2 mb-4">
            {/* 根目录 */}
            <Button
              variant="ghost"
              className="px-2"
              onClick={() => setCurrentPath("")}
            >
              ルート/
            </Button>

            {/* 中间路径 */}
            {currentPath.split('/').filter(Boolean).map((part, index, array) => {
              // 如果是最后一个（当前目录），不可点击
              if (index === array.length - 1) {
                return (
                  <span key={index} className="text-muted-foreground">
                    {part}/
                  </span>
                );
              }

              // 可点击的上级目录
              return (
                <div key={index} className="flex items-center">
                  <Button
                    variant="ghost"
                    className="px-2"
                    onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}
                  >
                    {part}/
                  </Button>
                </div>
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
        <div className="flex items-center gap-2 mb-4">
          {/* 根目录 */}
          <Button
            variant="ghost"
            className="px-2"
            onClick={() => setCurrentPath("")}
          >
            ルート
          </Button>

          {/* 中间路径 */}
          {currentPath.split('/').filter(Boolean).map((part, index, array) => {
            // 如果是最后一个（当前目录），不可点击
            if (index === array.length - 1) {
              return (
                <span key={index} className="text-muted-foreground">
                  {part}/
                </span>
              );
            }

            // 可点击的上级目录
            return (
              <div key={index} className="flex items-center">
                <Button
                  variant="ghost"
                  className="px-2"
                  onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}
                >
                  {part}/
                </Button>
              </div>
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

