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

export function ExpandedView({ onClose }: { onClose?: (previousTab: string) => void }) {
  const data = {
    // transcript: [],
    transcript: [
      {
        id: "1",
        system: false, 
        content: "Can you help me find local subcontractors in Miami, FL?",
        createdAt: new Date().toISOString(), 
      },
      {
        id: "2",
        system: true,
        content: "# Finding Local Subcontractors in Miami, FL\n\n## Here are some ways to locate subcontractors:\n\n- **Online Directories:** Websites like [Angi](https://www.angi.com), [HomeAdvisor](https://www.homeadvisor.com), and [Houzz](https://www.houzz.com) list subcontractors by location and specialty.\n- **Local Trade Associations:** Organizations like the [Associated General Contractors (AGC)](https://www.agc.org/) or the [Florida Home Builders Association](https://www.fhba.com/) have contractor listings.\n- **Referrals & Networking:** Asking other contractors, suppliers, or visiting job sites can lead to reliable contacts.\n- **Government & Licensing Boards:** The [Florida Department of Business & Professional Regulation](https://www.myfloridalicense.com/) has a searchable database of licensed subcontractors.\n\nWould you like me to refine the search based on a specific trade (e.g., electricians, plumbers, carpenters)?",
        createdAt: new Date().toISOString(), 
      },
      {
        id: "3",
        system: false,
        content: "[project-documentation.zip](project-documentation.zip)\n\n Yes, I am specifically looking for licensed electricians.",
        createdAt: new Date().toISOString(), 
      },
      {
        id: "4",
        system: true,
        content: "# Licensed Electricians in Miami, FL\n\n## Recommended Electricians:\n\n1. **Miami Power Electric**  \n   - Specializes in residential and commercial wiring.  \n   - Phone: [305-555-1234](tel:3055551234)  \n\n2. **Sunshine Electrical Contractors**  \n   - Experts in high-voltage installations and repairs.  \n   - Phone: [305-555-5678](tel:3055555678)  \n\n3. **Bright Sparks Electrical**  \n   - Focuses on smart home and energy-efficient solutions.  \n   - Phone: [305-555-9012](tel:3055559012)  \n\nWould you like more details or assistance in reaching out to them?"
        ,createdAt: new Date().toISOString(),
      },
      {
        id: "5",
        system: true,
        content:  `[project-documentation.csv](project-documentation.csv)\n\n # A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

## A table:

| Name     | FSC Code | Costs per Unit |
|----------|----------|----------------|
| Washers  | 5310     | $0.35          |
| Bolts    | 5306     | $0.47          |
| Screws   | 5305     | $0.40          |
| Nuts     | 5310     | $0.45          |
| Bearings | 3110     | $0.48          |
`,
        createdAt: new Date().toISOString(), 
      },
      {
        id: "6",
        system: false,
        content: "Generate a pie chart for the current stock levels.",
        createdAt: new Date().toISOString(), 
      },
      {
        id: "7",
        system: true,
        content: `# Inventory Breakdown

## Current Stock Levels  

**Here’s a pie chart showing the current stock levels:**  
        
\`\`\`pie chart 
[
{ "Washers": 80,
  "Nuts": 200,
  "Bolts": 120,
  "Screws": 190,
  "Bearings": 130 }
]
\`\`\`

Multimodal AI systems can process and understand multiple types of input simultaneously [^1] [^2] [^3][^2], such as text, images, audio, and video [^2]. This allows for more natural interactions and broader applications [^3].

[^1]: [OpenAI Blog - GPT-4 Vision and Multimodal Capabilities](https://openai.com/blog/gpt-4-vision)
[^2]: [Google AI - Gemini: A Family of Highly Capable Multimodal Models](https://ai.googleblog.com/gemini)
[^3]: [MIT Tech Review - The Year AI Became Multimodal](https://www.technologyreview.com/2024/ai-multimodal)
`,
        createdAt: new Date().toISOString(), 
    },
    {
      id: "8",
      system: false,
      content: `Direct me to the proper warehouse location in London, UK.`,
      createdAt: new Date().toISOString(), 
    },
    {
      id: "9",
      system: true,
      content: `# Warehouse Location

The main warehouse is located in London, UK:

\`\`\`map
{ 
  "satellite": true, 
  "coordinates": { "lat": 51.509865, "lng": -0.118092 } 
}
\`\`\`

This location provides optimal access to European distribution networks and major shipping routes.`,
createdAt: new Date().toISOString(), 
    },
    {
      id: "10",
      system: true,
      content: `# Actions

Actions are used to trigger a specific action in the application. They can be used to perform various tasks such as opening a URL, launching a command, or executing a script.

\`\`\`action
{
  "satellite": true,
  "coordinates": {
    "lat": 33.6407,
    "lng": -84.4277
  },
  "mode": "detect"
}
\`\`\`
`,
createdAt: new Date().toISOString(), 
    },
    ],
  }
  
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
                <GPTMessenger transcript={data?.transcript} isRunningInference={isRunningInference}/>
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="bg-inherit py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <GPTTextareaForm id={"gpt-textarea"} placeholder="Ask to find... or press 'space' for AI." disclaimer="Results are generated by AI and may be inaccurate." allowAttachments allowAudio allowReverseImageSearch={view === "map"} direction="right" onInferenceStateChange={setIsRunningInference} className="min-h-[140px]"/>
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
                  <TextEditor />
                ) : view === "spreadsheet" ? (
                  <Spreadsheet />
                ) : view === "map" && (
                  <MapView />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        )}
        </div>
      </div>
  )
}