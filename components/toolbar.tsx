"use client"

import { Search, Grid, List, FileUp, FolderUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ToolbarProps {
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onNewFileClick: () => void
  onNewFolderClick: () => void
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchQueryChange,
  onNewFileClick,
  onNewFolderClick,
}: ToolbarProps) {
  return (
    <div className="border-b p-4">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewFileClick}>
            <FileUp className="mr-2 h-4 w-4" />
            新規ファイル
          </Button>
          <Button variant="outline" size="sm" onClick={onNewFolderClick}>
            <FolderUp className="mr-2 h-4 w-4" />
            新規フォルダ
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="検索..."
              className="w-[200px] pl-8 md:w-[300px]"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && onViewModeChange(value as "grid" | "list")}
          >
            <ToggleGroupItem value="grid" aria-label="カード表示">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="リスト表示">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}

