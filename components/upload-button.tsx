"use client"

import { Upload, FileUp, FolderUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { r2Api } from "@/lib/r2Api"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UploadButtonProps {
  onUploadComplete: () => Promise<void>;
}

export function UploadButton({ onUploadComplete }: UploadButtonProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsUploading(false)
      setUploadProgress(0)
      toast({
        title: "Upload cancelled",
        description: "The upload has been cancelled",
        duration: 3000,
      })
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      for (const file of Array.from(files)) {
        console.log('Starting upload for:', file.name);
        
        await r2Api.uploadFile(file, (progress) => {
          console.log(`Upload progress for ${file.name}:`, progress);
          setUploadProgress(progress);
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
      setUploadProgress(0);
    }
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('Files selected:', files.length);
    
    // 获取文件夹路径
    const folderPath = files[0].webkitRelativePath.split('/')[0];
    console.log('Folder name:', folderPath);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // 先创建根文件夹
      await r2Api.createFolder(folderPath);

      // 上传所有文件
      for (const file of Array.from(files)) {
        const relativePath = file.webkitRelativePath;
        console.log('Uploading:', relativePath);
        
        // 确保文件的父文件夹存在
        const pathParts = relativePath.split('/');
        pathParts.pop(); // 移除文件名
        let currentPath = '';
        
        // 创建所有必要的文件夹
        for (const part of pathParts) {
          currentPath += part + '/';
          try {
            await r2Api.createFolder(currentPath.slice(0, -1));
          } catch (error) {
            console.log('Folder might already exist:', currentPath);
          }
        }

        // 上传文件
        await r2Api.uploadFile(file, (progress) => {
          setUploadProgress(progress);
          toast({
            title: `Uploading ${file.name}`,
            description: `Progress: ${Math.round(progress)}%`,
            duration: Infinity,
          });
        }, pathParts.join('/') + '/');
      }

      await onUploadComplete();
      
      toast({
        title: "Folder upload complete",
        description: `${folderPath} has been uploaded`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Folder upload error:', error);
      toast({
        title: "Folder upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed bottom-6 right-6">
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アップロードをキャンセルしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。アップロードを中止してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>いいえ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleCancel()
                setShowCancelDialog(false)
              }}
            >
              はい
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isUploading ? (
        <Button 
          size="icon" 
          className={cn(
            "h-14 w-14 rounded-full shadow-lg relative",
            "animate-pulse"
          )}
          onClick={(e) => {
            e.stopPropagation()
            setShowCancelDialog(true)
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="text-muted-foreground/20"
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              fill="none"
              stroke="currentColor"
            />
            <circle
              className="text-primary transition-all duration-300"
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - uploadProgress / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-medium mb-1">
              {Math.round(uploadProgress)}%
            </span>
            <X className="h-4 w-4" />
          </div>
          <span className="sr-only">キャンセル</span>
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Upload className="h-6 w-6" />
              <span className="sr-only">アップロード</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.onchange = async (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (!files || files.length === 0) return;

                setIsUploading(true);
                setUploadProgress(0);
                abortControllerRef.current = new AbortController();

                try {
                  for (const file of Array.from(files)) {
                    await r2Api.uploadFile(
                      file, 
                      (progress) => {
                        setUploadProgress(progress);
                      },
                      undefined,
                      abortControllerRef.current.signal
                    );
                  }
                  
                  await onUploadComplete();
                  
                  toast({
                    title: "Upload complete",
                    description: "Files have been uploaded successfully",
                    duration: 3000,
                  });
                } catch (error) {
                  if (error.name === 'AbortError') {
                    return;
                  }
                  toast({
                    title: "Upload failed",
                    description: error instanceof Error ? error.message : "An error occurred",
                    variant: "destructive",
                    duration: 5000,
                  });
                } finally {
                  setIsUploading(false);
                  setUploadProgress(0);
                  abortControllerRef.current = null;
                }
              };
              input.click();
            }}>
              <span>ファイルをアップロード</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.webkitdirectory = true;
              input.onchange = (e) => handleFolderUpload(e as React.ChangeEvent<HTMLInputElement>);
              input.click();
            }}>
              <FolderUp className="mr-2 h-4 w-4" />
              <span>フォルダをアップロード</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

