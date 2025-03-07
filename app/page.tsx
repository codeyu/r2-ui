"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Toolbar } from "@/components/toolbar"
import { FileList } from "@/components/file-list"
import { UploadButton } from "@/components/upload-button"
import { SettingsModal } from "@/components/settings-modal"
import { AboutModal } from "@/components/about-modal"
import { AddEndpointModal } from "@/components/add-endpoint-modal"
import { NewFileModal } from "@/components/new-file-modal"
import { NewFolderModal } from "@/components/new-folder-modal"
import { r2Api } from "@/lib/r2Api"
import { FileItem } from "@/lib/r2Api"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddEndpointOpen, setIsAddEndpointOpen] = useState(false)
  const [isNewFileOpen, setIsNewFileOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchFiles = useCallback(async () => {
    console.log('Fetching files...') // 添加日志
    try {
      setIsLoading(true)
      const data = await r2Api.listFiles()
      setFiles(data)
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // 检查 R2 端点并获取文件列表
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEndpoints = localStorage.getItem("r2Endpoints")

      if (!storedEndpoints || JSON.parse(storedEndpoints).length === 0) {
        setIsAddEndpointOpen(true)
      } else {
        fetchFiles()
      }
    }
  }, []) // 移除 fetchFiles 依赖，只在组件挂载时执行一次

  // 新しいエンドポイントが追加された時の処理
  const handleAddEndpoint = (endpoint: any, setAsActive: boolean) => {
    // 既存のエンドポイントを取得
    const storedEndpoints = localStorage.getItem("r2Endpoints")
    let endpoints = []

    if (storedEndpoints) {
      try {
        endpoints = JSON.parse(storedEndpoints)
      } catch (e) {
        console.error("Failed to parse stored endpoints", e)
      }
    }

    // 新しいエンドポイントを追加
    const newEndpoints = [...endpoints, endpoint]
    localStorage.setItem("r2Endpoints", JSON.stringify(newEndpoints))

    // アクティブに設定する場合
    if (setAsActive) {
      localStorage.setItem("activeR2Endpoint", endpoint.id)
    }

    setIsAddEndpointOpen(false)
  }

  // 新規ファイル作成
  const handleCreateFile = async (fileName: string, extension: string) => {
    try {
      await r2Api.createFile(fileName, extension);
      await fetchFiles(); // 重新加载文件列表
      toast({
        title: "File created",
        description: `${fileName}.${extension} has been created`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to create file",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  // 新規フォルダ作成
  const handleCreateFolder = async (folderName: string) => {
    try {
      await r2Api.createFolder(folderName);
      await fetchFiles(); // 重新加载文件列表
      toast({
        title: "Folder created",
        description: `${folderName} has been created`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to create folder",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} onAboutClick={() => setIsAboutOpen(true)} />
      <main className="flex-1 flex flex-col">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onNewFileClick={() => setIsNewFileOpen(true)}
          onNewFolderClick={() => setIsNewFolderOpen(true)}
        />
        <div className="flex-1 relative">
          <FileList viewMode={viewMode} searchQuery={searchQuery} files={files} onRefresh={fetchFiles} />
          <UploadButton onUploadComplete={fetchFiles} />
        </div>
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <AboutModal open={isAboutOpen} onOpenChange={setIsAboutOpen} />
      <AddEndpointModal
        open={isAddEndpointOpen}
        onOpenChange={setIsAddEndpointOpen}
        onAddEndpoint={handleAddEndpoint}
        editEndpoint={null}
      />
      <NewFileModal open={isNewFileOpen} onOpenChange={setIsNewFileOpen} onCreateFile={handleCreateFile} />
      <NewFolderModal open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen} onCreateFolder={handleCreateFolder} />
    </div>
  )
}

