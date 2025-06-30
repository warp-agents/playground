"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  MessageCircle, 
  File, 
  FolderOpen, 
  FolderClosed, 
  Plus, 
  SquarePen, 
  CornerUpRight, 
  CalendarFold, 
  BellRing, 
  TrafficCone, 
  Ban,
  FileText,
  FileType,
  Table2,
  FileArchive,
} from 'lucide-react'
import { useGlobalContext } from '@/contexts/GlobalContext'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { GPTInputPopover } from "./gpt-input-popover"
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { Contract, Chat } from "@/lib/types";

const mockData = {
  contracts: [
    { 
      id: 1, 
      name: 'Service Agreement', 
      country: ['US', 'CA'],
      deadline: '2025-05-15',
      status: 'active',
      agencies: [
        { name: 'DOD', seal: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Seal_of_the_United_States_Department_of_Defense_%282001%E2%80%932022%29.svg' },
        { name: 'NASA', seal: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg' },
        { name: 'DOE', seal: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Seal_of_the_United_States_Department_of_Energy.svg' }
      ]
    },
    { 
      id: 2, 
      name: 'Employment Contract', 
      country: 'GB',
      deadline: '2025-06-30',
      status: 'active',
      agencies: [
        { name: 'NHS', seal: 'https://wiki.erepublik.com/images/b/bd/Seal_of_the_Minister_of_Defence.png' }
      ]
    },
    { 
      id: 3, 
      name: 'Vendor Agreement', 
      country: 'AL',
      deadline: '2024-04-19',
      status: 'archived',
      agencies: []
    },
    { 
      id: 4, 
      name: 'NDA', 
      country: 'DE',
      deadline: '2024-07-13',
      agencies: [
        { name: 'BMI', seal: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Emblem_of_the_BfV.png' },
      ]
    },
    { 
      id: 5, 
      name: 'Partnership Agreement', 
      country: 'FR',
      status: 'rejected',
      deadline: '2024-07-15',
      agencies: []
    },
    { 
      id: 6, 
      name: 'Waste Management', 
      country: ['JP', 'US'],
      deadline: '2024-03-01',
      status: 'awarded',
      agencies: []
    },
  ],
  chats: [
    {
      id: "1",
      name: "Supply Chain Disruption Diagnostics",
      createdAt: "2023-03-01T00:00:00.000Z"
    },
    {
      id: "2",
      name: "Vendor Risk Analysis",
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "Contract Compliance Review",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "4",
      name: "Procurement Forecast Modeling",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: "5",
      name: "Logistics Cost Benchmarking",
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: "6",
      name: "Inventory Optimization Strategy",
      createdAt: "2022-11-15T12:30:00.000Z"
    },
  ],
  files: [
    { id: 1, name: 'Quarterly Report.pdf', source: 'Contract' },
    { id: 2, name: 'Meeting Minutes.docx', source: 'Chat' },
    { id: 3, name: 'Budget Proposal.xlsx', source: 'Contract' },
    { id: 4, name: 'Design Assets.zip', source: 'Chat' },
    { id: 5, name: 'User Research.pdf', source: 'Contract' },
  ]
}

const CountryFlags = ({ countries, className = "" }: { countries: string | string[], className?: string }) => {
  const countryArray = Array.isArray(countries) ? countries : [countries];

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {countryArray.map((code, index) => (
        <div
          key={`flag-${code}-${index}`}
          className="flex items-center justify-center h-5 w-5 rounded-full overflow-hidden bg-muted border"
          style={{ zIndex: countryArray.length - index }}
        >
          <img
            src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`}
            alt={`${code} flag`}
            className="h-5 w-5 object-cover"
          />
        </div>
      ))}
    </div>
  )
}

const AgencySeals = ({ agencies }: { agencies: Array<{ name: string, seal: string }> }) => {
  if (agencies.length === 0) return null;
  
  return (
    <div className="flex -space-x-2 ml-1">
      {agencies.map((agency, index) => (
        <div
          key={agency.name}
          className="flex items-center justify-center h-5 w-5 rounded-full bg-white border border-inherit overflow-hidden"
          style={{ zIndex: agencies.length - index }}
        >
          <img 
            src={agency.seal} 
            alt={`${agency.name} seal`}
            className="h-5 w-5 object-cover"
          />
        </div>
      ))}
    </div>
  )
}

export function SearchDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { isSearchDialogOpen, setIsSearchDialogOpen } = useGlobalContext()
  const [open, setOpen] = React.useState<boolean>(isOpen)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('all')
  const [inputValue, setInputValue] = useState('');
  const [gptPopoverOpen, setGptPopoverOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange(newOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " && inputValue === "") {
      e.preventDefault();
      setGptPopoverOpen(true);
    }
  };

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchDialogOpen((isSearchDialogOpen) => !isSearchDialogOpen)
      }
    }
  
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handlePopoverClose = () => {
    setGptPopoverOpen(false);
  }

  const onPopoverResponse = (value: string) => {
    setInputValue(value);
  };

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
  };
  
  const filteredContracts: Contract[] = mockData.contracts.filter(contract => 
    contract.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredChats = mockData.chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categorizeByTime = (items: Chat[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  
    const groups: Record<string, Chat[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Last Week': [],
      'Past': [],
    };
  
    items.forEach((item: Chat) => {
      const itemDate = new Date(item.createdAt);
      if (itemDate.toDateString() === today.toDateString()) {
        groups.Today.push(item);
      } else if (itemDate.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(item);
      } else if (itemDate >= startOfWeek && itemDate < today) {
        groups['This Week'].push(item);
      } else if (itemDate >= startOfLastWeek && itemDate < startOfWeek) {
        groups['Last Week'].push(item);
      } else {
        groups.Past.push(item);
      }
    });
  
    return groups;
  };

  const timeGroups = categorizeByTime(mockData.chats);

  const getTimeSince = (createdAt: string) => {
    const now = new Date();
    const postedDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now.getTime() - postedDate.getTime()) / 1000);
  
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) { 
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) { 
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  };
  
  const filteredFiles = mockData.files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const showContracts = (activeTab === 'all' || activeTab === 'contracts') && filteredContracts.length > 0
  const showChats = (activeTab === 'all' || activeTab === 'chats') && filteredChats.length > 0
  const showFiles = (activeTab === 'all' || activeTab === 'files') && filteredFiles.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 bg-popover overflow-hidden">
        <VisuallyHidden asChild>
          <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        <div className="">
          <GPTInputPopover 
            open={gptPopoverOpen} 
            placeholder={"Ask for suggestions..."}
            onResponse={onPopoverResponse}
            className="bg-popover"
            systemPrompt={"You are a helpful writing assistant. Generate a suggestion for the following text: \n\n"}
            onClose={handlePopoverClose}
            border
            >
          <div className="relative w-full h-fit">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10 w-full border-0 border-b rounded-b-none h-[50px] bg-popover"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          </GPTInputPopover>
        </div>
        
        <div className="p-4 gap-2 flex items-center">
          <Button variant="ghost" className="gap-1 h-9 p-2.5 rounded-sm">
            <SquarePen className="h-4 w-4" />
            Create New
          </Button>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-auto bg-transparent">
            <TabsList className='bg-transparent'>
              <TabsTrigger value="all" className='data-[state=active]:bg-accent h-9'>All</TabsTrigger>
              <TabsTrigger value="contracts" className='data-[state=active]:bg-accent h-9'>Contracts</TabsTrigger>
              <TabsTrigger value="chats" className='data-[state=active]:bg-accent h-9'>Chats</TabsTrigger>
              <TabsTrigger value="files" className='data-[state=active]:bg-accent h-9'>Files</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-4 pt-2">
          {showContracts && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Contracts  <span className="text-primary font-bold ml-1">{filteredContracts.length}</span></h3>
              <div className="space-y-2">
                {filteredContracts.map(contract => {
                  const deadlineDate = parseISO(contract.deadline)
                  const isPastDeadline = isPast(deadlineDate)
                  const deadlineText = isPastDeadline 
                    ? 'closed'
                    : formatDistanceToNow(deadlineDate, { addSuffix: false })

                  const getStatusColor = (status?: string) => {
                    switch (status) {
                      case 'active':
                        return 'bg-green-500';
                      case 'rejected':
                        return 'bg-red-500';
                      case 'awarded':
                        return 'bg-indigo-500';
                      case 'archived':
                        return 'bg-gray-500';
                      default:
                        return 'hidden';
                    }
                  };
                  return (
                    <div 
                      key={contract.id} 
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3"> 
                        <span className="font-medium">{contract.name}</span>
                        <div className="flex items-center">
                          <CountryFlags countries={contract.country} />
                          <AgencySeals agencies={contract.agencies} />
                        </div>
                      </div>
                      <div className={
                        cn("text-sm flex items-center gap-3",
                          isPastDeadline ? "text-background" : "text-muted-foreground"
                        )}>
                        <div className="flex items-center gap-1">
                          {isPastDeadline ? <Ban className="h-3 w-3" /> : <BellRing className="h-3 w-3" />}
                          {deadlineText}
                        </div>
                        {contract.status && (
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(contract.status)}`} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {showChats && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Chats <span className="text-primary font-bold ml-1">{filteredChats.length}</span></h3>
              <div className="space-y-2">
              {Object.entries(timeGroups).map(([timeLabel, chats]) => {
                  if (chats.length === 0) return null;
                  return (
                    <div key={timeLabel}>
                      <div className="text-xs ml-1 flex items-center gap-1 font-bold mt-4 text-muted-foreground/50">{timeLabel}</div>
                      <div className="space-y-2 mt-2">
                        {chats.map(chat => (
                          <div 
                            key={chat.id} 
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{chat.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{getTimeSince(chat.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {showFiles && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Files <span className="text-primary font-bold ml-1">{filteredFiles.length}</span></h3>
              <div className="space-y-2">
                {filteredFiles.map(file => {

                  const getFileProperties = (fileExtension: string) => {
                    const fileProperties = {
                      pdf: { bgColor: "bg-blue-800/20", icon: <FileText className="text-blue-300 h-3 w-3" /> },
                      doc: { bgColor: "bg-purple-700/20", icon: <FileType className="text-purple-300 h-3 w-3" /> },
                      docx: { bgColor: "bg-purple-700/20", icon: <FileType className="text-purple-300 h-3 w-3" /> },
                      csv: { bgColor: "bg-green-700/20", icon: <Table2 className="text-green-300 h-3 w-3" /> },
                      xlsx: { bgColor: "bg-green-700/20", icon: <Table2 className="text-green-300 h-3 w-3" /> },
                      xls: { bgColor: "bg-green-700/20", icon: <Table2 className="text-green-300 h-3 w-3" /> },
                      txt: { bgColor: "bg-gray-700/20", icon: <FileText className="text-gray-300 h-3 w-3" /> },
                      zip: { bgColor: "bg-yellow-700/20", icon: <FileArchive className="text-yellow-300 h-3 w-3" /> },
                      rar: { bgColor: "bg-yellow-700/20", icon: <FileArchive className="text-yellow-300 h-3 w-3" /> },
                    }[fileExtension] || { bgColor: "bg-gray-900/20", icon: <File className="text-gray-300 h-3 w-3" /> };
                    
                    return fileProperties;
                  };
                  const fileProps = getFileProperties(file.name.split('.').pop()?.toLowerCase() as string);
                  return(
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center h-6 w-6 rounded-full ${fileProps.bgColor}`}>
                      {fileProps.icon}
                      </div>
                      <span className="font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <CornerUpRight className="h-3 w-3 text-muted-foreground" />
                      {file.source.toLowerCase() === 'contract' ? (
                        <FolderOpen className="h-3 w-3" />
                      ) : (
                        <MessageCircle className="h-3 w-3" />
                      )}
                      <span>From {file.source}</span>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
          
          {!showContracts && !showChats && !showFiles && (
            <div className="py-8 text-center text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
