"use client"

import type React from "react"
import { useCallback, memo, useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  Handle,
  Position,
  getStraightPath,
  BaseEdge,
  type EdgeProps,
  ReactFlowProvider,
} from "@xyflow/react"
import {
  Play,
  Mic,
  Mail,
  Search,
  FileText,
  MousePointer,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  ExternalLink,
  File,
  FileArchive,
  Table2,
  FileType,
  Zap,
  CalendarDays,
  X,
  Plus,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import "@xyflow/react/dist/style.css"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu"
import SyntaxHighlightedInput from "@/components/ui/syntax-highlighted-input"

export const agentColors = {
  start: "#e5e7eb", // gray
  voice: "#dbeafe", // blue
  email: "#d1fae5", // green
  webSearch: "#fef3c7", // yellow
  documentation: "#ede9fe", // purple
  spreadsheet: "#ffedd5", // orange
  computerUse: "#ccfbf1", // teal
}

type AgentName = keyof typeof agentColors
type AgentStatus = "success" | "running" | "intervention" | "pending"
type OperationalMode = "manual" | "auto"
type FeedbackState = "none" | "positive" | "negative"

interface FeedbackData {
  agent: FeedbackState
  execution: FeedbackState
  prompt: FeedbackState
}

interface FileInfo {
  id: string
  name: string
  type: string
  size?: number
  preview?: string
}

interface AgentNodeData {
  type: AgentName
  label: string 

  instanceId: string
  name: string
  status: AgentStatus
  prompt: string
  model: string
  files: FileInfo[]
  feedback: FeedbackData

  progress?: number
  summary?: string
  lastRun?: string
  failureReason?: string

  payload: { [key: string]: any }
}

const statusConfig = {
  success: { color: "bg-green-500", icon: CheckCircle, label: "Success" },
  running: { color: "bg-gray-400 animate-pulse", icon: Clock, label: "Running" },
  intervention: { color: "bg-pink-500", icon: AlertCircle, label: "Needs Intervention" },
  pending: { color: "bg-yellow-500", icon: Clock, label: "Pending" },
}

const getFileProperties = (fileExtension: string) => {
  const fileProperties =
    {
      pdf: {
        bgColor: "bg-blue-800",
        fgColor: "text-blue-300",
        icon: <FileText className="text-blue-300 h-3 w-3" />,
        label: "PDF",
      },
      doc: {
        bgColor: "bg-purple-700",
        fgColor: "text-purple-300",
        icon: <FileType className="text-purple-300 h-3 w-3" />,
        label: "Document",
      },
      docx: {
        bgColor: "bg-purple-700",
        fgColor: "text-purple-300",
        icon: <FileType className="text-purple-300 h-3 w-3" />,
        label: "Document",
      },
      csv: {
        bgColor: "bg-green-700",
        fgColor: "text-green-300",
        icon: <Table2 className="text-green-300 h-3 w-3" />,
        label: "Spreadsheet",
      },
      xlsx: {
        bgColor: "bg-green-700",
        fgColor: "text-green-300",
        icon: <Table2 className="text-green-300 h-3 w-3" />,
        label: "Spreadsheet",
      },
      xls: {
        bgColor: "bg-green-700",
        fgColor: "text-green-300",
        icon: <Table2 className="text-green-300 h-3 w-3" />,
        label: "Spreadsheet",
      },
      txt: {
        bgColor: "bg-gray-700",
        fgColor: "text-gray-300",
        icon: <FileText className="text-gray-300 h-3 w-3" />,
        label: "Text",
      },
      zip: {
        bgColor: "bg-yellow-700",
        fgColor: "text-yellow-300",
        icon: <FileArchive className="text-yellow-300 h-3 w-3" />,
        label: "Archive",
      },
      rar: {
        bgColor: "bg-yellow-700",
        fgColor: "text-yellow-300",
        icon: <FileArchive className="text-yellow-300 h-3 w-3" />,
        label: "Archive",
      },
      jpg: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
      jpeg: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
      png: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
    }[fileExtension.toLowerCase()] || {
      bgColor: "bg-gray-900",
      fgColor: "text-gray-300",
      icon: <File className="text-gray-300 h-3 w-3" />,
      label: "Unknown",
    }

  return fileProperties
}

const createDefaultAgentData = (type: AgentName, id: string): AgentNodeData => {
  const resultWithSpaces = type.replace(/([A-Z])/g, ' $1');
  const capitalType = resultWithSpaces.charAt(0).toUpperCase() + resultWithSpaces.slice(1);

  const baseData: AgentNodeData = {
    instanceId: id,
    type: type,
    label: `${capitalType} Agent`,
    name: `${capitalType} Agent`,
    status: "pending",
    prompt: "",
    model: "Gemini-2.5-Pro-Exp-03-25",
    files: [],
    feedback: { agent: "none", execution: "none", prompt: "none" },
    payload: {},
  }

  switch (type) {
    case "spreadsheet":
      baseData.payload = { rows: [] }
      baseData.prompt = "Analyze ... and create a summary report"
      break
    case "documentation":
      baseData.payload = { content: "" }
      baseData.prompt = "Create a report based on the data..."
      break
    case "voice":
      baseData.payload = { transcript: "", summary: [] }
      baseData.prompt = "Transcribe and summarize the call..."
      break
    case "email":
      baseData.payload = { subject: "", content: "", history: [] }
      baseData.prompt = "Draft a follow-up email..."
      break
    case "webSearch":
      baseData.payload = { query: "", results: [] }
      baseData.prompt = "Find the latest information on..."
      break
    case "computerUse":
      baseData.payload = { timeline: [], screenshot: "/placeholder.svg?height=60&width=100" }
      baseData.prompt = "Navigate to... and perform an action"
      break
    default:
      break
  }
  return baseData
}

const DefaultNode = memo(function DefaultNode({ data }: { data: AgentNodeData }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [mode] = useState<OperationalMode>("auto")
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())
  const [showAllEmails, setShowAllEmails] = useState(false)

  // Local state for UI interaction, initialized from props
  const [prompt, setPrompt] = useState(data.prompt)
  const [selectedModel, setSelectedModel] = useState(data.model)
  const [feedbackState, setFeedbackState] = useState<FeedbackData>(data.feedback)
  const [files, setFiles] = useState<FileInfo[]>(data.files)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Effect to sync local state if the node's data prop changes from outside
  useEffect(() => {
    setPrompt(data.prompt || "")
    setSelectedModel(data.model || "Gemini-2.5-Pro-Exp-03-25")
    setFiles(data.files || [])
    setFeedbackState(data.feedback || { agent: "none", execution: "none", prompt: "none" })
  }, [data])

  const toggleEmail = (emailId: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(emailId)) {
        newSet.delete(emailId)
      } else {
        newSet.add(emailId)
      }
      return newSet
    })
  }

  const handleFeedback = (type: "agent" | "execution" | "prompt", positive: boolean) => {
    setFeedbackState((prev) => {
      const newState = { ...prev }
      if ((positive && prev[type] === "positive") || (!positive && prev[type] === "negative")) {
        newState[type] = "none"
      } else {
        newState[type] = positive ? "positive" : "negative"
      }
      return newState
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => {
        const fileInfo: FileInfo = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
        }
        if (file.type.startsWith("image/")) {
          fileInfo.preview = URL.createObjectURL(file)
        }
        return fileInfo
      })
      setFiles((prev) => [...prev, ...newFiles])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    // In a real app, you would also call a function from props to update the central state,
    // e.g., onDataChange({ ...data, files: newFilesState })
  }

  const handleFileDelete = (fileId: string) => {
    setFiles((prev) => {
      const updatedFiles = prev.filter((file) => file.id !== fileId)
      const fileToRemove = prev.find((file) => file.id === fileId)
      if (fileToRemove?.preview && fileToRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updatedFiles
      // Similarly, call onDataChange here
    })
  }

  const getIcon = (type: string) => {
    const iconProps = { className: "h-4 w-4 text-black" }
    switch (type) {
      case "start":
        return <Play {...iconProps} />
      case "voice":
        return <Mic {...iconProps} />
      case "email":
        return <Mail {...iconProps} />
      case "webSearch":
        return <Search {...iconProps} />
      case "documentation":
        return <FileText {...iconProps} />
      case "spreadsheet":
        return <FileSpreadsheet {...iconProps} />
      case "computerUse":
        return <MousePointer {...iconProps} />
      default:
        return <Play {...iconProps} />
    }
  }

  if (data.type === "start") {
    return (
      <>
        <div className="bg-sidebar rounded-lg shadow-sm min-w-[300px]">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md" style={{ backgroundColor: agentColors[data.type] }}>
                {getIcon(data.type)}
              </div>
              <div className="font-medium text-left">{data.label}</div>
            </div>
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
          style={{ bottom: -8 }}
        />
      </>
    )
  }

  const statusInfo = statusConfig[data.status]
  const isFileUploadDisabled = data.status === "success" || data.status === "running"

  return (
    <>
      <Handle type="target" position={Position.Top} id="context" className="w-2 h-2 bg-sidebar" style={{ top: -8, left: "30%" }} />
      <div className="absolute -top-8 left-[30%] transform -translate-x-1/2 text-xs font-medium bg-sidebar px-1 rounded shadow-sm border" style={{ fontSize: "10px" }} >
        context
      </div>
      <Handle type="target" position={Position.Top} id="prompt" className="w-2 h-2 bg-sidebar" style={{ top: -8, left: "70%" }} />
      <div className="absolute -top-8 left-[70%] transform -translate-x-1/2 text-xs font-medium bg-sidebar px-1 rounded shadow-sm border" style={{ fontSize: "10px" }}>
        prompt
      </div>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className={cn("bg-sidebar rounded-[7px] overflow-hidden min-w-[350px] max-w-[400px]",
          !isExpanded ? "rounded-[7px]" : "rounded-t-[7px]")}>
          <CollapsibleTrigger asChild>
            <div className={cn("flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer",
          !isExpanded ? "rounded-[7px]" : "rounded-t-[7px]")}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                <div className="p-1.5 rounded-md" style={{ backgroundColor: agentColors[data.type] }}>
                  {getIcon(data.type)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{data.name}</p>
                  {data.status === "running" && data.summary ? (
                    <p className="text-xs text-muted-foreground truncate pr-2">{data.summary}</p>
                  ) : (
                    data.lastRun && <p className="text-xs text-muted-foreground">{data.lastRun}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {statusInfo && <div className={cn("w-2 h-2 rounded-full", statusInfo.color)} />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3 border-t bg-muted/20">
              {data.status === "intervention" && (
                <div className="mb-3 bg-pink-100 border border-pink-300 rounded-md p-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="text-xs font-medium text-pink-600 mb-1">Intervention needed</h4>
                      <p className="text-xs text-pink-600">{data.failureReason}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <div className="text-xs font-medium text-left mb-1">Prompt</div>
                {/* <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="text-xs h-8"
                  placeholder="Enter your prompt here..."
                  readOnly={data.status === "success" || data.status === "running"}
                /> */}
                <SyntaxHighlightedInput
                  initialValue={prompt}
                  placeholder="Enter your command..."
                  onChange={setPrompt}
                  className="w-full"
                />
              </div>

              <div className="flex items-center mb-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-6 w-6 p-0 flex-shrink-0 mr-2",
                    isFileUploadDisabled && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => !isFileUploadDisabled && fileInputRef.current?.click()}
                  disabled={isFileUploadDisabled}
                >
                  <Plus className="h-3 w-3" />
                </Button>

                <TooltipProvider>
                  <div className="flex-1 overflow-x-auto whitespace-nowrap py-1">
                    <div className="flex items-center">
                      {files.map((fileInfo, index) => {
                        const fileExtension = fileInfo.name.split(".").pop()?.toLowerCase() || ""
                        const isImageFile = ["jpg", "jpeg", "png"].includes(fileExtension)
                        const fileProps = getFileProperties(fileExtension)

                        return (
                          <Tooltip key={fileInfo.id}>
                            <TooltipTrigger asChild>
                              <div className="relative group mr-1 last:mr-0" style={{ marginLeft: index > 0 ? "-8px" : "0" }}>
                                {isImageFile && fileInfo.preview ? (
                                  <div className="h-6 w-6 rounded-t-lg">
                                    <img src={fileInfo.preview || "/placeholder.svg"} alt={fileInfo.name} className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className={cn( "h-6 w-6 rounded-md flex items-center justify-center border border-background", fileProps.bgColor )} >
                                    {fileProps.icon}
                                  </div>
                                )}
                                {!isFileUploadDisabled && (
                                  <button
                                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleFileDelete(fileInfo.id)
                                    }}
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{fileInfo.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {data.status === "success" && (
                <>
                  <AgentPreview
                    agent={data} // Pass the entire data object
                    mode={mode}
                    expandedEmails={expandedEmails}
                    toggleEmail={toggleEmail}
                    showAllEmails={showAllEmails}
                    setShowAllEmails={setShowAllEmails}
                  />
                  <Separator className="my-3" />
                </>
              )}

              <div className="space-y-2">
                <div className="text-xs font-medium flex items-start">AI Model</div>
                {data.status === "intervention" || data.status === "pending" ? (
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gemini-2.5-Pro-Exp-03-25">Gemini-2.5-Pro-Exp-03-25</SelectItem>
                      <SelectItem value="DeepSeek-V3">DeepSeek-V3</SelectItem>
                      <SelectItem value="DeepSeek-R1">DeepSeek-R1</SelectItem>
                      <SelectItem value="LLAMA 3.2">LLAMA 3.2</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={data.model} disabled>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gemini-2.5-Pro-Exp-03-25">Gemini-2.5-Pro-Exp-03-25</SelectItem>
                      <SelectItem value="DeepSeek-V3">DeepSeek-V3</SelectItem>
                      <SelectItem value="DeepSeek-R1">DeepSeek-R1</SelectItem>
                      <SelectItem value="LLAMA 3.2">LLAMA 3.2</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {data.status === "success" && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <div className="text-xs font-medium flex items-start">Reinforcement Feedback</div>
                    <div className="flex justify-between gap-3">
                      {/* Prompt Feedback */}
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground text-center">Prompt</div>
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant={feedbackState.prompt === "positive" ? "default" : "outline"} className={cn("h-7 px-2", feedbackState.prompt === "positive" ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-500")} onClick={() => handleFeedback("prompt", true)}>
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant={feedbackState.prompt === "negative" ? "default" : "outline"} className={cn("h-7 px-2", feedbackState.prompt === "negative" ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-red-50 hover:border-red-400 hover:text-red-400")} onClick={() => handleFeedback("prompt", false)}>
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Agent Choice */}
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground text-center">Agent Choice</div>
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant={feedbackState.agent === "positive" ? "default" : "outline"} className={cn("h-7 px-2", feedbackState.agent === "positive" ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-500")} onClick={() => handleFeedback("agent", true)} >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant={feedbackState.agent === "negative" ? "default" : "outline"} className={cn("h-7 px-2", feedbackState.agent === "negative" ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-red-50 hover:border-red-400 hover:text-red-400")} onClick={() => handleFeedback("agent", false)} >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground text-center">Execution</div>
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant={feedbackState.execution === "positive" ? "default" : "outline"} className={cn("h-7 px-2", feedbackState.execution === "positive" ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-500")} onClick={() => handleFeedback("execution", true)} >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant={feedbackState.execution === "negative" ? "default" : "outline"} className={cn("h-7 px-2", feedbackState.execution === "negative" ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-red-50 hover:border-red-400 hover:text-red-400")} onClick={() => handleFeedback("execution", false)}>
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" style={{ bottom: -8 }} />
    </>
  )
})

const TriggerNode = memo(function TriggerNode({ data }: { data: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [triggerText, setTriggerText] = useState(data.triggerText || "")
  const [runOnce, setRunOnce] = useState(data.runOnce ?? true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    data.selectedDate ? new Date(data.selectedDate) : undefined,
  )
  const [hour, setHour] = useState(data.hour || "12")
  const [minute, setMinute] = useState(data.minute || "00")
  const [period, setPeriod] = useState(data.period || "PM")
  const [selectedDays, setSelectedDays] = useState<string[]>(data.selectedDays || [])
  const [selectedMonths, setSelectedMonths] = useState<string[]>(data.selectedMonths || [])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [cronEnabled, setCronEnabled] = useState(data.cronEnabled ?? false)
  const [cronExpression, setCronExpression] = useState(data.cronExpression || "")

  const generateCronExpression = useCallback(() => {
    if (!cronEnabled) {
      return ""
    }

    let hour24 = Number.parseInt(hour)
    if (period === "PM" && hour24 !== 12) hour24 += 12
    if (period === "AM" && hour24 === 12) hour24 = 0

    const minuteStr = minute
    const hourStr = hour24.toString()

    if (runOnce) {
      if (!selectedDate) return ""
      const day = selectedDate.getDate()
      const month = selectedDate.getMonth() + 1
      return `${minuteStr} ${hourStr} ${day} ${month} *`
    } else {
      const dayNumbers =
        selectedDays.length === 0
          ? "*"
          : selectedDays
              .map((day) => {
                const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
                return dayMap[day as keyof typeof dayMap]
              })
              .join(",")

      const monthNumbers =
        selectedMonths.length === 0
          ? "*"
          : selectedMonths
              .map((month) => {
                const monthMap = {
                  January: 1,
                  February: 2,
                  March: 3,
                  April: 4,
                  May: 5,
                  June: 6,
                  July: 7,
                  August: 8,
                  September: 9,
                  October: 10,
                  November: 11,
                  December: 12,
                }
                return monthMap[month as keyof typeof monthMap]
              })
              .join(",")

      return `${minuteStr} ${hourStr} * ${monthNumbers} ${dayNumbers}`
    }
  }, [cronEnabled, runOnce, selectedDate, hour, minute, period, selectedDays, selectedMonths])

  useEffect(() => {
    const expression = generateCronExpression()
    setCronExpression(expression)
  }, [generateCronExpression])

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) => (prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]))
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-500 border-2 border-white"
        style={{ top: -8 }}
      />

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className={cn("bg-sidebar rounded-[7px] min-w-[350px] max-w-[400px]",
          !isExpanded ? "rounded-[7px]" : "rounded-t-[7px]"
        )}>
          <CollapsibleTrigger asChild>
            <div className={cn("flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer bg-muted",
              !isExpanded ? "rounded-[7px]" : "rounded-t-[7px]"
            )}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                <div className="p-1.5 rounded-md bg-gray-500">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">Trigger Node</p>
                  <p className="text-xs text-muted-foreground truncate">{triggerText || "Configure trigger..."}</p>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-3 bg-sidebar rounded-b-[7px]">
              <div className="mb-3">
                <Label htmlFor="trigger-text" className="text-xs font-medium flex mb-1">
                  Trigger
                </Label>
                {/* <Input
                  id="trigger-text"
                  value={triggerText}
                  onChange={(e) => setTriggerText(e.target.value)}
                  placeholder="What will trigger this workflow?"
                  className="text-xs h-8 mt-1"
                /> */}
                <SyntaxHighlightedInput
                  id="trigger-text"
                  initialValue={triggerText}
                  placeholder="What will trigger this workflow?"
                  onChange={setTriggerText}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cron-enabled" className="text-xs font-medium">
                    Cron Job
                  </Label>
                  <Switch
                    id="cron-enabled"
                    checked={cronEnabled}
                    onCheckedChange={setCronEnabled}
                    className="data-[state=checked]:bg-white"
                  />
                </div>
              </div>

              {cronEnabled && (
                <div className="space-y-3 p-3 bg-muted/20 rounded-md">
                  {/* Run Once Toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="run-once"
                      checked={runOnce}
                      onCheckedChange={setRunOnce}
                      className="data-[state=checked]:bg-white data-[state=checked]:border-whites"
                    />
                    <Label htmlFor="run-once" className="text-sm font-medium flex">
                      Run once only
                    </Label>
                  </div>

                  {runOnce ? (
                    // Run Once Configuration
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium flex">Date</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {selectedDate ? selectedDate.toLocaleDateString() : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date: any) => {
                                setSelectedDate(date)
                                setIsCalendarOpen(false)
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label className="text-sm font-medium flex">Time</Label>
                        <div className="flex gap-2 mt-1">
                          <Select value={hour} onValueChange={setHour}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {hours.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={minute} onValueChange={setMinute}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {minutes.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="w-[20px]">
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Run Repeatedly Configuration
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium flex">Time</Label>
                        <div className="flex gap-2 mt-1">
                          <Select value={hour} onValueChange={setHour}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="flex flex-1">
                              {hours.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={minute} onValueChange={setMinute}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="flex flex-1">
                              {minutes.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="flex w-[10px]">
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium flex">Days</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between mt-1">
                                <span className="text-xs">
                                  {selectedDays.length === 0
                                    ? "Select days..."
                                    : selectedDays.length === 1
                                      ? selectedDays[0]
                                      : `${selectedDays.length} days selected`}
                                </span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-fit">
                            <DropdownMenuItem
                              className="flex items-center space-x-2 cursor-pointer font-medium"
                              onClick={(e) => {
                                e.preventDefault()
                                const businessWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                                const isFullySelected = businessWeek.every((d) => selectedDays.includes(d))
                                setSelectedDays(isFullySelected ? [] : businessWeek)
                              }}
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].every((d) => selectedDays.includes(d)) && (
                                  <Check className="h-4 w-4" />
                                )}
                              </div>
                              <span className="text-sm">
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].every((d) => selectedDays.includes(d))
                                  ? "Deselect Business Week"
                                  : "Select Business Week"}
                              </span>
                            </DropdownMenuItem>
                              {days.map((day) => (
                                <DropdownMenuItem
                                  key={day}
                                  className="flex items-center space-x-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleDayToggle(day)
                                  }}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    {selectedDays.includes(day) && <Check className="h-4 w-4" />}
                                  </div>
                                  <span className="text-sm">{day}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div>
                          <Label className="text-sm font-medium flex">Months</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between mt-1">
                                <span className="text-xs">
                                  {selectedMonths.length === 0
                                    ? "Select months..."
                                    : selectedMonths.length === 1
                                      ? selectedMonths[0]
                                      : `${selectedMonths.length} months selected`}
                                </span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <DropdownMenuItem
                                className="flex items-center space-x-2 cursor-pointer font-medium"
                                onClick={(e) => {
                                  e.preventDefault()
                                  const allSelected = selectedMonths.length === months.length
                                  setSelectedMonths(allSelected ? [] : months)
                                }}
                              >
                                <div className="w-4 h-4 flex items-center justify-center">
                                  {selectedMonths.length === months.length && <Check className="h-4 w-4" />}
                                </div>
                                <span className="text-sm">{selectedMonths.length === months.length ? "Deselect Year" : "Select Year"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              {months.map((month) => (
                                <DropdownMenuItem
                                  key={month}
                                  className="flex items-center space-x-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleMonthToggle(month)
                                  }}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    {selectedMonths.includes(month) && <Check className="h-4 w-4" />}
                                  </div>
                                  <span className="text-sm">{month}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-500 border-2 border-white"
        style={{ bottom: -8 }}
      />
    </>
  )
})

function AgentPreview({
  agent,
  mode,
  expandedEmails,
  toggleEmail,
  showAllEmails,
  setShowAllEmails,
}: {
  agent: AgentNodeData // The prop is now the full AgentNodeData object
  mode: OperationalMode
  expandedEmails?: Set<string>
  toggleEmail?: (emailId: string) => void
  showAllEmails?: boolean
  setShowAllEmails?: (show: boolean) => void
}) {
  switch (agent.type) { // Switch on agent 'type' instead of 'id'
    case "spreadsheet":
      return <SpreadsheetPreview data={agent.payload} />
    case "documentation":
      return <DocumentPreview data={agent.payload} />
    case "voice":
      return <VoicePreview data={agent.payload} />
    case "email":
      return (
        <EmailPreview
          data={agent.payload}
          mode={mode}
          expandedEmails={expandedEmails}
          toggleEmail={toggleEmail}
          showAllEmails={showAllEmails}
          setShowAllEmails={setShowAllEmails}
        />
      )
    case "webSearch":
      return <WebSearchPreview data={agent.payload} mode={mode} />
    case "computerUse":
      return <BrowserPreview data={agent.payload} />
    default:
      return null
  }
}

// ... All preview components remain the same ...
function SpreadsheetPreview({ data }: { data: any }) {
return (
<div className="space-y-2">
<div className="text-xs font-medium text-left">Table Preview</div>
<div className="border rounded text-xs">
<div className="max-h-20 overflow-auto">
{data?.rows?.slice(0, 3).map((row: string[], i: number) => (
<div key={i} className={cn("grid grid-cols-3 gap-1 p-1", i === 0 && "bg-muted font-medium")}>
{row.map((cell, j) => (
<div key={j} className="truncate px-1 text-left">
{cell}
</div>
))}
</div>
))}
</div>
</div>
<Button size="sm" variant="outline" className="w-full h-7">
<Eye className="h-3 w-3 mr-1" />
View Full Table
</Button>
</div>
)
}

function DocumentPreview({ data }: { data: any }) {
return (
<div className="space-y-2">
<div className="text-xs font-medium text-left">Document Preview</div>
<div className="text-xs text-muted-foreground max-h-16 overflow-auto border rounded p-2 text-left">
{data?.content?.substring(0, 200)}...
</div>
<Button size="sm" variant="outline" className="w-full h-7">
<Eye className="h-3 w-3 mr-1" />
View Full Document
</Button>
</div>
)
}

function VoicePreview({ data }: { data: any }) {
const [searchQuery, setSearchQuery] = useState("")
const [isPlaying, setIsPlaying] = useState(false)
const [playbackSpeed, setPlaybackSpeed] = useState("1x")

const highlightText = (text: string, query: string) => {
if (!query) return text
const regex = new RegExp(`(${query})`, "gi")
const parts = text.split(regex)
return parts.map((part, index) =>
regex.test(part) ? (
<mark key={index} className="bg-yellow-200">
{part}
</mark>
) : (
part
),
)
}

const transcript = data.transcript ? [{ speaker: "Speaker 1", text: data.transcript }] : [
    { speaker: "Speaker 1", text: "Good morning, thank you for joining the call." },
    { speaker: "Speaker 2", text: "Happy to be here, let's discuss the project timeline." },
]

const summary = data.summary || ["Meeting started at 9:00 AM", "Discussed project timeline", "Action items assigned"]

return (
<div className="space-y-2">
<div className="text-xs font-medium text-left">Call Log</div>
<div className="bg-input rounded-md overflow-hidden border border-gray-200">
<div className="flex p-2 bg-gray-50 border-b border-gray-200 items-center justify-between">
<div className="flex items-center gap-1">
<Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsPlaying(!isPlaying)}>
{isPlaying ? <Clock className="h-3 w-3" /> : <Play className="h-3 w-3" />}
</Button>
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 w-8 px-1">
              <span className="text-xs">{playbackSpeed}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPlaybackSpeed("1x")}>1x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlaybackSpeed("1.5x")}>1.5x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlaybackSpeed("2x")}>2x</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative flex-1 ml-2">
        <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
        <Input
          type="text"
          placeholder="Search transcript..."
          className="text-xs pl-7 pr-2 py-1 h-7 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>

    <div className="flex divide-x divide-gray-200">
      <div className="w-1/2 max-h-32 overflow-auto p-2">
        <h4 className="text-xs font-medium text-gray-700 mb-1 text-left">Transcript</h4>
        {transcript.map((entry, index) => (
          <div key={index} className="mb-2">
            <div className="text-xs font-medium text-indigo-600 text-left">{entry.speaker}:</div>
            <p className="text-xs text-gray-800 text-left">{highlightText(entry.text, searchQuery)}</p>
          </div>
        ))}
      </div>

      <div className="w-1/2 max-h-32 overflow-auto p-2">
        <h4 className="text-xs font-medium text-gray-700 mb-1 text-left">Summary</h4>
        <ul className="text-xs space-y-1 list-disc pl-4">
          {summary.map((point: any, index: number) => (
            <li key={index} className="text-gray-800 text-left">
              {highlightText(point, searchQuery)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</div>
)
}

function EmailPreview({
data,
mode,
expandedEmails,
toggleEmail,
showAllEmails,
setShowAllEmails,
}: {
data: any
mode: OperationalMode
expandedEmails?: Set<string>
toggleEmail?: (emailId: string) => void
showAllEmails?: boolean
setShowAllEmails?: (show: boolean) => void
}) {
const [emailSubject, setEmailSubject] = useState(data?.subject || "")
const [emailContent, setEmailContent] = useState(data?.content || "")

const reversedHistory = [...(data?.history || [])].reverse()
const emailsToShow = showAllEmails ? reversedHistory : reversedHistory.slice(0, 2)
const hasMoreEmails = reversedHistory.length > 2

return (
<div className="space-y-2">
<div className="space-y-2">
<div className="text-xs font-medium text-left">Email History</div>
<div className="space-y-2">
{emailsToShow.map((email: any) => (
<Collapsible
key={email.id}
open={expandedEmails?.has(email.id)}
onOpenChange={() => toggleEmail && toggleEmail(email.id)}
className="border rounded-lg overflow-hidden"
>
<CollapsibleTrigger asChild>
<div className="flex items-center justify-between p-2 overflow-hidden bg-muted/30 hover:bg-muted/50 cursor-pointer">
<div className="flex items-center gap-2">
<Mail className="h-3 w-3 text-muted-foreground" />
<div className="flex-1 min-w-0 text-left">
<p className="text-xs font-medium truncate">{email.subject}</p>
<p className="text-[10px] text-muted-foreground truncate">{email.date}</p>
</div>
</div>
<div className="flex items-center">
{expandedEmails?.has(email.id) ? (
<ChevronDown className="h-3 w-3" />
) : (
<ChevronRight className="h-3 w-3" />
)}
</div>
</div>
</CollapsibleTrigger>
<CollapsibleContent>
<div className="p-2 border-t text-xs space-y-2">
<div className="flex flex-col gap-1">
<div className="flex">
<span className="text-muted-foreground w-12">From:</span>
<span className="truncate">{email.from}</span>
</div>
<div className="flex">
<span className="text-muted-foreground w-12">To:</span>
<span className="truncate">{email.to}</span>
</div>
</div>
<div className="border-t pt-2 mt-2 text-left">
<p>{email.content}</p>
</div>
</div>
</CollapsibleContent>
</Collapsible>
))}
</div>
{hasMoreEmails && (
      <Button
        size="sm"
        variant="ghost"
        className="w-full h-6 text-xs"
        onClick={() => setShowAllEmails && setShowAllEmails(!showAllEmails)}
      >
        {showAllEmails ? "Show Less" : "Show More"}
      </Button>
    )}
  </div>

  <div className="space-y-1 mt-3">
    <div className="text-xs font-medium text-left">New Email</div>
    <Input
      placeholder="Subject"
      value={emailSubject}
      onChange={(e) => setEmailSubject(e.target.value)}
      className="h-7 text-xs text-left"
      readOnly={mode === "auto"}
    />
    <Textarea
      placeholder="Email content..."
      value={emailContent}
      onChange={(e) => setEmailContent(e.target.value)}
      className="text-xs min-h-[60px] resize-none text-left"
      readOnly={mode === "auto"}
    />
  </div>
  <Button size="sm" variant="outline" className="w-full h-7">
    <Send className="h-3 w-3 mr-1" />
    Send
  </Button>
</div>
)
}

function WebSearchPreview({ data, mode }: { data: any; mode: OperationalMode }) {
const [searchQuery, setSearchQuery] = useState(data?.query || "")

return (
<div className="space-y-2">
<div className="text-xs font-medium text-left">Search Results</div>
<Input
placeholder="Search query..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="h-7 text-xs text-left"
readOnly={mode === "auto"}
/>
<div className="space-y-1 max-h-20 overflow-auto">
{data?.results?.slice(0, 3).map((result: any, i: number) => (
<div key={i} className="border rounded p-2 text-xs">
<div className="flex items-center gap-2 mb-1">
<div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">
{result.title.charAt(0)}
</div>
<div className="font-medium truncate flex-1 text-left">{result.title}</div>
</div>
<div className="text-muted-foreground text-[10px] truncate text-left">{result.snippet}</div>
<Button size="sm" variant="ghost" className="h-5 px-1 mt-1">
<ExternalLink className="h-2 w-2 mr-1" />
View
</Button>
</div>
))}
</div>
</div>
)
}

function BrowserPreview({ data }: { data: any }) {
return (
<div className="space-y-2">
<div className="text-xs font-medium text-left">Browser Session</div>
<div className="flex gap-2">
<div className="flex-1">
<div className="text-[10px] text-muted-foreground mb-1 text-left">Timeline</div>
<div className="space-y-1 max-h-16 overflow-auto text-[10px]">
{data?.timeline?.map((step: string, i: number) => (
<div key={i} className="text-left">
• {step}
</div>
))}
</div>
</div>
<div className="w-16">
<div className="text-[10px] text-muted-foreground mb-1 text-left">Preview</div>
<img
src={data?.screenshot || "/placeholder.svg"}
alt="Screenshot"
className="w-full h-12 object-cover border rounded"
/>
</div>
</div>
<Button size="sm" variant="outline" className="w-full h-7">
<Eye className="h-3 w-3 mr-1" />
View Full Session
</Button>
</div>
)
}

export function AnimatedEdge({ id, selected, sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <BaseEdge id={id} path={edgePath} />
      <path d="M -6 0 L 6 0 L 0 8 Z" fill={selected || hovered ? "#cbcacf" : "#3d3d3d"} transform="rotate(-90)">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} rotate="auto" />
      </path>
    </g>
  )
}

const nodeTypes = {
  default: DefaultNode,
  trigger: TriggerNode,
}

const edgeTypes = {
  animated: AnimatedEdge,
}

// Updated initial nodes with all data self-contained
const initialNodes = [
  {
    id: "node-start",
    type: "default",
    position: { x: 400, y: 0 },
    draggable: true,
    selectable: true,
    data: { label: "Starting Point", type: "start" }, // Start node is simpler
  },
  {
    id: "node-webSearch-1",
    type: "default",
    position: { x: 400, y: 150 },
    data: {
      instanceId: "webSearch-1",
      name: "Web Search Agent",
      type: "webSearch",
      label: "Web Search Agent",
      status: "pending",
      prompt: "Find the latest research on AI workflow automation",
      model: "DeepSeek-R1",
      files: [
        { id: "wsf1", name: "research-paper.pdf", type: "application/pdf", size: 1536000 },
        { id: "wsf2", name: "data-export.csv", type: "text/csv", size: 64000 },
      ],
      feedback: { agent: "none", execution: "none", prompt: "none" },
      payload: { query: "", results: [] },
    },
  },
  {
    id: "node-voice-1",
    type: "default",
    position: { x: 400, y: 350 },
    data: {
      instanceId: "voice-1",
      name: "Voice Agent",
      type: "voice",
      label: "Voice Agent",
      status: "intervention",
      prompt: "Schedule a meeting with the project team for next week",
      model: "LLAMA 3.2",
      progress: 45,
      lastRun: "5 min ago",
      failureReason: "Unable to access calendar system due to authentication error",
      files: [
        { id: "vf1", name: "voice-notes.txt", type: "text/plain", size: 1024 },
        { id: "vf2", name: "contract.pdf", type: "application/pdf", size: 512000 },
      ],
      feedback: { agent: "none", execution: "none", prompt: "none" },
      payload: { transcript: "", summary: [] },
    },
  },
  {
    id: "node-email-1",
    type: "default",
    position: { x: 400, y: 550 },
    data: {
      instanceId: "email-1",
      name: "Email Agent",
      type: "email",
      label: "Email Agent",
      status: "pending",
      prompt: "Draft a follow-up email to the client about project status",
      model: "Gemini-2.5-Pro-Exp-03-25",
      files: [
        { id: "ef1", name: "contract.pdf", type: "application/pdf", size: 512000 },
        { id: "ef2", name: "proposal.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 256000 },
      ],
      feedback: { agent: "none", execution: "none", prompt: "none" },
      payload: { subject: "", content: "", history: [] },
    },
  },
  {
    id: "node-spreadsheet-1",
    type: "default",
    position: { x: 400, y: 750 },
    data: {
      instanceId: "spreadsheet-1",
      name: "Spreadsheet Agent",
      type: "spreadsheet",
      label: "Spreadsheet Agent",
      status: "success",
      prompt: "Analyze Q1-Q4 expenses and create a summary report",
      model: "Gemini-2.5-Pro-Exp-03-25",
      progress: 100,
      lastRun: "2 min ago",
      files: [
        { id: "ssf1", name: "quarterly-data.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 1024000 },
        { id: "ssf2", name: "report.pdf", type: "application/pdf", size: 512000 },
      ],
      feedback: { agent: "none", execution: "none", prompt: "none" },
      payload: {
        rows: [
          ["A", "B", "C"],
          ["Q1 Expenses", "12,500", "25%"],
          ["Q2 Expenses", "15,750", "31%"],
          ["Q3 Expenses", "9,800", "19%"],
          ["Q4 Expenses", "12,300", "25%"],
          ["Total", "$50,350", "100%"],
        ],
      },
    },
  },
  {
    id: "node-documentation-1",
    type: "default",
    position: { x: 400, y: 950 },
    data: {
        instanceId: "documentation-1",
        name: "Documentation Agent",
        type: "documentation",
        label: "Documentation Agent",
        status: "running",
        prompt: "Create a quarterly performance report based on the data",
        model: "DeepSeek-V3",
        progress: 65,
        summary: "Document agent generating quarterly performance report",
        files: [
            { id: "df1", name: "documentation.pdf", type: "application/pdf", size: 2048000 },
            { id: "df2", name: "screenshots.zip", type: "application/zip", size: 5120000 },
        ],
        feedback: { agent: "none", execution: "none", prompt: "none" },
        payload: { content: "" },
    }
  },
  {
    id: "node-computer-use-1",
    type: "default",
    position: { x: 400, y: 1150 },
    data: {
        instanceId: "computerUse-1",
        name: "Computer Use Agent",
        type: "computerUse",
        label: "Computer Use Agent",
        status: "pending",
        prompt: "Navigate to the company dashboard and download the latest reports",
        model: "LLAMA 3.2",
        files: [
            { id: "cuf1", name: "system-log.txt", type: "text/plain", size: 8192 },
        ],
        feedback: { agent: "none", execution: "none", prompt: "none" },
        payload: { timeline: [], screenshot: "/placeholder.svg?height=60&width=100" },
    }
  },
]

const initialEdges = [
  { id: "edge-start-webSearch", source: "node-start", target: "node-webSearch-1", type: "animated" },
  { id: "edge-webSearch-voice-1", source: "node-webSearch-1", target: "node-voice-1", type: "animated" },
  { id: "edge-voice-1-email-1", source: "node-voice-1", target: "node-email-1", type: "animated" },
  { id: "edge-email-1-spreadsheet", source: "node-email-1", target: "node-spreadsheet-1", type: "animated" },
  { id: "edge-spreadsheet-documentation", source: "node-spreadsheet-1", target: "node-documentation-1", type: "animated" },
  { id: "edge-documentation-computer", source: "node-documentation-1", target: "node-computer-use-1", type: "animated" },
]

interface WorkflowCanvasProps {
  onNodesChange?: (nodes: any[]) => void
  additionalNodes?: any[]
}

export const WorkflowCanvas = forwardRef<any, WorkflowCanvasProps>(function WorkflowCanvas(
  { onNodesChange, additionalNodes = [] },
  ref,
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes)

  useEffect(() => {
    if (onNodesChange) {
      onNodesChange(nodes)
    }
  }, [nodes, onNodesChange])

  useEffect(() => {
    setNodes((prevNodes) => {
      const existingIds = new Set(prevNodes.map((n) => n.id))
      const nodesToAdd = additionalNodes.filter((n) => !existingIds.has(n.id))
      if (nodesToAdd.length === 0) {
        return prevNodes
      }
      return [...prevNodes, ...nodesToAdd]
    })
  }, [additionalNodes, setNodes])

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  useImperativeHandle(ref, () => ({
    addNode: (node: any) => {
      setNodes((prevNodes) => [...prevNodes, node])
    },
  }))

  const onConnect = useCallback(
    (params: any) => setEdges((els) => addEdge({ ...params, type: "animated" }, els)),
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  type DraggableNodeType = AgentName | "trigger";

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData("application/reactflow") as DraggableNodeType;

      if (!nodeType || !reactFlowInstance || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `node-${nodeType}-${Date.now()}`;
      let newNode: any;

      if (nodeType === "trigger") {
        newNode = {
          id: newNodeId,
          type: "trigger",
          position,
          data: {
            triggerText: "",
            runOnce: true,
            selectedDate: new Date(),
            hour: "12",
            minute: "00",
            period: "PM",
            selectedDays: [],
            selectedMonths: [],
            cronEnabled: false,
            cronExpression: "",
          },
        };
      } else {
        newNode = {
          id: newNodeId,
          type: "default",
          position,
          data: createDefaultAgentData(nodeType, newNodeId),
        };
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onNodesDelete = useCallback((deletedNodes: any[]) => {
    for (const node of deletedNodes) {
      console.log(`Node deleted with ID: ${node.id}`);
    }
  }, []); 

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeInternal}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodesDelete={onNodesDelete}
          className="bg-background w-full h-full"
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          fitView
        >
          <Background gap={18} size={1} color="#6B6B70" />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
})