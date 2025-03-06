"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewFileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateFile: (fileName: string, extension: string) => void
}

export function NewFileModal({ open, onOpenChange, onCreateFile }: NewFileModalProps) {
  const [fileName, setFileName] = useState("")
  const [extension, setExtension] = useState("txt")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fileName.trim()) {
      onCreateFile(fileName.trim(), extension)
      setFileName("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新規ファイル作成</DialogTitle>
            <DialogDescription>新しいファイルの名前と種類を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fileName" className="col-span-4">
                ファイル名
              </Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="col-span-3"
                placeholder="ファイル名を入力"
                autoFocus
                required
              />
              <Select value={extension} onValueChange={setExtension}>
                <SelectTrigger>
                  <SelectValue placeholder="拡張子" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">txt</SelectItem>
                  <SelectItem value="md">md</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

