"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Pin, Search, Plus, Sparkles, Edit, Trash2, ArrowLeft, ArrowRight, Settings, LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/ui/icons"
import { useSidebar } from "@/components/ui/sidebar"
import { TextEffect } from "@/components/core/text-effect"
import { getChatsByUserId, getTranscriptsBySourceId, updateChat, deleteChat } from "@/lib/dbs/supabase"
import { ngrokUrl } from "@/lib/utils"

function Logo() {
  return (
    <div className="flex items-center group-data-[collapsible=icon]:justify-center">
      <div className="group-data-[collapsible=icon]:hidden flex items-center gap-3">
        <Icons.logo className="h-8 w-8" />
      </div>

      <div className="group-data-[collapsible=icon]:flex hidden items-center justify-center">
        <Icons.logo className="h-8 w-8" />
      </div>
    </div>
  )
}

interface ChatItemProps {
  chat: {
    id: string
    name: string
    createdAt: Date
  }
}

export function ChatItem({ chat }: ChatItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [generatedName, setGeneratedName] = useState<string | null>(chat?.name ?? null);
  const [isLoadingName, setIsLoadingName] = useState(false);

  const generateText = async (prompt: string) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      const baseUrl = ngrokUrl || process.env.NGROK_URL;

      const body = JSON.stringify({
        system_prompt: `You are a helpful writing assistant. Return one short title that summarizes the following text. The sentence should be more than 5 words. Only return the sentence, do not include any explanation, labels, or extra text.
      Text:\n\n`,
        prompt: prompt,
      });

      const response = await fetch(`${baseUrl}/generate-lite`, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response data:", errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Failed to generate text:", error);
      return prompt;
    }
  };

  useEffect(() => {
    if (!chat?.name) {
      setIsLoadingName(true);
      getTranscriptsBySourceId("chat", chat.id).then((transcripts: any) => {
        const firstTranscript = transcripts?.[0];
        if (firstTranscript) {
          generateText(firstTranscript.content).then((text) => {
            setGeneratedName(text);
            setIsLoadingName(false);
            updateChat(chat.id, text);
          });
        } else {
          setGeneratedName("Untitled Chat");
          setIsLoadingName(false);
        }
      });
    }
  }, [chat?.name, chat?.id]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-auto py-2 group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a href={`/c/${chat.id}`} className="flex items-center justify-between w-full">
          <span className="text-sm font-medium truncate flex-1">
            {isLoadingName && "Loading..."}
            {!isLoadingName && (
              generatedName ? (
                <TextEffect
                  per="char"
                  preset="fade"
                  speedReveal={1}
                  speedSegment={1}
                  trigger={!!generatedName}
                >
                  {generatedName}
                </TextEffect>
              ) : (
                "Untitled Chat"
              )
            )}
          </span>

          <div
            className={`transition-opacity flex items-center gap-1 ml-2 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteChat(chat.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface ChatSectionProps {
  title: string
  icon: React.ReactNode
  chats: Array<{
    id: string
    name: string
    createdAt: Date
    pinned?: boolean
  }>
}

function ChatSection({ title, icon, chats }: ChatSectionProps) {
  if (chats.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        {title === "Pinned" && icon}
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{chats.map((chat) => <ChatItem key={chat.id} chat={chat} />)}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function ChatSidebar() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const { toggleSidebar, state } = useSidebar()

  const isAuthenticated = status === "authenticated" && session

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(startOfWeek.getDate() - today.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [allChats, setAllChats] = useState<any[]>([])

  const userId = (session as any)?.user?.id
  useEffect(() => {
    if (isAuthenticated && userId) {
      getChatsByUserId(userId)
        .then((fetchedChats) => {
          const normalized = fetchedChats.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.created_at),
          }))
          setAllChats(normalized)
        })
        .catch((err) => {
          console.error("Failed to fetch chats:", err)
        })
    } else {
      setAllChats([])
    }
  }, [isAuthenticated, userId])

  const pinnedChats: any[] = allChats.filter((chat) => chat?.pinned)
  const unpinnedChats: any[] = allChats.filter((chat) => !chat?.pinned)

  const sortedUnpinnedChats = [...unpinnedChats].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  const todayChats: any[] = [];
  const yesterdayChats: any[] = [];
  const thisWeekChats: any[] = [];
  const thisMonthChats: any[] = [];
  const pastChats: any[] = [];
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  for (const chat of sortedUnpinnedChats) {
    const created = chat.createdAt;
  
    if (created >= today) {
      todayChats.push(chat);
    } else if (created >= yesterday) {
      yesterdayChats.push(chat);
    } else if (created >= startOfWeek) {
      thisWeekChats.push(chat);
    } else if (created >= thirtyDaysAgo) {
      thisMonthChats.push(chat);
    } else {
      pastChats.push(chat);
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: window.location.origin })
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="px-2 py-3">
          <Logo />
        </div>

        <div className="group-data-[collapsible=icon]:hidden px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        <div className="group-data-[collapsible=icon]:flex items-center hidden pt-2">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <div className="group-data-[collapsible=icon]:hidden p-2 border-b">
          <Button variant="secondary" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        </div>

        <div className="group-data-[collapsible=icon]:block hidden p-2 border-b">
          <Button variant="secondary" size="icon" className="w-8 h-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="group-data-[collapsible=icon]:hidden">
          {allChats.length > 0 ? (
            <>
              <ChatSection title="Pinned" icon={<Pin className="h-4 w-4" />} chats={pinnedChats} />
              <ChatSection title="Today" icon={null} chats={todayChats} />
              <ChatSection title="Yesterday" icon={null} chats={yesterdayChats} />
              <ChatSection title="This Week" icon={null} chats={thisWeekChats} />
              <ChatSection title="This Month" icon={null} chats={thisMonthChats} />
              <ChatSection title="Past" icon={null} chats={pastChats} />
            </>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="p-2 text-sm text-center text-muted-foreground w-full">No chats yet</div>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            {isAuthenticated ? 
            <>
            <div className="group-data-[collapsible=icon]:flex hidden flex-col items-center gap-2 px-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
                <ArrowRight className="h-4 w-4" />
              </Button>
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
                <DropdownMenuContent align="center" side="right" sideOffset={8}>
                  <DropdownMenuItem className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between w-full px-1">
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
                <DropdownMenuContent align="start" side="top" sideOffset={8}>
                  <DropdownMenuItem className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            </>
            :
            <>
            <div className="group-data-[collapsible=icon]:hidden flex">
              <Button 
                variant="secondary" 
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
                className="w-full"
              >
                <Icons.google className="mr-0.5 h-4 w-4" />
                <div className="text-sm font-regular">Sign Up / Login with Google</div>
              </Button>
            </div>

            <div className="group-data-[collapsible=icon]:flex hidden">
              <Button 
                variant="secondary" 
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
                className="w-8 h-8"
                size="icon"
              >
                <Icons.google className="h-4 w-4" />
              </Button>
            </div>
            </>
            }
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}