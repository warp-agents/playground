"use client"

import { useRef, useEffect, useState, use } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { 
  Paperclip, 
  ArrowUp,
  ArrowRight,
  Mic,
  Square,
  Hand,
  Wand,
  Shapes,
  Sparkles,
  ChevronDown,
  X,
  Rotate3d,
  Ban,
  BookText,
  Database,
  Mail,
  Settings,
  Settings2,
  Search,
  Table2,
  CircleStop,
  FileType,
  Earth,
  AudioLines,
  LibraryBig,
  FileArchive,
  File,
  Brain,
  FolderArchive,
  ScanSearch,
  MoreHorizontal,
  ShieldCheck,
  Images,
  FileText,
  Plus,
  Upload,
  Image,
} from "lucide-react"
import { LuFilter } from "react-icons/lu";
import { TbChartAreaLineFilled } from "react-icons/tb";
import { RiQuillPenAiLine } from "react-icons/ri";
import { IoBan } from "react-icons/io5";
import { PiTruckTrailerBold } from "react-icons/pi";
import { TbBuildingFactory2 } from "react-icons/tb";
import { GrOverview } from "react-icons/gr";
import { HiOutlineCubeTransparent } from "react-icons/hi";
import { FaTruckFast } from "react-icons/fa6";
import { BiSliderAlt } from "react-icons/bi";
import { RiChatAiLine } from "react-icons/ri";
import { Calendar } from "@/components/ui/calendar";
import { TbSparkles } from "react-icons/tb";
import { LuNetwork } from "react-icons/lu";
import { FaRobot } from "react-icons/fa6";
import { LuGlobe } from "react-icons/lu";
import { TbBolt } from "react-icons/tb";
import { TbPhoneSpark } from "react-icons/tb";
import { TbMailSpark } from "react-icons/tb";
import { RiVoiceAiFill } from "react-icons/ri";
import { TbWorldSearch } from "react-icons/tb";
import { LiaToolsSolid } from "react-icons/lia";
import { TbFileTextSpark } from "react-icons/tb";
import { LuShieldCheck } from "react-icons/lu";
import { FaBalanceScaleLeft } from "react-icons/fa";
import { PiToolboxBold } from "react-icons/pi";
import { BsFillPauseFill } from "react-icons/bs";
import { FaTruckLoading } from "react-icons/fa";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TbAdjustments } from "react-icons/tb";
import { TbWand } from "react-icons/tb";
import { CgToolbox } from "react-icons/cg";
import { TbRobot } from "react-icons/tb";
import { TbRobotOff } from "react-icons/tb";
import { LuSettings2 } from "react-icons/lu";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GPTInputPopover } from "./gpt-input-popover"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TbPhotoSearch } from "react-icons/tb";
import { AdvancedSettings } from "@/lib/types";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { Textarea } from "@/components/ui/textarea"
import { AutosizeTextarea } from '@/components/ui/autosize-textarea';
import { Icons } from "@/components/ui/icons"
import { useGlobalContext } from '@/contexts/GlobalContext'
import { createChat, addTranscript } from "@/lib/dbs/supabase"
import { useSession } from "next-auth/react"
import { redirect } from 'next/navigation'
import { cn, ngrokUrl } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const FormSchema = z.object({
  bio: z
    .string()
    .min(10, {
      message: "Input must be at least 10 tokens.",
    })
    .max(1024, {
      message: "Input must not be longer than 1024 tokens.",
    }),
})

type UploadFile = {
  file: File;
  isLoading: boolean;
  progress: number;
  storedFilename?: string;
}

