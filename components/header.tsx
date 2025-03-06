"use client"

import { Settings, HelpCircle, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onSettingsClick: () => void
  onAboutClick: () => void
}

export function Header({ onSettingsClick, onAboutClick }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <FileIcon className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ファイルマネージャー</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onSettingsClick}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">設定</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onAboutClick}>
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">このサイトについて</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

