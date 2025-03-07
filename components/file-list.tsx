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

  // 获取当前路径下的文件和文件夹
  const getCurrentFiles = () => {
    return files.filter(file => {
      // 如果是根目录
      if (!currentPath) {
        // 只显示根目录的文件和文件夹（不包含中间斜杠的项目）
        return !file.name.slice(0, -1).includes('/');
      }
      
      // 如果是子目录
      const filePath = file.name.substring(0, file.name.lastIndexOf('/') || file.name.length);
      return filePath === currentPath;
    }).map(file => ({
      ...file,
      name: file.name.endsWith('/') ? file.name.slice(0, -1).split('/').pop() || file.name : file.name.split('/').pop() || file.name
    }));
  };

  const filteredFiles = getCurrentFiles().filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理文件夹双击
  const handleFolderDoubleClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
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
          <Button
            variant="ghost"
            className="mb-4"
            onClick={handleBackClick}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
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
        <Button
          variant="ghost"
          className="mb-4"
          onClick={handleBackClick}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">名前</TableHead>
            <TableHead>更新日</TableHead>
            <TableHead>サイズ</TableHead>
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
              <TableCell>{file.modified}</TableCell>
              <TableCell>{file.size || "-"}</TableCell>
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