export function GPTTextareaForm({ 
  extend=false,
  id,
  chatId,
  placeholder, 
  disclaimer, 
  description=true,
  allowAttachments=false, 
  allowAudio=false, 
  allowFilter=false, 
  allowWebSearch=false,
  allowAgents=false,
  allowReverseImageSearch=false,
  autoSize=false, 
  direction="up",
  className, 
  shortcutFiles,
  shortcutPrompt,
  onShortcutFilesChange,
  onModeChange,
  onInferenceStateChange, 
  onInferenceComplete,
  onUserInput,
  onSystemInput,
}: { 
  extend?: boolean,
  id: string,
  chatId?: string,
  placeholder: string, 
  disclaimer?: string, 
  description?: boolean,
  allowAttachments?: boolean, 
  allowAudio?: boolean, 
  allowFilter?: boolean, 
  allowWebSearch?: boolean,
  allowAgents?: boolean,
  allowReverseImageSearch?: boolean,
  autoSize?: boolean, 
  direction?: "up" | "right" | "down" | "left",
  className?: string, 
  shortcutFiles?: File[],
  shortcutPrompt?: string,
  onShortcutFilesChange?: (files: File[]) => void,
  onModeChange?: (mode: 'chat' | 'agents') => void
  onInferenceStateChange?: (state: boolean) => void
  onInferenceComplete? : (data: any) => void
  //
  onUserInput?: (input: {
    content: string,
    createdAt: Date,
    id: string,
    system?: boolean
  }) => void
  onSystemInput?: (input: {
    content: string,
    createdAt: Date,
    id: string,
    system?: boolean
  }) => void
  }) {
  const { data: session, status } = useSession()
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const { files, setFiles } = useGlobalContext()
  const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([]);
  const [prompt, setPrompt] = useState("");
  const [hasExceededMinLength, setHasExceededMinLength] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingIndex, setIsDeletingIndex] = useState<number | null>(null);
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(false);
  const [shouldReverseSearchImage, setShouldReverseSearchImage] = useState(false);
  const [gptPopoverOpen, setGptPopoverOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'agents'>('chat');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previouslySubmitted = useRef<z.infer<typeof FormSchema> | null>(null);

  const isAuthenticated = status === "authenticated" && session

  const { transcript, browserSupportsSpeechRecognition, resetTranscript, listening } = useSpeechRecognition()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const id = (session as any)?.user?.id
    let content = prompt; 

    if (selectedFiles && selectedFiles.length > 0) {
      const fileMarkdownLinks = selectedFiles
        .map(file => `[${file.file.name}](${file.file.name})`)
        .join('\n');
      
      content = `${fileMarkdownLinks}\n\n${prompt}`;
    }

    previouslySubmitted.current = data;
    setIsRunningInference(true)
    onInferenceStateChange?.(true)
    if(!chatId && !extend && id){
      const chatId = await createChat(id)
      await addTranscript({sourceType: "chat", sourceId: chatId, content: content, system: false})
      redirect(`/c/${chatId}`)
    }
    if(extend){
      onUserInput?.({
        content: content,
        createdAt: new Date(),
        id: uuidv4(),
        system: false
      })
    }
    try {
      const processedFiles = await Promise.all(
        files.map(async (file: File) => {
          const base64Content = await convertFileToBase64(file);
          return {
            name: file.name,
            content: base64Content,
            type: file.type,
          };
        })
      );

      const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      const baseUrl = ngrokUrl || process.env.NGROK_URL;

      let body;
      if (shouldSearch) {
        body = JSON.stringify({
          prompt: prompt
        });
      } else {
        body = JSON.stringify({
          prompt: prompt,
          model: "gpt-4.1-2025-04-14",
          files: processedFiles
        });
      }

      const response = await fetch(`${baseUrl}/${shouldSearch?"search":"process"}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null); 
        // console.error('Error response data:', errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const content = responseData.response

      if(!extend && id){
        const chatId = await createChat(id)
        await addTranscript({sourceType: "chat", sourceId: chatId, content: content, system: true})
      }else if(extend){
        onSystemInput?.({
          content: content,
          createdAt: new Date(),
          id: uuidv4(),
          system: true
        })
      }
    } catch (err) {
      // console.error("Fetch failed:", err);
      toast.error("Error getting LLM response", {
        description: "Please try again.",
        action: {
          label: "Retry",
          onClick: () => {
            if (previouslySubmitted.current) {
              onSubmit(previouslySubmitted.current);
            }
          },
        },
      });
    }finally{
      setIsRunningInference(false)
      onInferenceStateChange?.(false)  
      setPrompt('')
      clearAllFiles()
      setFiles([])
    }
  }

  const uploadFile = (fileInfo: UploadFile) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    xhr.open('POST', '/api/upload', true);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        
        setSelectedFiles(current => 
          current.map(f => {
            if (f.file.name === fileInfo.file.name && f.file.size === fileInfo.file.size && 
                !f.storedFilename) {
              return { ...f, progress };
            }
            return f;
          })
        );
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const uploadedFile = response.files[0];
        
        setSelectedFiles(current => 
          current.map(f => {
            if (f.file.name === fileInfo.file.name && f.file.size === fileInfo.file.size && 
                !f.storedFilename) {
              return { 
                ...f, 
                isLoading: false, 
                progress: 100,
                storedFilename: uploadedFile.storedFilename,
                uploadId: Date.now().toString()
              };
            }
            return f;
          })
        );
        console.log('Upload response:', xhr.responseText);
      } else {
        // Handle error
        toast("File upload failed", {
          description: "Please try again.",
          action: {
            label: "Retry",
            onClick: () => (document.getElementById(id) as HTMLInputElement).click()
          },
        });
        setSelectedFiles(current =>
          current.filter(f => !(f.file.name === fileInfo.file.name && f.file.size === fileInfo.file.size && 
                               !f.storedFilename))
        );
      }
    };
    
    xhr.onerror = () => {
      toast("Error uploading file", {
        description: "Please try again.",
        action: {
          label: "Retry",
          onClick: () => (document.getElementById(id) as HTMLInputElement).click()
        },
      });
      setSelectedFiles(current =>
        current.filter(f => !(f.file.name === fileInfo.file.name && f.file.size === fileInfo.file.size && 
                             !f.storedFilename))
      );
    };
    
    formData.append('file', fileInfo.file);
    xhr.send(formData);
  };

  const handleModeChange = (mode: 'agents' | 'chat') => {
    setMode(mode)
    onModeChange?.(mode)
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    
    if (fileList && fileList.length) {
      const files = Array.from(fileList);
      
      const filesWithLoadingState = files.map((file: File) => ({
        file,
        isLoading: true,
        progress: 0
      }));
      
      const limitedFiles = filesWithLoadingState.slice(0, 3 - selectedFiles.length);
      setSelectedFiles(prev => [...prev, ...limitedFiles]);
      
      limitedFiles.forEach((fileInfo) => {
        uploadFile(fileInfo);
      });
      
      event.target.value = "";
    }
  };
  
  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    
    if (!fileToRemove.isLoading && fileToRemove.storedFilename) {
      console.log('Removing file:', fileToRemove.storedFilename);
      deleteFile(fileToRemove.storedFilename, index);
    }
  };
  
  const deleteFile = (filename: string, index: number) => {
    setIsDeletingIndex(index)
    return fetch(`/api/delete?filename=${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete file');
        }
        return response.json();
      })
      .then(data => {
        setIsDeletingIndex(null)
        setSelectedFiles(current => current.filter((_, i) => i !== index));
        return data;
      })
      .catch(error => {
        setIsDeletingIndex(null)
        toast("Delete failed",{
          description: "Could not delete the file. Please try again.",
        });
        throw error;
      });
  };
  
  const deleteAllFiles = () => {
    const deletePromises = selectedFiles
      .filter(file => file.storedFilename) 
      .map(file => 
        fetch(`/api/delete?filename=${encodeURIComponent(file.storedFilename!)}`, {
          method: 'DELETE',
        })
      );
    
    Promise.all(deletePromises)
      .then(() => {
        setSelectedFiles([]);
      })
      .catch(error => {
        toast("Delete failed",{
          description: "Could not delete all files. Please try again.",
        });
        // console.error(error);
      });
  };
  
  const clearAllFiles = () => {
    deleteAllFiles();
    setFiles([])
  };

  const handlePopoverClose = () => {
    setGptPopoverOpen(false);
  }
      
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === " " && prompt === "") {
      e.preventDefault();
      setGptPopoverOpen(true);
    } else if (e.key === 'Tab' && prompt.trim()) {
      e.preventDefault();
    }
  };

  const onPopoverResponse = (value: string) => {
    setPrompt(value)
  };

  const startRecording = () => {
    resetTranscript()
    SpeechRecognition.startListening({ continuous: true }) 
  }

  const stopRecording = () => {
    setTimeout(() => {
      SpeechRecognition.stopListening();
      if (transcript.trim()) {
        setPrompt((prevPrompt) => `${prevPrompt} ${transcript}`.trim());
        resetTranscript();
      }
    }, 1500);
  }

  useEffect(() => {
    if(files.length > 0 && id === "gpt-textarea"){
      if (files && files.length) {
        
        const filesWithLoadingState = files.map((file: File) => ({
          file,
          isLoading: true,
          progress: 0
        }));
        
        const limitedFiles = filesWithLoadingState.slice(0, 3 - selectedFiles.length);
        setSelectedFiles(prev => [...prev, ...limitedFiles]);
        
        limitedFiles.forEach((fileInfo) => {
          uploadFile(fileInfo);
        });
      }
    }
  }, [files])

  useEffect(() => {
    setHasExceededMinLength(prompt.length < 10);
    if(prompt.length > 1024){
      toast.error("Max token exceeded!", {
        description: `Prompt is too long. Please keep it under 1024 tokens`,
      });
    }
  }, [prompt])

  useEffect(() => {
    if (shortcutFiles && shortcutFiles.length > 0) {
      const filesWithLoadingState = shortcutFiles.map((file: File) => ({
        file,
        isLoading: true,
        progress: 0
      }));
      
      const limitedFiles = filesWithLoadingState.slice(0, 3 - selectedFiles.length);
      setSelectedFiles(prev => [...prev, ...limitedFiles]);
      
      limitedFiles.forEach((fileInfo) => {
        uploadFile(fileInfo);
      });
      
      onShortcutFilesChange?.([]);
    }
  }, [shortcutFiles])

  useEffect(() => {
    if(shortcutPrompt){
      setPrompt(shortcutPrompt)
    }
  }, [shortcutPrompt])

  const renderTools = () => (
      <>
        {allowAttachments && 
          <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label htmlFor={id}>
              <Button
                  variant="ghost"
                  size="icon"
                  className={`bg-transparent`}
                  onClick={() => (document.getElementById(id) as HTMLInputElement).click()}
                >
                  <Paperclip />
                </Button>
              </label>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{"Select or drag 'n' drop a file"}</p>
            </TooltipContent>
          </Tooltip>
          <input 
            id={id} 
            type="file" 
            accept=".pdf,.xlsx,.xls,.doc,.docx,.csv,.zip,.rar,.jpeg,.jpg,.png"
            multiple 
            hidden 
            onChange={handleFileChange}
          />
        </TooltipProvider>}

        {allowWebSearch &&
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild> 
              <Button onClick={(e) => {e.preventDefault(), setShouldSearch(!shouldSearch)}} className={cn(shouldSearch && "text-blue-500 hover:text-blue-500")} variant="ghost" size="icon">
                <LuGlobe/>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Web Search</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>}

        {allowReverseImageSearch &&
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild> 
              <Button onClick={(e) => {e.preventDefault(), setShouldReverseSearchImage(!shouldReverseSearchImage)}} className={cn(shouldReverseSearchImage && "text-blue-500 hover:text-blue-500")} variant="ghost" size="icon">
                <ScanSearch/>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Reverse Image Search</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>}

        {allowFilter && 
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                
              <Button onClick={(e) => {e.preventDefault(), setIsFilterDialogOpen(true)}} className="" variant="ghost" size="icon">
                <Settings2 className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Filter</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }

        <AdvancedSettingsDialog/>

        {/* <Button onClick={(e) => {e.preventDefault(), clearAllFiles()}} className="" variant="ghost" size="icon">
          <X className="h-4 w-4"/>
        </Button> */}
      </>
    );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }: any) => (
            <FormItem>

            <GPTInputPopover 
              open={gptPopoverOpen} 
              placeholder={"Ask for prompt suggestions..."}
              onResponse={onPopoverResponse}
              onClose={handlePopoverClose}
              className="bg-input rounded-2xl"
              systemPrompt={`You are a helpful writing assistant.Generate a detailed prompt for the following text. The prompt should be more than **1024 characters**. Do not include any explanation, labels, or extra text: \n\n`}
              border 
              >
              <div className="relative">
                {selectedFiles.length !== 0 && (
                  <div className="flex h-fit p-1 rounded-t-xl bg-input">
                    <ScrollArea className="w-full max-w-[calc(100vw-2rem)] md:max-w-full">
                      <div className="flex flex-row space-x-1 min-w-fit">
                        {selectedFiles.map((fileInfo: UploadFile, index: number) => {
                          const file = fileInfo.file 
                          const fileExtension = file.name.split(".").pop()?.toLowerCase() as string;
                          const isImageFile = ['jpg', 'jpeg', 'png'].includes(fileExtension);
                          
                          const fileProperties = {
                            pdf: { bgColor: "bg-blue-800", fgColor: "text-blue-300", icon: <FileText className="text-blue-300 h-5 w-5" />, label: "PDF" },
                            doc: { bgColor: "bg-purple-700", fgColor: "text-purple-300", icon: <FileType className="text-purple-300 h-5 w-5" />, label: "Document" },
                            docx: { bgColor: "bg-purple-700", fgColor: "text-purple-300", icon: <FileType className="text-purple-300 h-5 w-5" />, label: "Document" },
                            csv: { bgColor: "bg-green-700", fgColor: "text-green-300", icon: <Table2 className="text-green-300 h-5 w-5" />, label: "Spreadsheet" },
                            xlsx: { bgColor: "bg-green-700", fgColor: "text-green-300", icon: <Table2 className="text-green-300 h-5 w-5" />, label: "Spreadsheet" },
                            xls: { bgColor: "bg-green-700", fgColor: "text-green-300", icon: <Table2 className="text-green-300 h-5 w-5" />, label: "Spreadsheet" },
                            txt: { bgColor: "bg-gray-700", fgColor: "text-gray-300", icon: <FileText className="text-gray-300 h-5 w-5" />, label: "Text" },
                            zip: { bgColor: "bg-yellow-700", fgColor: "text-yellow-300", icon: <FileArchive className="text-yellow-300 h-5 w-5" />, label: "Archive" },
                            rar: { bgColor: "bg-yellow-700", fgColor: "text-yellow-300", icon: <FileArchive className="text-yellow-300 h-5 w-5" />, label: "Archive" },
                            jpg: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
                            jpeg: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
                            png: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
                          }[fileExtension] || { bgColor: "bg-gray-900", fgColor: "text-gray-300", icon: <File className="text-gray-300 h-5 w-5" />, label: "Unknown" };

                          const formatFileSize = (bytes: number) => {
                            if (bytes === 0) return '0 B';
                            const sizes = ['B', 'KB', 'MB', 'GB'];
                            const i = Math.floor(Math.log(bytes) / Math.log(1024));
                            return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
                          };
                          const fileSize = formatFileSize(file.size);

                          const isLoading = fileInfo.isLoading;

                          return (
                            <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  key={index}
                                  className={
                                    cn("p-1.5 flex gap-2 items-center border border-muted-foreground/20 rounded-xl w-fit bg-background cursor-default shrink-0", 
                                    isDeletingIndex === index && "animate-pulse")}
                                >
                                  <div
                                    className={cn(`flex items-center justify-center rounded-md`, 
                                     fileProperties.bgColor,
                                     fileProperties.label === "Image" && !isLoading ? "p-0" : "p-2")}
                                  >
                                    {isLoading ? (
                                      <Icons.loader percentage={fileInfo.progress} size={20} strokeWidth={3} className={fileProperties.fgColor} />
                                    ) : isImageFile ? (
                                      <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={file.name}
                                        className="h-[36px] w-[36px] object-cover rounded-md"
                                      />
                                    ) : (
                                      fileProperties.icon
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="text-white text-sm w-[100px] truncate">{file.name}</div>
                                    <div className="text-muted-foreground text-xs flex justify-between w-full">
                                      <span>{fileProperties.label}</span>
                                      <span className="ml-2 text-muted-foreground/10">{fileSize}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 ml-auto"
                                    onClick={() => removeFile(index)}
                                  >
                                  <X className={cn("h-4 w-4")} />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{file.name}</p>
                              </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                  )}
                <div className="relative" style={{ paddingBottom: "48px" }}>
                  <FormControl>
                    {autoSize ? 
                      <div className="w-full h-fit">
                        <AutosizeTextarea
                          placeholder={placeholder}
                          className={`resize-none w-full ${className} px-4 pt-3 pb-12 rounded-b-none h-[60px] text-base ${selectedFiles.length !== 0 ? '!rounded-t-none' : '!rounded-t-2xl'}`}
                          maxHeight={200}
                          maxLength={800}
                          value={prompt+transcript}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const promptLength = newValue.length - transcript.length;
                            const newPrompt = promptLength >= 0 ? newValue.slice(0, promptLength) : newValue;
                            setPrompt(newPrompt);
                            field.onChange(e);
                          }}
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                    :
                      <Textarea
                        placeholder={placeholder}
                        className={`resize-none w-full ${className} px-4 pt-3 pb-12 rounded-b-none text-base ${selectedFiles.length !== 0 ? '!rounded-t-none' : '!rounded-t-2xl'}`}
                        {...field}
                        value={prompt}
                        onChange={(e) => {
                          setPrompt(e.target.value);
                          field.onChange(e);
                        }}
                        onKeyDown={handleKeyDown}
                      />
                      }
                  </FormControl>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-input rounded-b-2xl">
                    <div className="absolute bottom-[6px] z-20 left-2">
                      <div className="flex lg:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-transparent flex items-center justify-center rounded-full border border-muted-foreground/20 p-2"
                            >
                              <div className="flex items-center space-x-1">
                                <Plus className="h-4 w-4 mx-1" />
                                <Separator orientation="vertical" className="h-4 w-px bg-muted-foreground/20" />
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-fit bg-input flex flex-col lg:hidden">
                            <div className="px-2 py-1.5 mb-1">
                              <h3 className="text-sm font-medium">More Tools</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Choose one or more tools to include
                              </p>
                            </div>
                            <DropdownMenuSeparator className="my-1" />
                            <div className="flex">
                            {renderTools()}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="hidden gap-1 lg:flex">
                        {renderTools()}
                      </div>
                    </div>
                    <div className="absolute bottom-[6px] z-20 right-2 flex gap-1 items-center">
                      {allowAudio && <Button
                        size="icon"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        variant="ghost"
                        type="submit"
                        className="hidden md:flex border-border active:bg-blue-500 active:border-blue-500 transition-colors bg-transparent"
                      >
                        <Mic/>
                      </Button>}
                      {allowAgents && 
                      <div className="w-fit h-fit flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="bg-transparent"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-fit bg-input flex flex-col">
                          <div className="px-2 py-1.5 mb-1">
                              <h3 className="text-sm font-medium">Modes</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Choose a mode
                              </p>
                            </div>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={() => handleModeChange('chat')}
                              className={cn(
                                "data-[state=highlighted]:bg-muted-foreground/20",
                                mode === "chat" && "bg-muted"
                              )}
                            >
                              Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleModeChange('agents')}
                              className={cn(
                                "data-[state=highlighted]:bg-muted-foreground/20",
                                mode === "agents" && "bg-muted"
                              )}
                            >
                              Agents
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Separator orientation="vertical" className="h-4 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
                      </div>}
                      { !isRunningInference ? <Button variant="ghost" type="submit" disabled={hasExceededMinLength || isRunningInference || isLoading || !isAuthenticated || mode === "agents"} className="bg-transparent" size="icon">
                         { direction === "right" ? <ArrowRight/> : <ArrowUp /> }
                      </Button>:
                      <Button variant="ghost" className="bg-transparent" size="icon">
                       <CircleStop /> 
                      </Button>}
                    </div>
                  </div>
                </div>
              {description && <FormDescription className={`text-xs text-muted-foreground text-center mt-1`}>
                {disclaimer}
              </FormDescription>}
              </div>
              </GPTInputPopover>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

const AVAILABLE_MODELS = [
  'Gemini-2.5-Pro-Exp-03-25',
  'DeepSeek-V3',
  'DeepSeek-R1',
  'LLAMA 3.2'
] as const;

const AVAILABLE_AGENTS = [
  'Email Agent',
  'Voice Agent',
  'Web Search Agent',
  'Documentation Agent',
  'Compliance Agent'
] as const;

const AVAILABLE_DOCUMENTS = [
  'Federal Aquisition Regulation (FAR)',
  'Defense Federal Aquisition Regulation Supplement (DFARS)',
  'International Trade Agreement (ITAR)',
  'Contract Audit Manual (CAM)',
  'Export Administration Regulations (EAR)',
] as const;

export function AdvancedSettingsDialog({
  initialSettings,
  onSettingsChange
}: {
  initialSettings?: Partial<AdvancedSettings>;
  onSettingsChange?: (settings: AdvancedSettings) => void;
}) {
  const [gptPopoverOpen, setGptPopoverOpen] = useState(false);
  const [shouldEnhance, setShouldEnhance] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectOpen, setSelectOpen] = useState(false);
  const [settings, setSettings] = useState<AdvancedSettings>({
    model: initialSettings?.model || AVAILABLE_MODELS[0],
    agents: initialSettings?.agents || [AVAILABLE_AGENTS[0]],
    systemPrompt: initialSettings?.systemPrompt || "",
    documents: initialSettings?.documents || [],
    temperature: initialSettings?.temperature || 0.7,
    maxTokens: initialSettings?.maxTokens || 2048
  });

  const updateSettings = <K extends keyof AdvancedSettings>(
    key: K,
    value: AdvancedSettings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      return newSettings;
    });
  };

  const allAgentsSelected = AVAILABLE_AGENTS.length === settings.agents.length;
  const selectedAgentCount = settings.agents.length;
  const allDocumentsSelected = AVAILABLE_DOCUMENTS.length === settings.documents.length;
  const selectedDocumentCount = settings.documents.length;

  const handleSelectAllAgents = (checked: boolean) => {
    updateSettings("agents", checked ? [...AVAILABLE_AGENTS] : []);
  };

  const handleSelectAllDocuments = (checked: boolean) => {
    updateSettings("documents", checked ? [...AVAILABLE_DOCUMENTS] : []);
  };

  const handleAgentChange = (agent: string, checked: boolean) => {
    const newValue = checked
      ? [...settings.agents, agent]
      : settings.agents.filter((v) => v !== agent);
    updateSettings("agents", newValue);
  };

  const handleDocumentsChange = (document: string, checked: boolean) => {
    const newValue = checked
      ? [...settings.documents, document]
      : settings.documents.filter((v) => v !== document);
    updateSettings("documents", newValue);
  };

  const handlePopoverClose = () => {
    setGptPopoverOpen(false);
  }
      
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === " " && settings.systemPrompt === "") {
      e.preventDefault();
      setGptPopoverOpen(true);
    } else if (e.key === 'Tab' && settings.systemPrompt.trim()) {
      e.preventDefault();
    }
  };

  const onPopoverResponse = (value: string) => {
    updateSettings("systemPrompt", value)
  };

  const handleSave = () => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    setIsOpen(false);
  };

  const filteredDocuments = AVAILABLE_DOCUMENTS.filter((document: string) => (
    !inputValue.trim() || document.toLowerCase().includes(inputValue.toLowerCase())
  ))

  return (
    <TooltipProvider>
      <Tooltip>
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <DialogTrigger asChild>
          <TooltipTrigger asChild> 
            <Button 
              variant="ghost" 
              size="icon"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          </DialogTrigger>
          <DialogContent 
          className="sm:max-w-[700px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-popover"
          onClick={(e) => e.stopPropagation()}
          onPointerDownOutside={(e) => {
            if (selectOpen) {
              e.preventDefault();
            }
          }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg pl-4 pt-4">
                Advanced
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-grow gap-6 p-4">
              <div className="w-[225px] space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="model-select" className="text-sm font-medium leading-none">
                      AI Model
                    </label>
                  </div>
                  <Select 
                  onOpenChange={(open) => {
                    setSelectOpen(open);
                  }}
                  value={settings.model} onValueChange={(value) => updateSettings("model", value)}>
                    <SelectTrigger id="model-select" className="w-full focus:outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent 
                    className={
                      cn(`p-0 h-fit `,
                      isOpen && "min-w-[var(--radix-select-trigger-width)]"
                      )} 
                    >
                      <SelectGroup>
                        <SelectLabel>Available Models</SelectLabel>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
            
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium leading-none">
                      Agent Types
                    </label>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="truncate">
                          {selectedAgentCount === 0
                            ? "Select agents..."
                            : selectedAgentCount === AVAILABLE_AGENTS.length
                            ? "All agents selected"
                            : `${selectedAgentCount} agent${selectedAgentCount === 1 ? "" : "s"} selected`}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                    className={
                    cn(`p-0 h-fit `,
                    isOpen && "w-[var(--radix-popover-trigger-width)]"
                    )} 
                    align="start">
                      <div className="p-2 border-b">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="select-all-agents"
                            checked={allAgentsSelected}
                            onCheckedChange={(checked: boolean) => handleSelectAllAgents(checked)}
                            className="data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor="select-all-agents"
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            Select All Agents
                          </label>
                        </div>
                      </div>
                      <ScrollArea className="max-h-[200px]">
                        <div className="p-2 space-y-1">
                          {AVAILABLE_AGENTS.map((agent) => (
                            <div key={agent} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`agent-${agent}`}
                                checked={settings.agents.includes(agent)}
                                onCheckedChange={(checked) =>
                                  handleAgentChange(agent, checked as boolean)
                                }
                                onSelect={(e: any) => e.stopPropagation()}
                                className="data-[state=checked]:bg-primary"
                              />
                              <label
                                htmlFor={`agent-${agent}`}
                                className="text-sm leading-none cursor-pointer"
                              >
                                {agent}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="temperature-slider" className="text-sm font-medium leading-none">
                        Temperature
                      </label>
                      <span className="text-xs px-2 py-1 rounded-md bg-secondary">
                        {settings.temperature.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      id="temperature-slider"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[settings.temperature]}
                      onValueChange={(values: number[]) => updateSettings("temperature", values[0])}
                      className="py-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls randomness: Lower values are more deterministic, higher values more creative.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="max-tokens-slider" className="text-sm font-medium leading-none">
                        Max Tokens
                      </label>
                      <span className="text-xs px-2 py-1 rounded-md bg-secondary">
                        {settings.maxTokens}
                      </span>
                    </div>
                    <Slider
                      id="max-tokens-slider"
                      min={1}
                      max={4096}
                      step={1}
                      value={[settings.maxTokens]}
                      onValueChange={(values: number[]) => updateSettings("maxTokens", values[0])}
                      className="py-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum length of the generated response.
                    </p>
                  </div>
                </div>
              </div>

              <Separator orientation="vertical" />
              
              <div className="flex flex-col flex-grow">
              <div className="space-y-2 h-full">
                <div className="flex justify-between items-center">
                  <label htmlFor="system-prompt" className="text-sm font-medium leading-none">
                    System Prompt
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {settings.systemPrompt.length} tokens
                  </span>
                </div>
                <div className="flex flex-col w-full h-[420px] relative">
                  <GPTInputPopover 
                    open={gptPopoverOpen} 
                    placeholder={"Ask for prompt suggestions..."}
                    onResponse={onPopoverResponse}
                    onClose={handlePopoverClose}
                    systemPrompt={`Generate a long detailed system prompt for the following text: \n\n`}
                    border
                    >
                  <Textarea
                    id="system-prompt"
                    value={settings.systemPrompt}
                    onChange={(e) => updateSettings("systemPrompt", e.target.value)}
                    placeholder="Enter system instructions or press 'space' for AI..."
                    className="min-h-full resize-none bg-transparent border border-input"
                    onKeyDown={handleKeyDown}
                  />
                  </GPTInputPopover>
                </div>
              </div>
              </div>
            </div>
            
            <DialogFooter className="flex-none p-4 border-t bg-muted/10">
              <div className="flex flex-row justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                  <Button>
                    Save
                  </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <TooltipContent side="bottom">
          <p>Advanced</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}