"use client"

import React, { useState, useEffect, useRef, use } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage  } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { 
    MoreVertical, 
    ChevronDown, 
    Share2,
    Archive,
    X,
    Medal,
    Trash2,
    CircleX,
    LogOut,
    PanelLeftOpen,
    Search,
    SquarePen,
    TextSearch,
    Settings,
    CreditCard, 
    PlusCircle, 
    Plus, 
    UserPlus,
    Upload,
    MoreHorizontal,
    CheckCircle2,
    BriefcaseBusiness,
    User,
    StickyNote,
    Pin,
    PinOff,
} from "lucide-react"
import { TbListSearch, TbMessagePlus, TbLayoutSidebar } from "react-icons/tb";
import { BiEdit } from "react-icons/bi";
import { Input } from "@/components/ui/input";
import { TbPlaylistAdd } from "react-icons/tb";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile"
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Icons } from "@/components/ui/icons"
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
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession, signOut } from "next-auth/react"
import {
  checkConnection,
  createChat,
  createUser,
  getChatsByUserId,
} from "@/lib/dbs/supabase"

export function Header({ mode }: { mode: "chat" | "agents" }) {
  const { data: session, status } = useSession()
  const { isSearchDialogOpen, setIsSearchDialogOpen } = useGlobalContext()
  const [pinned, setPinned] = useState(false)
  
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated" && session

  const handleSignOut = () => {
    signOut({ callbackUrl: window.location.origin })
  }

  useEffect(() => {
    console.log("Session header:", session)
    checkConnection()
    createUser({
        id: (session as any)?.user?.id as string,
        email: session?.user?.email as string,
        name: session?.user?.name as string
    })
  },  [session])

  return (
    <header className={cn(
      "flex flex-grow items-center justify-between px-4 py-2 h-[50px] bg-background border border-border md:border-none md:bg-transparent text-white absolute top-0 left-0 right-0 z-10",
      "sm:")}>
      <div className="flex items-center gap-2">
        {mode === "agents" && <a href="#">
          <Icons.logo />
        </a>}
        {mode === "chat" &&
        <SidebarTrigger/>}
      </div>

      <div className="flex items-center ml-3">
        <img src="/bolt.png" alt="Built with Bolt" className="h-8 w-8" />
      </div>
      {isAuthenticated && 
      <div className="flex items-center gap-3 ml-auto">
       <div className="flex items-center gap-1">
       <Button
          variant="ghost" 
          size="icon"
          onClick={() => setIsSearchDialogOpen(true)}
        >
          <TbListSearch className="h-5 w-5" />
        </Button> 
        
        <Button variant="ghost" size="icon" onClick={() => setPinned(!pinned)}>
          {pinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
        </Button>
       </div>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
            <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User avatar"} />
            <AvatarFallback className="bg-gray-600 text-white">
              {session?.user?.name?.charAt(0)?.toUpperCase() ||
                session?.user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" sideOffset={8} className="bg-background">
          <SettingsDialog/>
          <DropdownMenuSeparator /> 
          <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-red-600">
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>}
    </header>
  )
}

function SettingsDialog() {
    const [open, setOpen] = useState(false);
    const [orgName, setOrgName] = useState("Acme Corporation");
    const [orgDescription, setOrgDescription] = useState("Leading provider of innovative solutions");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    const handleArchiveAll = () => {
        setArchiving(true);
        setTimeout(() => {
        setArchiving(false);
        }, 1000);
    };
    
    const handleDeleteAll = () => {
        setDeleting(true);
        setTimeout(() => {
        setDeleting(false);
        }, 1000);
    };
    
    const handleLogout = () => {
        console.log("Logging out...");
    };

return (
    <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
        
    <DropdownMenuItem
        onSelect={(e) => {
            e.preventDefault() 
            setOpen(true)
        }}
    ><div className="flex gap-2 justify-start items-center">
        <Settings className="h-4 w-4" /> 
        Settings</div>
    </DropdownMenuItem>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[700px] h-[600px] p-0 bg-popover flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0">
        <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex flex-1 overflow-hidden">
        <div className="border-r p-3">
            <TabsList className="flex flex-col h-auto bg-transparent p-0">
            <TabsTrigger 
                value="general" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-muted rounded-full data-[state=active]:border-primary transition-all"
            >
                <Settings className="h-4 w-4 mr-2" />
                General
            </TabsTrigger>
            </TabsList>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            <TabsContent value="general" className="mt-0 h-full p-6">
            <div className="space-y-6">
            
            <div className="space-y-4">
                <SettingsItem
                title="Archive all chats"
                action={
                    <Button 
                    variant="outline" 
                    onClick={handleArchiveAll}
                    disabled={archiving}
                    className="bg-transparent hover:bg-muted/80 transition-colors rounded-full"
                    >
                    {archiving ? (
                        <>
                        <span className="">Archiving...</span>
                        </>
                    ) : (
                        <>
                        <span className="">Archive all</span>
                        </>
                    )}
                    </Button>
                }
                />
                
                <Separator />
                
                <SettingsItem
                title="Delete all chats"
                action={
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                        variant="destructive" 
                        className="bg-red-600 hover:bg-destructive rounded-full"
                        >
                        <span className="">Delete all</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All your conversations will be permanently removed
                            from our servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteAll}
                            className="bg-red-600 hover:bg-destructive"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                }
                />
                
                <Separator />
                
                <SettingsItem
                title="Log out on this device"
                action={
                    <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="bg-transparent hover:bg-muted/80 transition-colors rounded-full"
                    >
                    <span className="">Log out</span>
                    </Button>
                }
                />
                
                <Separator />
                
                <SettingsItem
                title="Delete account"
                action={
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                        variant="destructive"
                        className="bg-red-600 hover:bg-destructive rounded-full"
                        >
                        <span className="">Delete account</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Your account and all your data will be permanently deleted.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-destructive"
                        >
                            Delete account
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                }
                />
            </div>
            </div>
            </TabsContent>
        </div>
        </Tabs>
    </DialogContent>
    </Dialog>
);
}

function SettingsItem({ 
    title, 
    action 
}: {
    title: string;
    action: React.ReactNode;
}) {
return (
    <div className="flex items-center justify-between">
    <div className="space-y-0.5">
        <h3 className="font-medium text-sm">{title}</h3>
    </div>
    {action}
    </div>
);
}