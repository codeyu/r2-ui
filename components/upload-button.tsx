"use client"

import { Upload, FileUp, FolderUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { r2Api } from "@/lib/r2Api"
import { useState } from "react"

interface UploadButtonProps {
  onUploadComplete: () => Promise<void>;
}

export function UploadButton({ onUploadComplete }: UploadButtonProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        console.log('Starting upload for:', file.name);
        
        await r2Api.uploadFile(file, (progress) => {
          console.log(`Upload progress for ${file.name}:`, progress);
          toast({
            title: `Uploading ${file.name}`,
            description: `Progress: ${Math.round(progress)}%`,
            duration: Infinity,
          });
        });
      }
      
      await onUploadComplete();
      
      toast({
        title: "Upload complete",
        description: "Files have been uploaded successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" disabled={isUploading}>
            <Upload className="h-6 w-6" />
            <span className="sr-only">アップロード</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
            input.click();
          }}>
            <FileUp className="mr-2 h-4 w-4" />
            <span>ファイルをアップロード</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = true;
            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
            input.click();
          }}>
            <FolderUp className="mr-2 h-4 w-4" />
            <span>フォルダをアップロード</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

