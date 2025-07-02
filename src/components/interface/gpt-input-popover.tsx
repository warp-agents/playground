"use client"

import React, { ReactNode, useRef, useState, useEffect } from "react";
import { ArrowRight, ArrowUp, ArrowDown, ArrowDownRight, CornerDownLeft, Ellipsis, CircleStop } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons"
import { cn, ngrokUrl } from "@/lib/utils";

export function GPTInputPopover({
  open,
  children,
  placeholder,
  className,
  border = false,
  systemPrompt,
  onResponse,
  onClose,
}: {
  open: boolean,
  children: ReactNode,
  placeholder: string,
  className?: string,
  border?: boolean,
  systemPrompt: string,
  onResponse: (newValue: string) => void,
  onClose?: () => void 
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState<string>("")
  const [isRunningInference, setIsRunningInference] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const handlePopoverClose = () => {
    setInputValue("")
    onClose?.()
  }

  const handleSendPrompt = async () => {
    if (inputValue.trim()) {
      setIsRunningInference(true)
      try {
        const headers = {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        };
        const baseUrl = ngrokUrl || process.env.NGROK_URL;
  
        const body = JSON.stringify({
          system_prompt: systemPrompt,
          prompt: inputValue,
        });
  
        const response = await fetch(`${baseUrl}/generate-lite`, {
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
        data.response && onResponse(data.response)
      } catch (error) {
        console.error('Failed to generate text:', error);
      }finally{
        setIsRunningInference(false)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handlePopoverClose}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        onOpenAutoFocus={(e: any) => e.preventDefault()}
        className={
          cn(`p-0 border-none bg-transparent`,
          open && "w-[var(--radix-popover-trigger-width)]",
          className
        )}
        side="top"
        align="start"
      >
        <div className="flex relative">
          <div className="min-h-[30px] min-w-[30px] w-[35px] h-[35px] rounded-full overflow-hidden bg-sidebar flex items-center justify-center absolute z-0 top-1/2 left-1 -translate-y-1/2">
          <svg width="16.53" height="8" viewBox="0 0 31 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.251 11.1719C15.2508 13.286 13.537 14.9998 11.4229 15H6.27637V11.1719H15.251ZM30.8545 6.48633C31.4005 8.52409 30.1952 10.6189 28.1611 11.1719H28.1797C28.1795 13.2861 26.4658 14.9999 24.3516 15H19.2051V14.9893C17.5385 14.9627 16.0232 13.8433 15.5703 12.1533L13.1172 2.99902L16.8154 2.00879L19.2705 11.1719H28.1465L25.418 0.991211L29.1162 0L30.8545 6.48633ZM6.15039 9.90723C6.69764 11.9496 5.48571 14.0485 3.44336 14.5957L0 1.74414L3.69824 0.75293L6.15039 9.90723Z"  fill="white" />
          </svg>
          </div>
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            autoFocus
            className={cn("h-[45px] pl-[50px] bg-popover w-full pr-[102px]",
              border ? "border border-border" : "rounded-t-none border-t-0",
              className
            )}
          />
          <div className="flex items-center justify-center absolute z-0 top-1/2 right-[3px] -translate-y-1/2 bg-inherit">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                variant="ghost" 
                size="icon" 
                className={cn("bg-transparent mr-1", className)}
                >
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={cn("w-[300px] max-h-[400px] overflow-y-auto bg-input", className)}
              >
                <DropdownMenuCheckboxItem checked>
                  Gemma3
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem disabled>
                  quantum-evolve-gemma3-promptgen-v0.1
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            { !isRunningInference ? 
            <Button 
                variant="ghost"
                size="icon"
                disabled={isRunningInference}
                onClick={handleSendPrompt}
                className={cn("bg-transparent", className)}
              >
              { <ArrowDownRight /> }
            </Button>:
            <Button variant="ghost" className="bg-transparent" size="icon">
            <CircleStop /> 
            </Button>}
          </div>
          
        </div>
      </PopoverContent>
    </Popover>
  );
}