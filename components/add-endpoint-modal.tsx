"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
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
import { Switch } from "@/components/ui/switch"

interface R2Endpoint {
  id: string
  workerEndpointUrl: string
  workerEndpointApiKey: string
  customDomain?: string
}

interface AddEndpointModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddEndpoint: (endpoint: R2Endpoint, setAsActive: boolean) => void
  editEndpoint: R2Endpoint | null
}

export function AddEndpointModal({ open, onOpenChange, onAddEndpoint, editEndpoint }: AddEndpointModalProps) {
  const [formData, setFormData] = useState({
    workerEndpointUrl: "",
    workerEndpointApiKey: "",
    customDomain: "",
  })
  const [setAsActive, setSetAsActive] = useState(true)

  // 編集モードの場合、フォームに値をセット
  useEffect(() => {
    if (editEndpoint) {
      setFormData({
        workerEndpointUrl: editEndpoint.workerEndpointUrl,
        workerEndpointApiKey: editEndpoint.workerEndpointApiKey,
        customDomain: editEndpoint.customDomain || "",
      })

      // 編集モードでは「使用する」スイッチの状態を現在のアクティブ状態に合わせる
      const activeEndpointId = localStorage.getItem("activeR2Endpoint")
      setSetAsActive(activeEndpointId === editEndpoint.id)
    } else {
      // 新規モードの場合はリセット
      setFormData({
        workerEndpointUrl: "",
        workerEndpointApiKey: "",
        customDomain: "",
      })
      setSetAsActive(true) // デフォルトでオン
    }
  }, [editEndpoint, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newEndpoint: R2Endpoint = {
      id: editEndpoint ? editEndpoint.id : uuidv4(),
      workerEndpointUrl: formData.workerEndpointUrl,
      workerEndpointApiKey: formData.workerEndpointApiKey,
      customDomain: formData.customDomain || undefined,
    }

    onAddEndpoint(newEndpoint, setAsActive)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editEndpoint ? "R2 エンドポイントの編集" : "R2 エンドポイントの追加"}</DialogTitle>
            <DialogDescription>Cloudflare R2 ストレージのエンドポイント情報を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workerEndpointUrl">Workers Endpoint URL</Label>
              <Input
                id="workerEndpointUrl"
                name="workerEndpointUrl"
                value={formData.workerEndpointUrl}
                onChange={handleChange}
                placeholder="https://example.workers.dev"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workerEndpointApiKey">Workers Endpoint API Key</Label>
              <Input
                id="workerEndpointApiKey"
                name="workerEndpointApiKey"
                value={formData.workerEndpointApiKey}
                onChange={handleChange}
                type="password"
                placeholder="API キーを入力"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customDomain">Custom Domain (オプション)</Label>
              <Input
                id="customDomain"
                name="customDomain"
                value={formData.customDomain}
                onChange={handleChange}
                placeholder="example.com"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="use-endpoint" checked={setAsActive} onCheckedChange={setSetAsActive} />
              <Label htmlFor="use-endpoint">このエンドポイントを使用する</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">{editEndpoint ? "更新" : "追加"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

