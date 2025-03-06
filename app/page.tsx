"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Toolbar } from "@/components/toolbar"
import { FileList } from "@/components/file-list"
import { UploadButton } from "@/components/upload-button"
import { SettingsModal } from "@/components/settings-modal"
import { AboutModal } from "@/components/about-modal"
import { AddEndpointModal } from "@/components/add-endpoint-modal"
import { NewFileModal } from "@/components/new-file-modal"
import { NewFolderModal } from "@/components/new-folder-modal"
import { v4 as uuidv4 } from "uuid"

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddEndpointOpen, setIsAddEndpointOpen] = useState(false)
  const [isNewFileOpen, setIsNewFileOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [files, setFiles] = useState<any[]>([])

  // ページロード時に R2 エンドポイントの存在をチェック
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEndpoints = localStorage.getItem("r2Endpoints")

      // エンドポイントが存在しない場合、追加モーダルを表示
      if (!storedEndpoints || JSON.parse(storedEndpoints).length === 0) {
        setIsAddEndpointOpen(true)
      }

      // ファイルリストの読み込み
      const storedFiles = localStorage.getItem("fileList")
      if (storedFiles) {
        try {
          setFiles(JSON.parse(storedFiles))
        } catch (e) {
          console.error("Failed to parse stored files", e)
        }
      } else {
        // サンプルデータ
        const sampleFiles = [
          { id: "1", name: "ドキュメント", type: "folder", modified: "2023-10-15" },
          { id: "2", name: "画像", type: "folder", modified: "2023-10-14" },
          { id: "3", name: "プロジェクト", type: "folder", modified: "2023-10-13" },
          {
            id: "4",
            name: "レポート.docx",
            type: "file",
            size: "245 KB",
            modified: "2023-10-12",
            fileType: "document",
          },
          {
            id: "5",
            name: "プレゼンテーション.pptx",
            type: "file",
            size: "1.2 MB",
            modified: "2023-10-11",
            fileType: "document",
          },
          {
            id: "6",
            name: "スクリーンショット.png",
            type: "file",
            size: "450 KB",
            modified: "2023-10-10",
            fileType: "image",
          },
          {
            id: "7",
            name: "バックアップ.zip",
            type: "file",
            size: "3.5 MB",
            modified: "2023-10-09",
            fileType: "archive",
          },
          { id: "8", name: "メモ.txt", type: "file", size: "12 KB", modified: "2023-10-08", fileType: "document" },
        ]
        setFiles(sampleFiles)
        localStorage.setItem("fileList", JSON.stringify(sampleFiles))
      }
    }
  }, [])

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
  const handleCreateFile = (fileName: string, extension: string) => {
    const now = new Date()
    const formattedDate = now.toISOString().split("T")[0]

    const newFile = {
      id: uuidv4(),
      name: `${fileName}.${extension}`,
      type: "file",
      size: "0 KB",
      modified: formattedDate,
      fileType: extension === "md" ? "document" : "document",
      content: "",
    }

    const updatedFiles = [...files, newFile]
    setFiles(updatedFiles)
    localStorage.setItem("fileList", JSON.stringify(updatedFiles))
  }

  // 新規フォルダ作成
  const handleCreateFolder = (folderName: string) => {
    const now = new Date()
    const formattedDate = now.toISOString().split("T")[0]

    const newFolder = {
      id: uuidv4(),
      name: folderName,
      type: "folder",
      modified: formattedDate,
    }

    const updatedFiles = [...files, newFolder]
    setFiles(updatedFiles)
    localStorage.setItem("fileList", JSON.stringify(updatedFiles))
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
          <FileList viewMode={viewMode} searchQuery={searchQuery} files={files} />
          <UploadButton />
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

