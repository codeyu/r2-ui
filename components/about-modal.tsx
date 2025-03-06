import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>ファイルマネージャーについて</DialogTitle>
          <DialogDescription>ファイル管理のためのシンプルで使いやすいウェブアプリケーション</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="about">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">このサイトについて</TabsTrigger>
            <TabsTrigger value="usage">使用方法</TabsTrigger>
          </TabsList>
          <TabsContent value="about" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-medium">ファイルマネージャー v1.0</h3>
              <p className="text-sm text-muted-foreground mt-2">
                このアプリケーションは、ファイルとフォルダを簡単に管理するためのウェブベースのファイルマネージャーです。
                ファイルのアップロード、ダウンロード、整理が簡単にできます。
              </p>
              <p className="text-sm text-muted-foreground mt-2">© 2023 ファイルマネージャー. All rights reserved.</p>
            </div>
          </TabsContent>
          <TabsContent value="usage" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-medium">基本的な使い方</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2 space-y-2">
                <li>
                  <strong>ファイルのアップロード:</strong>{" "}
                  右下のアップロードボタンをクリックして、ファイルまたはフォルダをアップロードできます。
                </li>
                <li>
                  <strong>新規作成:</strong>{" "}
                  ツールバーの「新規ファイル」または「新規フォルダ」ボタンをクリックして、新しいアイテムを作成できます。
                </li>
                <li>
                  <strong>表示モードの切り替え:</strong>{" "}
                  ツールバーの表示切替ボタンを使用して、グリッド表示とリスト表示を切り替えることができます。
                </li>
                <li>
                  <strong>ファイルの操作:</strong>{" "}
                  ファイルやフォルダの右側にあるメニューボタンをクリックして、開く、ダウンロード、名前変更、削除などの操作を行えます。
                </li>
                <li>
                  <strong>検索:</strong> ツールバーの検索ボックスを使用して、ファイルやフォルダを検索できます。
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

