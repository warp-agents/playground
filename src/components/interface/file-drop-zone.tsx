'use client';

import { useDropzone } from 'react-dropzone';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Upload,
  FileType,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { useGlobalContext } from '@/contexts/GlobalContext'

const EXTENSION_TO_MIME: Record<string, string> = {
  'pdf': 'application/pdf',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'csv': 'text/csv',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  'ico': 'image/x-icon'
};

export function FileDropZone({ 
  onDrop, 
  keepOpen=false,
  acceptedTypes,
  className 
}: {
  onDrop?: (files: File | File[]) => void;
  keepOpen?: boolean;
  acceptedTypes: string[];
  className?: string;
}) {
  const { files, setFiles } = useGlobalContext()
  const [isDisplaying, setIsDisplaying] = useState(keepOpen);

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const { items } = e.dataTransfer || {};
      
      if (items) {
        const hasAcceptedFile = Array.from(items).some((item) => {
          if (item.kind !== 'file') return false;
          
          const itemMimeType = item.type;
          
          if (itemMimeType && itemMimeType !== '') {
            const fileExtension = itemMimeType.split('/').pop();

            const matchingMimes = acceptedTypes.map(ext => EXTENSION_TO_MIME[ext]).filter(Boolean);
            if (matchingMimes.includes(itemMimeType)) {
              return true;
            }
          }
          return false;
        });

        if (hasAcceptedFile) {
          setIsDisplaying(true);
        } else if (!keepOpen) {
          setIsDisplaying(false);
        }
      }
    },
    [acceptedTypes, keepOpen]
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(!keepOpen) setIsDisplaying(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(!keepOpen) setIsDisplaying(false);
    
    const { files } = e.dataTransfer || {};
    if (files && files.length > 0) {
      const filesArray = Array.from(files).filter(file => {
        const fileName = file.name || '';
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        
        return fileExtension && acceptedTypes.includes(fileExtension);
      });
      
      if (filesArray.length > 0) {
        if (onDrop) {
          onDrop(filesArray.length === 1 ? filesArray[0] : filesArray);
          return;
        }
        
        setFiles((prevFiles) => [...prevFiles, ...filesArray]);
        setTimeout(() => {
          setFiles([]);
        }, 500);
      }
    }
  }, [onDrop, acceptedTypes, keepOpen, setFiles]);

  useEffect(() => {
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  if (!isDisplaying) return null;

  return (
    <div className={cn(
      'absolute inset-0 z-50 bg-background/80 backdrop-blur-sm',
      'flex items-center justify-center',
      'animate-in fade-in-0 zoom-in-95',
      className
    )}>
      <div className={cn(
        'relative w-full max-w-2xl px-6 py-16',
        'border-2 border-dashed border-primary/50 rounded-lg',
        'flex flex-col items-center justify-center gap-4',
        'bg-background/50',
      )}>
        <div className="relative h-10 w-10 animate-bounce">
          <FileText className="h-9 w-9 absolute top-0 left-[-15px] z-10 rotate-[-8deg]" fill='#212121' />
          <FileSpreadsheet className="h-9 w-9 absolute top-[-12px] left-1/2 transform -translate-x-1/2 z-0" fill='#212121' />
          <FileType className="h-9 w-9 absolute top-[2px] right-[-15px] z-10 rotate-[8deg]" fill='#212121'/>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight">Drop files here</h3>
        <p className="text-sm text-muted-foreground">
          Drop your files anywhere to upload
        </p>
      </div>
    </div>
  );
}