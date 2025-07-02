"use client"
"use client"

import React,{ useState, useRef, useEffect } from "react"
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
  ArrowLeft,
  ArrowRight,
  Map,
  MoreHorizontal,
  PieChart,
  TrafficCone,
  Settings2,
  Share,
  Sparkles,
  SquareTerminal,
  Trash2,
  BookUser,
  Settings,
  FilePenLine,
  Landmark,
  EllipsisVertical,
  Flag,
  History,
  Plus,
  Search,
  File,
  Pickaxe,
  Star,
  Highlighter,
  Zap,
  X,
  PiggyBank,
  CircleMinus,
  CirclePlus,
  CircleCheck,
  CircleX,
  Blocks,
  MessagesSquare,
  LayoutDashboard,
  Inbox,
  Minimize,
  Workflow,
} from "lucide-react"
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
import { Icons } from "@/components/ui/icons"
import { useIsMobile } from "@/hooks/use-mobile"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useHistory } from '@/contexts/HistoryContext';
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
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
import { ExpandedViewType } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSession, signOut } from "next-auth/react"
import { GPTTextareaForm } from "./gpt-textarea-form"
import ReactFlow, { addEdge, Background, BackgroundVariant, Controls } from 'reactflow';
import { SearchDialog } from "./search-dialog"
import { FilterDialog } from "./filter-dialog"
import { FileDropZone } from "./file-drop-zone"
import { GPTInputPopover } from "./gpt-input-popover"
import { cn } from '@/lib/utils';
import { GPTMessenger } from "./gpt-messenger"
import TextEditor from "./text-editor"
import Spreadsheet from "./spreadsheet"
import MapView from "./map-view"

const placeholders = {
  "document": "You can highlight the text to edit with AI or ask any question about the documentation... or press 'space' for AI.",
  "spreadsheet": "You can highlight the text to edit with AI or ask to change a specific column... or press 'space' for AI.",
  "map": "Use actions like 'Run object detection on satellite imagery' or explore locations... or press 'space' for AI.",
};

export function ExpandedView({ onClose }: { onClose?: (previousTab: string) => void }) {
  const [transcript, setTranscript] = useState<any[]>([])

  const isMobile = useIsMobile()
  const {
    currentView, 
    goForward, 
    goBackward, 
    canGoForward, 
    canGoBackward
  } = useHistory();
  const [view, setView] = useState<ExpandedViewType>(currentView?.type || 'map')
  const [isRunningInference, setIsRunningInference] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [history, setHistory] = useState<string[]>([])
  const snapPoints = ['125px', 1];
  const [snapPoint, setSnapPoint] = useState<string | number | null>(snapPoints[0]);

  useEffect(() => {
    if (currentView) {
      setView(currentView.type)
    }
  }, [currentView])

  const addToTranscript = (input: any) => {
    setTranscript((prev) => [...prev, input])
  }

  return(
      <div className="flex h-full w-full border-none absolute z-20">
        <Sidebar collapsible="none" className="h-full w-full border-none min-w-[300px] print:hidden">
          <SidebarHeader className="gap-3.5 p-4 py-2">
            <div className="flex h-full w-full items-center justify-between">
              <div className="flex items-center h-5 space-x-2">
                <Icons.logo />
              </div>
              <div className="flex items-center space-x-2">
              <Label className="flex items-center gap-2 text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                    <Button
                      onClick={goBackward}
                      disabled={!canGoBackward}
                      className="m-0 py-0" variant="ghost" size="icon">
                      <div>
                        <ArrowLeft 
                      className={cn("h-5 w-5 p-0 m-0", 
                        !history.length && "text-muted-foreground")}
                        /> 
                      </div>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="p-2">
                      Go back
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                </Label>
                <Label className="flex items-center gap-2 text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                    <Button 
                      onClick={goForward}
                      disabled={!canGoForward} 
                      className="m-0 py-0" variant="ghost" size="icon">
                      <div><ArrowRight className="h-5 w-5 p-0 m-0"/></div>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="p-2">
                      Go forward
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                </Label>
                <Label className="flex items-center gap-2 text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => onClose?.("Dashboard")} className="m-0 py-0" variant="ghost" size="icon">
                        <div><X className="h-5 w-5 p-0 m-0"/></div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="p-2">
                      Close
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                </Label>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="p-0">
              <SidebarGroupContent className="px-3 pt-0">
                <ScrollArea>
                <GPTMessenger transcript={transcript} isRunningInference={isRunningInference}/>
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="bg-inherit py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <GPTTextareaForm extend={true} onUserInput={addToTranscript} onSystemInput={addToTranscript} id={"gpt-textarea"} placeholder={placeholders[view]} disclaimer="Results are generated by AI and may be inaccurate." allowAttachments allowAudio allowReverseImageSearch={view === "map"} direction="right" onInferenceStateChange={setIsRunningInference} className="min-h-[140px]"/>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="print:block hidden md:flex flex-col h-full w-full min-w-[70%] bg-background border-none relative print-content">
          <FileDropZone acceptedTypes={[
            'pdf', 'xlsx', 'xls', 'doc', 'docx', 'csv', 'zip', 'rar', 
            'jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'ico'
          ]}/>
          {view === "document" ? 
          <TextEditor/>:
          view === "spreadsheet" ?
          <Spreadsheet/>:
          view === "map" &&
          <MapView/>
          }
        </div>
        <div>
        {isMobile && (
          <Drawer
            open={isDrawerOpen}
            direction="bottom"
            snapPoints={snapPoints}
            activeSnapPoint={snapPoint}
            setActiveSnapPoint={setSnapPoint}
            modal={false}
            shouldScaleBackground={false}
          >
            <DrawerContent
              onEscapeKeyDown={(e) => e.preventDefault()}
              className="h-[90vh] w-full fixed bottom-0 left-0 right-0 flex md:hidden p-0 m-0 pointer-events-none"
              data-draggable="true"
            >
              <div className="w-full flex justify-center cursor-grab active:cursor-grabbing pointer-events-auto">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <DrawerHeader className="absolute top-0 left-0 right-0 m-0 pointer-events-auto">
                <VisuallyHidden>
                  <DrawerTitle></DrawerTitle>
                  <DrawerDescription></DrawerDescription>
                </VisuallyHidden>
              </DrawerHeader>
              <div className="flex w-full mt-6 pointer-events-auto">
                {view === "document" ? (
                  <TextEditor  />
                ) : view === "spreadsheet" ? (
                  <Spreadsheet />
                ) : view === "map" && (
                  <MapView data={currentView?.data} />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        )}
        </div>
      </div>
  )
}