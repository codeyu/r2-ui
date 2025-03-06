"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Monitor, Plus, Trash2, Check, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { AddEndpointModal } from "@/components/add-endpoint-modal"

interface R2Endpoint {
  id: string
  workerEndpointUrl: string
  workerEndpointApiKey: string
  customDomain?: string
}

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [language, setLanguage] = useState("ja")
  const [endpoints, setEndpoints] = useState<R2Endpoint[]>([])
  const [isAddEndpointOpen, setIsAddEndpointOpen] = useState(false)
  const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null)
  const [editingEndpoint, setEditingEndpoint] = useState<R2Endpoint | null>(null)

  // Load endpoints from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEndpoints = localStorage.getItem("r2Endpoints")
      const activeEndpoint = localStorage.getItem("activeR2Endpoint")

      if (storedEndpoints) {
        try {
          setEndpoints(JSON.parse(storedEndpoints))
        } catch (e) {
          console.error("Failed to parse stored endpoints", e)
        }
      }

      if (activeEndpoint) {
        setActiveEndpointId(activeEndpoint)
      }
    }
  }, [open]) // 設定モーダルが開くたびに再読み込み

  const handleSetActiveEndpoint = (id: string) => {
    setActiveEndpointId(id)
    localStorage.setItem("activeR2Endpoint", id)
  }

  const handleEditEndpoint = (endpoint: R2Endpoint) => {
    setEditingEndpoint(endpoint)
    setIsAddEndpointOpen(true)
  }

  const handleAddEndpoint = (endpoint: R2Endpoint, setAsActive: boolean) => {
    if (editingEndpoint) {
      // 編集モード
      const newEndpoints = endpoints.map((ep) => (ep.id === endpoint.id ? endpoint : ep))
      setEndpoints(newEndpoints)
      localStorage.setItem("r2Endpoints", JSON.stringify(newEndpoints))

      if (setAsActive) {
        setActiveEndpointId(endpoint.id)
        localStorage.setItem("activeR2Endpoint", endpoint.id)
      }

      setEditingEndpoint(null)
    } else {
      // 新規追加モード
      const newEndpoints = [...endpoints, endpoint]
      setEndpoints(newEndpoints)
      localStorage.setItem("r2Endpoints", JSON.stringify(newEndpoints))

      if (setAsActive) {
        setActiveEndpointId(endpoint.id)
        localStorage.setItem("activeR2Endpoint", endpoint.id)
      }
    }
  }

  const handleDeleteEndpoint = (id: string) => {
    const newEndpoints = endpoints.filter((endpoint) => endpoint.id !== id)
    setEndpoints(newEndpoints)
    localStorage.setItem("r2Endpoints", JSON.stringify(newEndpoints))

    // アクティブなエンドポイントが削除された場合、アクティブ状態をクリア
    if (activeEndpointId === id) {
      setActiveEndpointId(null)
      localStorage.removeItem("activeR2Endpoint")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
            <DialogDescription>アプリケーションの設定を変更します。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="theme">テーマ</Label>
              <RadioGroup
                id="theme"
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-1">
                    <Sun className="h-4 w-4" />
                    <span>ライト</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-1">
                    <Moon className="h-4 w-4" />
                    <span>ダーク</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-1">
                    <Monitor className="h-4 w-4" />
                    <span>システム</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">言語</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="言語を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Cloudflare R2 ストレージエンドポイント</Label>
                <Button variant="outline" size="sm" onClick={() => setIsAddEndpointOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {endpoints.length === 0 ? (
                  <p className="text-sm text-muted-foreground">エンドポイントが設定されていません</p>
                ) : (
                  endpoints.map((endpoint) => (
                    <Card key={endpoint.id} className="p-0">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 cursor-pointer" onClick={() => handleEditEndpoint(endpoint)}>
                            <p className="text-sm font-medium truncate">{endpoint.workerEndpointUrl}</p>
                            <p className="text-xs text-muted-foreground">
                              {endpoint.customDomain
                                ? `カスタムドメイン: ${endpoint.customDomain}`
                                : "カスタムドメインなし"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${activeEndpointId === endpoint.id ? "text-green-500" : "text-muted-foreground"}`}
                              onClick={() => handleSetActiveEndpoint(endpoint.id)}
                            >
                              {activeEndpointId === endpoint.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                              <span className="sr-only">使用する</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteEndpoint(endpoint.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">削除</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddEndpointModal
        open={isAddEndpointOpen}
        onOpenChange={(open) => {
          setIsAddEndpointOpen(open)
          if (!open) setEditingEndpoint(null)
        }}
        onAddEndpoint={handleAddEndpoint}
        editEndpoint={editingEndpoint}
      />
    </>
  )
}

