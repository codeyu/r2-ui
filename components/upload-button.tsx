"use client"

import { Upload, FileUp, FolderUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function UploadButton() {
  return (
    <div className="fixed bottom-6 right-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Upload className="h-6 w-6" />
            <span className="sr-only">アップロード</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <FileUp className="mr-2 h-4 w-4" />
            <span>ファイルをアップロード</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderUp className="mr-2 h-4 w-4" />
            <span>フォルダをアップロード</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

