"use client"

import React,{ useState, useRef, useEffect, useCallback, use } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  Command,
  CreditCard,
  Folder,
  Frame,
  LifeBuoy,
  LogOut,
  Map,
  Globe,
  MoreHorizontal,
  PieChart,
  TrafficCone,
  Settings2,
  Share,
  Table2,
  FileType,
  Sparkles,
  FileSpreadsheet,
  SquareTerminal,
  Trash2,
  BookUser,
  Settings,
  FilePenLine,
  Landmark,
  Sparkle,
  EllipsisVertical,
  Flag,
  History,
  Plus,
  Files,
  Search,
  File,
  Pickaxe,
  Star,
  Flashlight,
  Zap,
  Shapes,
  Mic,
  ArrowLeft,
  X,
  PiggyBank,
  FolderOpen,
  CircleMinus,
  CirclePlus,
  CircleCheck,
  CircleX,
  ChartArea,
  MessagesSquare,
  LayoutDashboard,
  Blocks,
  Inbox,
  Workflow,
  Network,
  FileText, 
  Building2, 
  CalendarIcon, 
  Layers,
  Package,
  Paperclip,
  ChartBarBig,
  FileStack,
  Phone,
  Mail,
  NotebookTabs,
  Fingerprint,
  ChartBar,
  icons,
  PanelRightOpen,
  PanelRight,
  PanelRightClose,
  Pencil,
  Square,
  Play,
  CopyPlus,
  Save,
  Clock,
  MousePointer,
  CalendarSearch,
} from "lucide-react"
import { RiDashboard3Line } from "react-icons/ri";
import { LiaFileContractSolid } from "react-icons/lia";
import { FaFileSignature } from "react-icons/fa6";
import { MdOutlineSupport } from "react-icons/md";
import { MdSettings } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import { RiDashboard3Fill } from "react-icons/ri";
import { RiFileEditLine } from "react-icons/ri";
import { AiOutlineSignature } from "react-icons/ai";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { HiMiniGlobeEuropeAfrica } from "react-icons/hi2";
import { FaBalanceScale, FaBalanceScaleLeft } from "react-icons/fa";
import { RiQuillPenAiLine } from "react-icons/ri";
import { HiOutlineInboxIn } from "react-icons/hi";
import { HiOutlineClipboardDocument } from "react-icons/hi2";
import { TbPhoneCall } from "react-icons/tb";
import { FaRegNewspaper } from "react-icons/fa";
import { BiFileFind } from "react-icons/bi";
import { TiWeatherDownpour } from "react-icons/ti";
import { PiGavel } from "react-icons/pi";
import { PiBankBold } from "react-icons/pi";
import { FaGlobeAmericas } from "react-icons/fa";
import { Calendar } from "@/components/ui/calendar";
import { Toaster } from "@/components/ui/sonner"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  checkConnection,
  createChat,
  createUser,
  getChatsByUserId,
} from "@/lib/dbs/supabase"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSession, signOut } from "next-auth/react"
import { GPTTextareaForm } from "./gpt-textarea-form"
import { HiOutlinePresentationChartLine, HiOutlineMailOpen } from "react-icons/hi";
import { LuMapPinned, LuChartArea } from "react-icons/lu";
import { PiPencilBold } from "react-icons/pi";
import { MdOutlineDocumentScanner } from "react-icons/md";
import {
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import "@/app/xyflow.css"
import { SearchDialog } from "./search-dialog"
import { FilterDialog } from "./filter-dialog"
import { FileDropZone } from "./file-drop-zone"
import { GPTInputPopover } from "./gpt-input-popover"
import { ExpandedView } from "./expanded-view"
import dayjs from 'dayjs';
import { WorkflowCanvas } from "./workflow-canvas";
import { useGlobalContext } from '@/contexts/GlobalContext'
import { GPTMessenger } from "./gpt-messenger"
import { cn } from '@/lib/utils';
import { Input } from "../ui/input"
import { Header } from "./header"
import { ChatSidebar } from "./chat-sidebar"
import { getTranscriptsBySourceId } from "@/lib/dbs/supabase"
   
export function ChatInterface({
  type,
  id,
  onChange,
}:{
  type?: 'chat' | 'proposal';
  id?: string;
  onChange?: (open: boolean) => void;
}) {
  const { isSearchDialogOpen, setIsSearchDialogOpen, isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const [isRunningInference, setIsRunningInference] = useState(false)
  const [transcript, setTranscript] = useState<any[]>([])
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated" && session

  const userId = (session as any)?.user?.id
  useEffect(() => {
    if (isAuthenticated && userId) {
      if (id) {
        getTranscriptsBySourceId("chat", id).then((fetchedTranscripts) => {
          setTranscript(fetchedTranscripts)
          console.log("fetchedTranscripts", fetchedTranscripts)
        }).catch(err => {
          console.error("Failed to fetch chats:", err)
        })
      } else {
        setTranscript([])
      }
  }
  }, [isAuthenticated, userId, id])

    const [expanded, setExpanded] = useState(false)
    const [sourcesOpen, setSourcesOpen] = useState(true)
    const [currentDept, setCurrentDept] = useState<any>(null)
    const [showMore, setShowMore] = useState(false);
    const [mode, setMode] = useState<'chat' | 'agents'>('chat')

    const [triggerCount, setTriggerCount] = useState(0)
    const workflowCanvasRef = useRef<any>(null)

    const handleAddTrigger = useCallback(() => {
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, "0")
      const currentDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
      const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`

      const newTriggerNode = {
          id: `trigger-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "trigger",
          position: {
            x: 200 + triggerCount * 50, 
            y: 100 + triggerCount * 50,
          },
          data: {
            label: "Trigger Node",
            type: "trigger",
            triggerText: "",
            cronEnabled: false,
            cronDate: currentDate,
            cronTime: currentTime,
            cronFrequency: "daily",
          },
          draggable: true,
          selectable: true,
        }

        if (workflowCanvasRef.current) {
          workflowCanvasRef.current.addNode(newTriggerNode)
        }
        setTriggerCount((prev) => prev + 1)
    }, [triggerCount])

    useEffect(() => {
      checkConnection()
    }, [])

    useEffect(() => {
      if(id){
        

      }
    }, [])

    return (
      <div className="flex h-screen w-screen relative">
      <div className="flex h-full w-full border-none">
        {mode === "chat" && <ChatSidebar />}
        <main className="flex flex-col h-full w-full relative">
        <Header mode={mode} />
        <div className={cn(
            "container/main relative flex h-full w-full flex-col items-center",
            !transcript.length && "justify-end md:justify-center" 
          )}>
          {!expanded && <FileDropZone 
            acceptedTypes={[
              'pdf', 'xlsx', 
              'xls', 'doc', 
              'docx', 'csv', 
              'zip', 'rar',
              'jpeg', 'jpg', 
              'png',
            ]}/>}
          {transcript.length ?
          <div className={cn("w-full flex-1 overflow-y-auto")}>
            <div className="w-full max-w-3xl mx-auto mt-10">
             <GPTMessenger transcript={transcript} isRunningInference={isRunningInference} />
            </div>
          </div>:null}
          {!transcript.length && (
              <div className={cn(
                "absolute bottom-[60%] mx-auto max-w-[50rem] md:relative md:bottom-auto transition-all duration-500 ease-in-out",
                mode === "chat" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
              )}>
                <h1 className="mb-6 text-3xl font-medium tracking-tight">What can I help with?</h1>
              </div>
            )}
              
            {mode === "agents" && <div className={
              cn("absolute top-0 left-0 h-full w-full z-0", 
              mode === "agents" && "md:border-t md:border-border")}>
              <WorkflowCanvas ref={workflowCanvasRef}/>
            </div>}
            {mode === "agents" && <WorkflowSidebar onTriggerClick={handleAddTrigger}/>}
          <div className={cn(
            "relative inset-x-0 z-20 mx-auto w-full max-w-3xl transition-all duration-500 ease-in-out shrink-0",
            mode === "agents" ? "bottom-0 fixed" : "bottom-0"
          )} style={{opacity: 1}}>
            <div className="relative flex w-full flex-col gap-4">
              {!transcript.length && (
                <div className={cn(
                  "relative order-1 w-full md:absolute md:bottom-[-70px] md:order-2 md:h-[70px] transition-all duration-500 ease-in-out",
                  mode === "chat" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                )}>
                  <div className="flex w-full max-w-full flex-nowrap justify-start gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0" style={{scrollbarWidth: 'none'}}>
                    <div className="rounded-full bg-background border-[1px] border-border px-4 py-3 flex items-center justify-center text-sm gap-2 cursor-pointer hover:bg-[#333333] whitespace-nowrap transition-colors duration-200">
                      <LuChartArea className="h-5 w-5 shrink-0" style={{ color: "#f55b89" }}/>
                      Generate chart
                    </div>
                    <div className="rounded-full bg-background border-[1px] border-border px-4 py-3 flex items-center justify-center text-sm gap-2 cursor-pointer hover:bg-[#333333] whitespace-nowrap transition-colors duration-200">
                      <PiPencilBold className="h-5 w-5 shrink-0" style={{ color: "#76d0eb" }} />
                      Write proposal
                    </div>
                    <div className="rounded-full bg-background border-[1px] border-border px-4 py-3 flex items-center justify-center text-sm gap-2 cursor-pointer hover:bg-[#333333] whitespace-nowrap transition-colors duration-200">
                      <TbPhoneCall className="h-5 w-5 shrink-0" style={{ color: "#60c689" }} />
                      Contant suppliers
                    </div>
                    {!showMore && (
                      <div onClick={() => setShowMore(true)} className="rounded-full bg-background border-[1px] border-border px-4 py-3 flex items-center justify-center text-sm gap-2 cursor-pointer hover:bg-[#333333] transition-colors duration-200">
                        More
                      </div>
                    )}
                    {showMore && (
                      <>
                        <div className="rounded-full bg-background border-[1px] border-border px-4 py-3 flex items-center justify-center text-sm gap-2 cursor-pointer hover:bg-[#333333] whitespace-nowrap transition-colors duration-200">
                          <MdOutlineDocumentScanner className="h-5 w-5 shrink-0" style={{ color: "#8b5cf6" }} />
                          Process files
                        </div>
                        <div className="rounded-full bg-background border-[1px] border-border px-4 py-3 flex items-center justify-center text-sm gap-2 cursor-pointer hover:bg-[#333333] whitespace-nowrap transition-colors duration-200">
                          <HiOutlineMailOpen className="h-5 w-5 shrink-0" style={{ color: "#5180ed" }}/>
                          Email manufacturers
                        </div>
                        <div className="rounded-full bg-background border-[1px] border-border px-4 py-3 flex items-center justify-center text-sm gap-2 cursor-pointer hover:bg-[#333333] whitespace-nowrap transition-colors duration-200">
                          <LuMapPinned className="h-5 w-5 shrink-0" style={{ color: "#eab308" }}/>
                          View map
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className={cn(
                "relative z-10 px-2 pb-3 sm:pb-4 transition-all duration-500 ease-in-out",
                !transcript.length && mode === "chat" ? "order-2 md:order-1" : "order-1"
              )}>
              <GPTTextareaForm id="gpt-textarea" placeholder="Ask anything, or press 'space' for AI." disclaimer="Results are generated by AI and may make mistakes or be inaccurate. Double check documentation thoroughly." chatId={id} allowAttachments allowAudio allowFilter allowWebSearch={mode === "chat"} allowAgents autoSize onModeChange={setMode} onInferenceStateChange={setIsRunningInference} className="border-none" />
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
        {expanded && <ExpandedView onClose={() => setExpanded(false)}/>}
      <SearchDialog 
      isOpen={isSearchDialogOpen}
      onOpenChange={setIsSearchDialogOpen}
      // onChange={}
      />
      <FilterDialog
      isOpen={isFilterDialogOpen}
      onOpenChange={setIsFilterDialogOpen}
      // onChange={}
      />
      <Toaster />
      </div>
    )
}

export const agentColors = {
  start: "#e5e7eb", // gray
  voice: "#dbeafe", // blue
  email: "#d1fae5", // green
  webSearch: "#fef3c7", // yellow
  documentation: "#ede9fe", // purple
  spreadsheet: "#ffedd5", // orange
  computerUse: "#ccfbf1", // teal
}

type AgentStatus = "success" | "failed" | "running" | "intervention" | "pending" | "paused"
type OperationalMode = "manual" | "auto"
type SortOption = "name" | "status" | "lastRun" | "progress" | "complexity"

interface AgentData {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  status: AgentStatus
  progress: number
  lastRun?: string
  category: string
  priority: "high" | "medium" | "low"
  estimatedTime?: string
  data?: any
  isBookmarked?: boolean
  usage: {
    totalRuns: number
    successRate: number
    avgDuration: string
  }
}

const nodeTypes = [
  {
    id: "spreadsheet",
    name: "Spreadsheet Agent",
    description: "Manage and analyze data in spreadsheets, create reports and calculations with advanced formulas.",
    icon: FileSpreadsheet,
    color: agentColors.spreadsheet,
    category: "Data Processing",
    estimatedTime: "2-5 min",
    complexity: "Medium",
  },
  {
    id: "documentation",
    name: "Document Agent",
    description: "Generate comprehensive documentation, technical specs, and process documents from various sources.",
    icon: FileText,
    color: agentColors.documentation,
    category: "Content Creation",
    estimatedTime: "3-8 min",
    complexity: "High",
  },
  {
    id: "voice",
    name: "Voice Agent",
    description: "Process voice calls, transcribe conversations, extract insights and generate meeting summaries.",
    icon: Mic,
    color: agentColors.voice,
    category: "Communication",
    estimatedTime: "1-3 min",
    complexity: "Medium",
  },
  {
    id: "email",
    name: "Email Agent",
    description: "Handle email communications, draft responses, categorize messages and extract key information.",
    icon: Mail,
    color: agentColors.email,
    category: "Communication",
    estimatedTime: "Asynchronous",
    complexity: "Low",
  },
  {
    id: "webSearch",
    name: "Web Search Agent",
    description: "Search the web for relevant information, compile research data and verify facts across sources.",
    icon: Search,
    color: agentColors.webSearch,
    category: "Research",
    estimatedTime: "2-4 min",
    complexity: "Medium",
  },
  {
    id: "computerUse",
    name: "Computer Use Agent",
    description: "Automate computer interactions, data entry tasks and complex multi-step workflows.",
    icon: MousePointer,
    color: agentColors.computerUse,
    category: "Automation",
    estimatedTime: "5-15 min",
    complexity: "High",
  },
]

export function WorkflowSidebar({ onTriggerClick }: { onTriggerClick: () => void }) {
  const [mode, setMode] = React.useState<OperationalMode>("auto")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<SortOption>("name")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("")
  const [isRunning, setIsRunning] = React.useState(false)

  const [isMinimized, setIsMinimized] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768)
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleBookmark = (nodeId: string) => console.log(`Toggled bookmark for ${nodeId}`)

  const handleRunStop = () => {
    setIsRunning(!isRunning)
    console.log(isRunning ? "Stopping workflow" : "Starting workflow")
  }

  const handleAddTrigger = () => {
    console.log("Add trigger clicked")
    onTriggerClick()  
  }

  const toggleMinimize = () => setIsMinimized(!isMinimized)

  const filteredNodes = nodeTypes.filter((node) => {
    const searchLower = sidebarSearchQuery.toLowerCase()
    const matchesSearch =
      node.name.toLowerCase().includes(searchLower) ||
      node.description.toLowerCase().includes(searchLower) ||
      node.category.toLowerCase().includes(searchLower)
    const matchesCategory = selectedCategory === "all" || node.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (sortBy === "name") return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    if (sortBy === "complexity") {
      const complexityOrder = { Low: 1, Medium: 2, High: 3 }
      const comparison =
        complexityOrder[a.complexity as keyof typeof complexityOrder] -
        complexityOrder[b.complexity as keyof typeof complexityOrder]
      return sortOrder === "asc" ? comparison : -comparison
    }
    return 0
  })

  const WorkflowControlsCard = () => (
    <Card className={cn("mb-1 border-border rounded-full w-fit bg-sidebar", isMinimized && "flex self-end")}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="flex-1 border-border font-medium rounded-full"
            onClick={handleAddTrigger}
          >
            <Zap className="h-4 w-4" />
            Add Trigger
          </Button>

          <Button
            className={cn(
              "px-6 py-2 rounded-full font-medium transition-all duration-200",
              isRunning ? "bg-red-400 hover:bg-red-300 text-red-700" : "bg-pink-300 hover:bg-pink-400 text-pink-700",
            )}
            onClick={handleRunStop}
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <WorkflowControlsCard />

      <Card
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-all duration-300 bg-sidebar max-h-[400px] md:max-h-none",
          isMinimized ? "w-16" : "w-96",
        )}
      >
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 flex-shrink-0">
          {!isMinimized && <h2 className="text-lg font-semibold">AI Workflow</h2>}
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={toggleMinimize}>
            {isMinimized ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
          </Button>
        </CardHeader>

        {!isMinimized ? (
          <CardContent className="px-4 py-0 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="space-y-4 flex-shrink-0">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                <div className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Start New Workflow</span>
                </div>
              </Button>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  className="pl-8 h-9"
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                />
                {sidebarSearchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSidebarSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col space-y-3 min-h-0 pt-4 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground flex-shrink-0">Available Agents</h3>
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 gap-3 ">
                  {sortedNodes.length > 0 ? (
                    sortedNodes.map((node) => (
                      <AgentGridItem key={node.id} node={node} onBookmark={() => toggleBookmark(node.id)} />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No agents found</p>
                      <p className="text-xs">Try adjusting your search</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-2 flex flex-col items-center gap-4 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Workflow</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <Workflow className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Workflows</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <CopyPlus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Copy</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Save</TooltipContent>
            </Tooltip>
          </CardContent>
        )}
      </Card>
    </div>
  )

  return (
    <div className={cn("absolute top-[65px] right-4 bottom-4 z-50 transition-all duration-300", isMinimized ? "w-16" : "w-96")}>
      <TooltipProvider>{sidebarContent}</TooltipProvider>
    </div>
  )
}

function AgentGridItem({
  node,
  onBookmark,
}: {
  node: {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    category: string
    estimatedTime: string
    complexity: string
  }
  onBookmark: () => void
}) {
  const Icon = node.icon
  const isDisabled = node.id === "computerUse"

  const handleDragStart = (e: React.DragEvent) => {
    if (isDisabled) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData("application/reactflow", node.id)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      className={cn(
        "group p-4 rounded-lg border border-border transition-all",
        isDisabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:border-primary/30 hover:bg-muted/30 cursor-grab active:cursor-grabbing",
      )}
      draggable={!isDisabled}
      onDragStart={handleDragStart}
    >
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-md" style={{ backgroundColor: node.color }}>
            <Icon className="h-5 w-5 text-black" />
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{node.complexity}</span>
        </div>
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium line-clamp-1">{node.name}</h4>
            <p className="text-xs text-muted-foreground">{node.category}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{node.estimatedTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
