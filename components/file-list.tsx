"use client"

import { File, Folder, MoreVertical, FileText, Image, FileArchive } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface FileItem {
  id: string
  name: string
  type: "file" | "folder"
  size?: string
  modified: string
  fileType?: "document" | "image" | "archive" | "other"
}

interface FileListProps {
  viewMode: "grid" | "list"
  searchQuery: string
  files: FileItem[]
}

export function FileList({ viewMode, searchQuery, files }: FileListProps) {
  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
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
            <TableRow key={file.id}>
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

