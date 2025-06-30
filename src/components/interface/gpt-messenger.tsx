"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useResizeDetector } from 'react-resize-detector';
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Monitor,
  TrendingUp,
  File,
  FileText, 
  FileType, 
  Table2, 
  Download,
  ExternalLink,
  X,
  Image,
  FileArchive,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ChevronDown,
  Copy,
  MoreHorizontal,
} from "lucide-react"
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import remarkGfm from 'remark-gfm';
import { BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Bar, Line, LineChart, ResponsiveContainer, Sector } from 'recharts'; 
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { differenceInMinutes } from "date-fns";
import { TbPencil } from "react-icons/tb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { MapContainer, TileLayer } from "react-leaflet";
import { TextShimmer } from '@/components/core/text-shimmer';
import { TextEffect, type TextEffectProps } from "@/components/core/text-effect";
import rehypeRaw from 'rehype-raw';
import "leaflet/dist/leaflet.css";
import dynamic from 'next/dynamic';
import { ngrokUrl } from "@/lib/utils"

export function FileAttachment({ filename, content, downloadable = false }: { filename: string, content: string, downloadable?: boolean }) {
  const [imageError, setImageError] = useState(false);
  const fileExtension = filename.split('.').pop()?.toLowerCase() as string;
  const isImageFile = ['jpg', 'jpeg', 'png'].includes(fileExtension);
  const isViewableFile = ['pdf', 'doc', 'docx', 'csv', 'xlsx', 'xls', 'txt'].includes(fileExtension);
  
  const fileProperties = {
    pdf: { bgColor: "bg-blue-800", icon: <FileText className="text-blue-300 h-5 w-5" />, label: "PDF" },
    doc: { bgColor: "bg-purple-700", icon: <FileType className="text-purple-300 h-5 w-5" />, label: "Document" },
    docx: { bgColor: "bg-purple-700", icon: <FileType className="text-purple-300 h-5 w-5" />, label: "Document" },
    csv: { bgColor: "bg-green-700", icon: <Table2 className="text-green-300 h-5 w-5" />, label: "Spreadsheet" },
    xlsx: { bgColor: "bg-green-700", icon: <Table2 className="text-green-300 h-5 w-5" />, label: "Spreadsheet" },
    xls: { bgColor: "bg-green-700", icon: <Table2 className="text-green-300 h-5 w-5" />, label: "Spreadsheet" },
    txt: { bgColor: "bg-gray-700", icon: <FileText className="text-gray-300 h-5 w-5" />, label: "Text" },
    zip: { bgColor: "bg-yellow-700", icon: <FileArchive className="text-yellow-300 h-5 w-5" />, label: "Archive" },
    rar: { bgColor: "bg-yellow-700", icon: <FileArchive className="text-yellow-300 h-5 w-5" />, label: "Archive" },
    //  Fix this later
    // jpg: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
    // jpeg: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
    // png: { bgColor: null, fgColor: "text-gray-300", icon: null, label: "Image" },
    jpg: { bgColor: "bg-pink-700", icon: <Image className="text-pink-300 h-5 w-5" />, label: "Image" },
    jpeg: { bgColor: "bg-pink-700", icon: <Image className="text-pink-300 h-5 w-5" />, label: "Image" },
    png: { bgColor: "bg-pink-700", icon: <Image className="text-pink-300 h-5 w-5" />, label: "Image" },
  }[fileExtension] || { bgColor: "bg-gray-900", icon: <File className="text-gray-300 h-5 w-5" />, label: "File" };
  
  return (
    <div className="p-1.5 pl-2 pr-3 flex items-center justify-between rounded-xl border border-border  w-fit bg-sidebar/50 cursor-default mb-1">
      <div className="flex gap-2 items-center">
        <div className={`flex items-center justify-center rounded-md ${isImageFile && !imageError ? "p-0 bg-transparent" : `p-1.5 ${fileProperties.bgColor}`}`}>
          {/* Fix this later */}
           {isImageFile && !imageError ? (
            <img 
              src={content} 
              alt={filename}
              className="h-[36px] w-[36px] object-cover rounded-md"
              onError={() => setImageError(true)}
            />
          ) : (
            fileProperties.icon
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-white text-sm truncate max-w-[200px]">{filename}</div>
          <div className="text-muted-foreground text-xs">{fileProperties.label}</div>
        </div>
      </div>
      
      {downloadable && (
        <div className="flex items-center justify-center ml-4 gap-2">
          <div className="flex items-center justify-center">
            <Download className="text-gray-300 h-4 w-4 hover:text-white transition-colors" />
          </div>
          {isViewableFile && (<div className="flex items-center justify-center">
            <ExternalLink className="text-gray-300 h-4 w-4 hover:text-white transition-colors" />
          </div>)}
        </div>
      )}
    </div>
  );
}

function SourcePopoverBadge({ sources }: { sources: { title: string; description: string; url: string }[] }) {
  const [currentPage, setCurrentPage] = useState(0);
  
  if (!sources || sources.length === 0) {
    return null;
  }

  const totalPages = sources.length;
  const isPaginated = totalPages > 1;
  const currentSource = sources[currentPage];

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const formatUrl = (url: string) => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  };

  let badgeName = 'Source';
  if (!isPaginated) {
    try {
      badgeName = currentSource.title.split('-')[0]
    } catch {}
  } else {
    badgeName = `${sources[0].title.split('-')[0]}, +${totalPages - 1}`;
  }

  return (
    <Popover onOpenChange={(isOpen) => !isOpen && setCurrentPage(0)}>
      <PopoverTrigger asChild>
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer bg-blue-900/50 hover:bg-blue-900/80 border-blue-700/60 text-blue-300 align-middle"
        >
          {badgeName}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-sidebar border-border p-0" align="start">
        {isPaginated && (
          <div className="bg-background p-1 pr-3 flex items-center justify-between rounded-t-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="text-white hover:bg-gray-800 disabled:opacity-50 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className="text-white hover:bg-gray-800 disabled:opacity-50 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
            <div className="text-sm text-gray-300">
              {currentPage + 1}/{totalPages}
            </div>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <img
              src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${formatUrl(currentSource.url)}&size=64`}
              alt={currentSource.title}
              className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
            <div className="flex flex-col space-y-2 flex-1">
              <p className="text-sm font-bold text-white">{currentSource.title}</p>
              <p className="text-sm text-muted-foreground">
                {currentSource.description}
              </p>
              <a
                href={currentSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Visit Source
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function extractFileAttachments(content: string) {
  const fileRegex = /\[([^\]]+)\]\(([^)]+\.(pdf|doc|docx|xls|xlsx|csv|txt|zip|rar|jpg|jpeg|png|gif|svg|webp))\)/gi;
  const matches = [];
  let match;
  
  while ((match = fileRegex.exec(content)) !== null) {
    matches.push({
      text: match[1],
      href: match[2],
      fullMatch: match[0]
    });
  }
  
  return matches;
}

function extractSources(content: string): Map<string, { title: string; description: string; url: string }> {
  const footnoteRegex = /\[\^(\d+)\]:\s*\[([^\]]+)\]\(([^)]+)\)/g;
  const sources = new Map<string, { title: string; description: string; url: string }>();
  let match;

  while ((match = footnoteRegex.exec(content)) !== null) {
    const [, number, name, url] = match;
    
    let domain = '';
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
    } catch {
      domain = url;
    }
    
    sources.set(number, {
      title: name,
      description: `Source from ${domain}`,
      url: url
    });
  }

  return sources;
}

function removeFileAttachments(content: string, matches: Array<{fullMatch: string}>) {
  let newContent = content;
  for (const match of matches) {
    newContent = newContent.replace(match.fullMatch, '');
  }
  return newContent;
}

function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // You could add a toast notification here
      console.log("Content copied to clipboard")
    })
    .catch((err) => {
      console.error("Failed to copy: ", err)
    })
}

export function GPTMessenger({ 
  transcript,
  isRunningInference 
}: { 
  transcript: { 
    id: string;
    system: boolean;
    content: string;
  }[],
  isRunningInference: boolean
  }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isRunningInference && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [isRunningInference]);

    return (
      <>
        {!transcript.length && (
          <div className="flex flex-grow h-full flex-col items-center justify-center text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm text-muted">
                Ask anything, or press 'space' for AI.
              </p>
            </div>
          </div>
        )}
        {transcript.map((message: { 
            id: string;
            system: boolean;
            content: string;
          }, index: number) => {
          const fileAttachments = extractFileAttachments(message.content);
          const cleanedContent = removeFileAttachments(message.content, fileAttachments);
          const sourcesMap = extractSources(message.content);
          
          if (message.system) {
            return (
              <div className="flex flex-col" key={message.id || `system-message-${index}`}>
                {fileAttachments.length > 0 && (
                  <ScrollArea className="w-full">
                    <div className="flex flex-row gap-1 pt-3">
                      {fileAttachments.map((file, fileIndex) => (
                        <FileAttachment 
                          key={`file-${index}-${fileIndex}`}
                          downloadable
                          filename={file.text} 
                          content={file.href} 
                        />
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                )}
                  <div className="flex gap-2 py-3 px-1">
                    <div className="p-[4px] w-full border-none">
                        {/* <MarkdownRenderer 
                          content={cleanedContent} 
                          sources={sourcesMap} 
                        /> */}
                        <AnimatedMarkdownRenderer 
                          content={cleanedContent} 
                          sources={sourcesMap} 
                          isLastMessage={index === transcript.length - 1 && differenceInMinutes(new Date(), new Date((message as any)?.createdAt)) <= 2}
                        />
                      <div className="flex items-center gap-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(cleanedContent)}
                                className="h-8 w-8 p-0 hover:bg-muted"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy message</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Good response</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Poor response</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        </div>
                    </div>
                  </div>
                </div>
            );
          } else {
            return (
              <div className="flex justify-end first:pt-6 py-1" key={message.id || `user-message-${index}`}>
                <div className="flex flex-col items-end">
                {fileAttachments.length > 0 && (
                  <ScrollArea className="w-full">
                    <div className="flex flex-col self-end items-end gap-0.5 py-3">
                      {fileAttachments.map((file, fileIndex) => (
                        <FileAttachment 
                          key={`file-${index}-${fileIndex}`}
                          filename={file.text} 
                          content={file.href} 
                        />
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                )}
                {cleanedContent && <div className="flex flex-col gap-2 group">
                  <div className="bg-sidebar-accent/50 rounded-lg p-3 border border-muted-foreground/5 min-w-[150px] max-w-3/5 w-fit">
                    <div className="text-primary">{cleanedContent}</div>
                  </div>
                  <div className="flex items-center self-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(cleanedContent)}
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy message</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                              <TbPencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                </div>
                }
                </div>
              </div>
            );
          }
        })
        }
       {isRunningInference && <div className="flex p-4">
        <TextShimmer className='text-md font-medium' 
        duration={2} 
        spread={2}
        >
          Generating response...
        </TextShimmer>
       </div>}
       <div ref={bottomRef} />
      </>
    );
}

const GeneratedSummary = ({ prompt }: { prompt: string }) => {
  const [summary, setSummary] = useState<string>("Generating summary...");

  const generateText = async (prompt: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      const baseUrl = ngrokUrl || process.env.NGROK_URL;

      const body = JSON.stringify({
        system_prompt: "You are a helpful writing assistant. Return **one** short sentence that summarizes the following text. The sentence should be more than **8 words**.",
        model: "gpt-4o-mini-2024-07-18",
        prompt: prompt,
      });

      const response = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null); 
        console.error('Error response data:', errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response
    } catch (error) {
      console.error('Failed to generate text:', error);
    }
    return prompt
  } 

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      const result = await generateText(prompt);
      if (isMounted) {
        setSummary(result);
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [prompt]);

  return <>{summary}</>;
};

function AnimatedMarkdownRenderer({
  content,
  sources,
  isLastMessage
}: {
  content: string;
  sources: Map<string, { title: string; description: string; url: string }>;
  isLastMessage: boolean;
}) {
  const [showAnimation, setShowAnimation] = useState(isLastMessage);
  const [reservedHeight, setReservedHeight] = useState<number | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const getPlainText = (markdown: string) => {
    return markdown
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .trim();
  };

  // Measure the final height when component mounts
  useEffect(() => {
    if (isLastMessage && showAnimation && measureRef.current) {
      // Temporarily render the final content to measure height
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.pointerEvents = 'none';
      tempDiv.style.width = `${measureRef.current.offsetWidth}px`;
      tempDiv.className = measureRef.current.className;
      tempDiv.textContent = getPlainText(content);
      
      document.body.appendChild(tempDiv);
      const height = tempDiv.offsetHeight;
      document.body.removeChild(tempDiv);
      
      setReservedHeight(height);
    }
  }, [content, isLastMessage, showAnimation]);

  if (isLastMessage && showAnimation) {
    const plainText = getPlainText(content);

    return (
      <div 
        ref={measureRef}
        className="prose prose-invert max-w-none"
        style={{ 
          minHeight: reservedHeight ? `${reservedHeight}px` : 'auto',
          // Prevent layout shift during animation
          contain: 'layout'
        }}
      >
        <TextEffect
          per="char"
          preset="fade"
          speedReveal={2}
          speedSegment={2}
          delay={0.1}
          className="text-gray-200 leading-relaxed"
          onAnimationComplete={() => {
            setTimeout(() => setShowAnimation(false), 500);
          }}
        >
          {plainText}
        </TextEffect>
      </div>
    );
  }

  return <MarkdownRenderer content={content} sources={sources} isLastMessage={isLastMessage} />;
}

export function MarkdownRenderer({ 
  content,
  sources,
  isLastMessage
}: { 
  content: string,
  sources: Map<string, { title: string; description: string; url: string }>
  isLastMessage: boolean
}) {
  const { actionHandler, setActionHandler } = useGlobalContext()

  useEffect(() => {
    if(!isLastMessage) return
    const actionRegex = /```action\s*([\s\S]*?)\s*```/;
    const match = content.match(actionRegex);

    if (match && match[1]) {
      try {
        const actionData = JSON.parse(match[1].trim());
        setActionHandler(actionData);
      } catch (error) {
        console.error("Error parsing action data from markdown:", error);
      }
    }
  }, [content, setActionHandler]);

  const processFootnotes = (text: string) => {
    const adjacentFootnotePattern = /(\[\^(\d+)\](?:\s*\[\^(\d+)\])*)/g;
    
    return text.replace(adjacentFootnotePattern, (match) => {
      const individualRefs = match.match(/\[\^(\d+)\]/g);
      if (!individualRefs) return match;
      
      const numbers = individualRefs.map(ref => {
        const numberMatch = ref.match(/\d+/);
        return numberMatch ? numberMatch[0] : null;
      }).filter(Boolean);
      
      if (numbers.length > 1) {
        return `<sup>[${numbers.join('][')}]</sup>`;
      } else {
        return `[^${numbers[0]}]`;
      }
    });
  };

  const processedContent = processFootnotes(content);

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-white" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mb-3 mt-5 text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mb-2 mt-4 text-white" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed text-gray-200" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-200" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-200" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1" {...props} />
          ),
          a: ({ node, href, children, ...props }) => {
            const isFileAttachment = href && (
              href.match(/\.(pdf|doc|docx|xls|xlsx|csv|txt|zip|rar)$/i) ||
              props.className === 'file-attachment'
            ); 
            if (isFileAttachment) {
              return null;
            }
            return (
              <a
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                href={href}
                {...props}
              >
                {children}
              </a>
            );
          },
          sup: ({ node, children, ...props }) => {
            const content = String(children);
            const groupedMatch = content.match(/^\[(\d+(?:\]\[\d+)*)\]$/);
            
            if (groupedMatch) {
              const numbersStr = groupedMatch[1];
              const numbers = numbersStr.split('][');
              
              const groupedSources = numbers
                .map(num => sources.get(num))
                .filter((source): source is { title: string; description: string; url: string } => source !== undefined);
              
              if (groupedSources.length > 0) {
                return <SourcePopoverBadge sources={groupedSources} />;
              }
            }
            
            const link = React.Children.toArray(children)[0];
            if (React.isValidElement(link) && link.props.href?.startsWith('#user-content-fn-')) {
              const footnoteId = String(link.props.children);
              const source = sources.get(footnoteId);
          
              if (source) {
                return <SourcePopoverBadge sources={[source]} />;
              }
            }
            
            return <sup {...props}>{children}</sup>;
          },
          section: ({ node, ...props }) => {
            if ((props as any)['data-footnotes'] !== undefined) {
              return null; 
            }
            return <section {...props} />;
          },
          code: ({
            node,
            inline,
            className,
            children,
            ...props
          }: {
            inline?: boolean;
            node?: any;
            className?: string;
            children?: React.ReactNode;
          } & React.HTMLAttributes<HTMLElement>) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match?.[1];

            if (lang === "action") {
              return null;
            }

            const MapPreview = dynamic(
              () => import('./map').then((mod) => mod.MapPreview),
              {
                loading: () => <div 
                className="w-full"
                ><Skeleton className="w-full max-w-[500px] aspect-[4/3] rounded-lg" /></div>,
                ssr: false,
              }
            );

            if (lang === "map" && !inline) {
              try {
                const dataString = String(children).trim()
                const mapData = JSON.parse(dataString)

                const { satellite, coordinates } = mapData

                return (
                  <div className="flex min-w-full h-fit mb-3">
                  <div className="flex flex-col w-full max-w-[500px]">
                    <div className="flex w-full py-2.5 px-3 bg-sidebar rounded-lg rounded-b-none justify-between items-center border border-border border-b-0">
                      <div className="text-xs text-muted-foreground truncate whitespace-nowrap overflow-hidden max-w-[300px]">
                      <GeneratedSummary prompt={`Generate a summary of the map using the following text: \n\n${content}`} />
                        </div>
                      <MoreHorizontal className="h-5 w-5 text-muted-foreground"/>
                    </div>
                  <Card className="w-full max-w-[500px] aspect-[4/3] group rounded-t-none">
                    <CardContent className="h-full w-full p-0 relative" onClick={() => {}}>
                      <div className="w-full h-full rounded-lg overflow-hidden rounded-t-none">
                      <MapPreview
                        focalPoint={coordinates}
                        isSatelliteMode={satellite}
                      />
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 group-hover:backdrop-blur-sm transition-opacity duration-200">
                        <div
                          className="bg-background/80 backdrop-blur-md text-sm px-3 py-1.5 rounded-md flex items-center gap-2 pointer-events-auto hover:bg-background"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Full Map
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                  </div>
                )
              } catch (error) {
                return (
                  <div className="!bg-red-900/20 !border !border-red-500/30 !text-red-300 !px-4 !py-3 !rounded-lg !my-4 mt-0 text-xs max-w-full">
                    Error rendering map: {(error as Error).message}
                  </div>
                )
              }
            }

            if (['line', 'bar', 'pie'].includes(lang as string) && !inline) {
              try {
                const dataString = String(children).trim();
                const chartData = useMemo(() => {
                  try {
                    return JSON.parse(dataString);
                  } catch {
                    return new Function(`return ${dataString};`)();
                  }
                }, [dataString]);
            
                const categories = Object.keys(chartData[0]).filter(key => key !== "xAxis" && key !== "yAxis");
                
                const chartConfig = (categories: string[]): ChartConfig =>
                  categories.reduce((config, category, index) => {
                    config[category] = {
                      label: category,
                      color: `hsl(var(--chart-${index + 1}))`,
                    };
                    return config;
                  }, {} as ChartConfig);
            
                const configuration = chartConfig(categories);
            
                const assorted = lang === 'pie' 
                  ? categories.map(category => ({
                      name: category,
                      value: chartData.reduce((sum: number, entry: any) => sum + (entry[category] || 0), 0)
                    }))
                  : chartData;
            
                return (
                  <div className="flex min-w-full h-fit mb-3">
                  <div className="flex flex-col w-full max-w-[500px]">
                    <div className="flex w-full py-2.5 px-3 bg-input rounded-lg rounded-b-none justify-between items-center border border-border border-b-0">
                      <div className="text-xs text-muted-foreground truncate overflow-hidden max-w-[300px]">
                      <GeneratedSummary prompt={`Generate a summary of the ${lang} chart using the following text: \n\n${content}`} />
                        </div>
                      <MoreHorizontal className="h-5 w-5 text-muted-foreground"/>
                    </div>
                    <Card className="w-full rounded-t-none aspect-[4/3]">
                      <CardContent className="h-full w-full">
                        <ChartContainer config={configuration} className=" h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            {lang === 'line' ? (
                              <LineChart
                                accessibilityLayer
                                data={assorted}
                                margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                              >
                                <CartesianGrid vertical={false} />
                                <ChartTooltip
                                  cursor={true}
                                  content={<ChartTooltipContent />}
                                />
                                <XAxis
                                  dataKey="xAxis"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={1}
                                  tickFormatter={(value) => value.slice(0, 3)}
                                  interval={0}
                                />
                                {categories.map((category: string, idx: number) => 
                                  <Line 
                                    key={`line-${category}-${idx}`}
                                    dataKey={category} 
                                    type="step" 
                                    stroke={configuration[category].color}
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                )}
                              </LineChart>
                            ) : lang === 'bar' ? (
                              <BarChart
                                layout="vertical"
                                data={assorted}
                                margin={{ top: 40, right: 5, left: -20, bottom: 0 }}
                              >
                                <CartesianGrid horizontal={false} />
                                
                                <ChartTooltip
                                  cursor={true}
                                  content={<ChartTooltipContent />}
                                />
                            
                                <XAxis
                                  type="number"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={5}
                                />
                                
                                <YAxis
                                  type="category"
                                  dataKey="xAxis"
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(value) => value.slice(0, 3)}
                                  interval={0}
                                />
                                
                                {categories.map((category: string, idx: number) => 
                                  <Bar 
                                    key={`bar-${category}-${idx}`}
                                    dataKey={category} 
                                    fill={configuration[category].color}
                                    minPointSize={50}
                                    radius={4}
                                  />
                                )}
                              </BarChart>
                            ) : (
                              <PieChart>
                                <Pie
                                  data={assorted}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="60%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  activeShape={({
                                    outerRadius = 0,
                                    ...props
                                  }: PieSectorDataItem) => (
                                    <Sector {...props} outerRadius={outerRadius + 10} />
                                  )}
                                >
                                  {assorted.map((entry: any, index: number) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={configuration[entry.name].color}
                                    />
                                  ))}
                                </Pie>
                                <ChartTooltip
                                  content={<ChartTooltipContent />}
                                />
                                <ChartLegend
                                  content={<ChartLegendContent nameKey="name" />}
                                  className="translate-y-5 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                                />
                              </PieChart>
                            )}
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>
                  </div>
                );
              } catch (error) {
                return (
                  <div className="!bg-red-900/20 !border !border-red-500/30 !text-red-300 !px-4 !py-3 !rounded-lg !my-4 mt-0 text-xs max-w-full">
                    Error rendering chart: {(error as Error).message}
                  </div>
                );
              }
            }

            return !inline ? (
              <pre className="!bg-gray-800/50 !p-4 !rounded-lg !overflow-x-auto !mb-4 !mt-4 !border !border-gray-700">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="!bg-gray-800/50 !px-1.5 !py-0.5 !rounded !text-sm !font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="!p-0 !bg-transparent !overflow-hidden" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic mb-4 text-gray-300" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4 rounded-lg border border-muted-foreground/20">
              <table className="min-w-full border-collapse bg-transparent" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-input" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border-b border-muted-foreground/20 px-4 py-2 text-left font-semibold text-gray-200" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border-b border-muted-foreground/20 px-4 py-2 text-gray-300" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img className="rounded-lg max-w-full h-auto my-4" {...props} alt={props.alt || ''} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
