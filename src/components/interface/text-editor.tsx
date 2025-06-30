"use client";

import React, {type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import { 
    X,
    Plus, 
    Droplet,
    File,
    Mail,
    TextSelect,
    TableProperties,
    Languages,
    FileText,
    FileCode,
    Download,
    LucideIcon,
    Undo2Icon,
    Redo2Icon,
    Clipboard,
    PrinterIcon,
    ChevronDown,
    SpellCheckIcon,
    BoldIcon,
    ItalicIcon,
    StrikethroughIcon,
    UnderlineIcon,
    RemoveFormattingIcon,
    FeatherIcon,
    HighlighterIcon,
    TextCursorIcon,
    FileSpreadsheet,
    FileType,
    TextCursorInputIcon,
    ImageIcon,
    LinkIcon,
    Link2Icon,
    AlignLeftIcon,
    AlignCenterIcon,
    AlignRightIcon,
    AlignJustifyIcon,
    TextIcon,
    ListIcon,
    ListOrderedIcon,
    FilePlus2Icon,
    SparklesIcon,
    MinusIcon,
    PlusIcon,
    PaintbrushIcon,
    ALargeSmallIcon,
    EraserIcon,
    ListCollapseIcon,
    Scissors,
    CopyIcon,
    Settings,
    Settings2,
} from "lucide-react";
import { AiOutlineHighlight } from "react-icons/ai";
import { LiaHighlighterSolid } from "react-icons/lia";
import { BsCloudCheck } from "react-icons/bs";
import { TbDropletOff } from "react-icons/tb";
import { Checkbox } from "@/components/ui/checkbox";
import { TbTank } from "react-icons/tb";
import { PiShieldCheckBold } from "react-icons/pi";
import { PiAirplaneTakeoffBold } from "react-icons/pi";
import { TbListSearch } from "react-icons/tb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Separator } from "@radix-ui/react-separator";
import { cn, printPDF } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { useTextEditorStore } from "@/store/use-text-editor-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"
import { Ruler } from "./ruler"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DOMSerializer } from 'prosemirror-model';
import { GPTTextareaForm } from "./gpt-textarea-form"
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Underline from "@tiptap/extension-underline"
import FontFamily from "@tiptap/extension-font-family"
import TextStyle from "@tiptap/extension-text-style";
import { type Level } from '@tiptap/extension-heading';
import { Color } from '@tiptap/extension-color';
import { type ColorResult, CirclePicker } from 'react-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import ResizableImage from "@/extensions/resizable-image"
import PaginationExtension, { PageNode, HeaderFooterNode, BodyNode } from "tiptap-extension-pagination";
import { FontSize } from "@/extensions/font-size"
import { LineHeight } from "@/extensions/line-height"
import { InsertText } from '@/extensions/insert-text';
import { InsertESign } from "@/extensions/insert-e-sign";
import { FileDropZone } from "./file-drop-zone";
import * as mammoth from 'mammoth';

export default function TextEditor() {
    const { setEditor } = useTextEditorStore()
    const [leftMargin, setLeftMargin] = useState(92)
    const [rightMargin, setRightMargin] = useState(92)
    const [fileName, setFileName] = useState("Untitled Document")

    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    const [selection, setSelection] = useState<{
        text: string,
        html: string,
        from: number,
        to: number
    } | null>(null);
    const [showPopover, setShowPopover] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      onCreate: ({ editor }) => {
        setEditor(editor)
      },
      onDestroy: () => {
        setEditor(null)
      },
      onUpdate: ({ editor }) => {
        setEditor(editor)
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        
        if (from !== to) {
          const domSelection = window.getSelection();
          if (!domSelection) return;
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          if(!editorRef.current) return;
          const editorRect = editorRef.current.getBoundingClientRect();
          
          setPopoverPosition({
            left: Math.min(650, rect.right - editorRect.left + 20),
            top: Math.max(95, rect.top - editorRect.top - 20)
          });
          
          const text = editor.state.doc.textBetween(from, to);
          
          const slice = editor.state.doc.slice(from, to);
          const fragment = slice.content;
          const tempDiv = document.createElement('div');
          
          const serializer = editor.schema.cached.serializer || DOMSerializer.fromSchema(editor.schema);
          const domFragment = serializer.serializeFragment(fragment);
          
          tempDiv.appendChild(domFragment);
          const html = tempDiv.innerHTML;
          
          setSelection({
            text,
            html,
            from,
            to
          });
        } else {
          setShowPopover(false);
          setSelection(null);
        }
      },
      onFocus: ({ editor }) => {
        setEditor(editor)
      },  
      onBlur: ({ editor }) => {
        setEditor(editor)
      },
      onTransaction: ({ editor }) => {
        setEditor(editor)
      },
      onContentError: ({ editor }) => {
        setEditor(editor)
      },
      editorProps: {
        attributes: {
          class: 'focus:outline-none print:border-none border-none cursor-text',
        },
      },
      extensions: [
        StarterKit, 
        Table.configure({
          resizable: true,
        }),
        TableCell,
        TableHeader,
        TableRow,
        ResizableImage,
        Underline,
        FontFamily,
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          protocols: ['https://', 'http://']
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph', 'image'],
        }),
        FontSize,
        LineHeight.configure({
          types: ['paragraph', 'heading'],
          defaultLineHeight: "normal",
        }),
        PaginationExtension.configure({
          defaultPaperSize: 'Letter',
          defaultPaperColour: "#2E2E2E",
          defaultPageBorders: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
          // change to make dynamic
          pageAmendmentOptions: {
              enableHeader: false,
              enableFooter: false,
          },
        }),
        PageNode,
        HeaderFooterNode,
        BodyNode,
        InsertText,
        InsertESign,
      ],
      content: "",
    })

    const handleRulerChange = (leftMargin: number, rightMargin: number) => {
      setLeftMargin(leftMargin)
      setRightMargin(rightMargin)
    }

    const handleMouseUp = () => {
      if(selection){
        setShowPopover(true);
        return
      }
      setShowPopover(false);
    }
  
    return (
    <div className="min-h-screen bg-secondary-background flex flex-col">
      <header className="py-4 px-5 pb-0 space-y-2 w-full h-fit flex flex-col items-center sticky top-0 left-0 right-0 z-10 bg-secondary-background print:hidden">
        <div className="flex w-full h-fit items-center gap-2">
          <div className="flex flex-col -gap-.05">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Untitled Document"
                className="text-lg py-.5 px-1.5 pl-2.5 max-w-[175px] cursor-pointer truncate bg-transparent border-2 border-transparent hover:border-muted-foreground/10 focus:border-muted-foreground/10 outline-none rounded-md"
              />
              <BsCloudCheck/>
            </div>
            <MenuBar fileName={fileName} />
          </div>
        </div>
        <Toolbar fileName={fileName} /> 
        <div className="size-full px-2 bg-secondary-background pt-2 pb-[1px]">
          <Ruler onChange={handleRulerChange} />
        </div>
      </header>
      <div className="flex-1 bg-secondary-background px-4 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
        <div 
        ref={editorRef} 
        onMouseUp={handleMouseUp}
        className="relative min-w-max flex justify-center w-fit p-4 pt-0 print:py-0 mx-auto print:w-full print:min-w-0 print:h-full print:text-black">
          <EditorContent id="tiptap-editor" editor={editor} />
          {showPopover &&
          <div
          className={
            cn("absolute w-[300px] h-fit z-20 print:hidden rounded-xl overflow-hidden",
              "shadow-[0_14px_62px_0_rgba(0,0,0,0.25)]"
          )}
          style={{ top: `${popoverPosition.top}px`, left: `${popoverPosition.left}px` }}
          >
            <GPTTextareaForm 
            id={"gpt-textarea-popover"}
            placeholder="Ask anything, or press 'space' for AI."
            description={false} 
            allowAttachments 
            allowAudio 
            allowWebSearch 
            direction="right" 
            className=""/>
          </div>
        }
        </div>
      </div>
    </div>
    )
}

export function MenuBar({ fileName, onChange }: { fileName: string, onChange?: () => void }) {
  const { editor } = useTextEditorStore()
  const [clipboardText, setClipboardText] = useState<string | null>(null);

  function isTextSelected(editor: Editor) {
    const { state } = editor;
    const { from, to } = state.selection;
    const selectedText = state.doc.textBetween(from, to, " ");
    return selectedText.trim().length > 0;
  }

  const onDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const onDownloadHTML = () => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    if (!htmlContent) {
      return;
    }
    const blob = new Blob([htmlContent], { type: 'text/html' });
    onDownload(blob, `${fileName}.html`);
  };
   
  useEffect(() => {
    async function fetchClipboard() {
      try {
        const text = await navigator.clipboard.readText();
        setClipboardText(text);
      } catch (error) {
        setClipboardText(null);
      }
    }
    fetchClipboard();

    const interval = setInterval(fetchClipboard, 1000);
    return () => clearInterval(interval);
  }, []);

  return(
    <Menubar className="border-none bg-transparent shadow-none h-auto p-0 m-0">
    <MenubarMenu>
      <MenubarTrigger className="text-sm text-muted-foreground">
        File
      </MenubarTrigger>
      <MenubarContent className="bg-secondary-background print:hidden">
        <MenubarSub>
          <MenubarSubTrigger>
            <Download className="h-4 w-4 mr-2"/>
            Download
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
          <MenubarItem onClick={onDownloadHTML}>
              <FileCode className="h-4 w-4 mr-2"/>
              Web page {"(.html)"}
            </MenubarItem>
            <MenubarItem onClick={() => {if(editor) printPDF(fileName, editor)}}>
              <FileText className="h-4 w-4 mr-2"/>
              PDF Document {"(.pdf)"}
            </MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator/>
        <MenubarItem>
          <Mail className="h-4 w-4 mr-2"/>
          Email
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarSub>
          <MenubarSubTrigger>
            <Languages className="h-4 w-4 mr-2"/>
            Language
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
            <MenubarItem>中文 {"(Chinese)"}</MenubarItem>
            <MenubarItem>English</MenubarItem>
            <MenubarItem>日本語 {"(Japanese)"}</MenubarItem>
            <MenubarItem>Deutsch {"(German)"}</MenubarItem>
            <MenubarItem>हिन्दी {"(Hindi)"}</MenubarItem>
            <MenubarItem>Français {"(French)"}</MenubarItem>
            <MenubarItem>한국어 {"(Korean)"}</MenubarItem>
            <MenubarItem>Italiano {"(Italian)"}</MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator/>
        <MenubarItem>
          <PrinterIcon className="h-4 w-4 mr-2"/>
          Print <MenubarShortcut>⌘P</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger className="text-sm text-muted-foreground">
        Edit
      </MenubarTrigger>
      <MenubarContent className="bg-secondary-background">
        <MenubarItem onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2Icon className="h-4 w-4 mr-2"/>
          Undo <MenubarShortcut>⌘Z</MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2Icon className="h-4 w-4 mr-2"/>
          Redo <MenubarShortcut>⌘Y</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarItem disabled={editor ? !isTextSelected(editor): false}> 
          <Scissors className="h-4 w-4 mr-2"/>
          Cut <MenubarShortcut>⌘X</MenubarShortcut>
        </MenubarItem>
        <MenubarItem disabled={editor ? !isTextSelected(editor): false}>
          <CopyIcon className="h-4 w-4 mr-2"/>
          Copy <MenubarShortcut>⌘C</MenubarShortcut>
        </MenubarItem>
        <MenubarItem disabled={!clipboardText}>
          <Clipboard className="h-4 w-4 mr-2"/>
          Paste <MenubarShortcut>⌘V</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarItem>
          <TextSelect className="h-4 w-4 mr-2"/>
          Select All <MenubarShortcut>⌘A</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger className="text-sm text-muted-foreground">
        Insert
      </MenubarTrigger>
      <MenubarContent className="bg-secondary-background">
      <MenubarItem>
          <ImageIcon className="h-4 w-4 mr-2"/>
          Image
        </MenubarItem>
        <MenubarItem>
          <TableProperties className="h-4 w-4 mr-2"/>
          Table
        </MenubarItem>
        <MenubarItem>
          <TextCursorIcon className="h-4 w-4 mr-2"/>
          Text Insert
        </MenubarItem>
        <MenubarItem>
          <FeatherIcon className="h-4 w-4 mr-2"/>
          eSignature
        </MenubarItem>
        <MenubarItem>
          <FilePlus2Icon className="h-4 w-4 mr-2"/>
          Merge
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarItem>
          <Link2Icon className="h-4 w-4 mr-2"/>
          Link
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger className="text-sm text-muted-foreground">
        Format
      </MenubarTrigger>
      <MenubarContent className="bg-secondary-background">
        <MenubarSub>
          <MenubarSubTrigger>
            <TextIcon className="h-4 w-4 mr-2"/>
            Text Format
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
            <MenubarItem onClick={() => editor?.chain().focus().toggleBold().run()}>
              <BoldIcon className="h-4 w-4 mr-2"/>
              Bold <MenubarShortcut>⌘B</MenubarShortcut>
            </MenubarItem>
            <MenubarItem  onClick={() => editor?.chain().focus().toggleItalic().run()}>
              <ItalicIcon className="h-4 w-4 mr-2"/>
              Italic <MenubarShortcut>⌘I</MenubarShortcut>
            </MenubarItem>
            <MenubarItem  onClick={() => editor?.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon className="h-4 w-4 mr-2"/>
              Underline <MenubarShortcut>⌘U</MenubarShortcut>
            </MenubarItem>
            <MenubarItem  onClick={() => editor?.chain().focus().toggleStrike().run()}>
              <StrikethroughIcon className="h-4 w-4 mr-2"/>
              <span>Strikethrough&nbsp;&nbsp;</span> <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator/>
        <MenubarItem onClick={() => editor?.chain().focus().unsetAllMarks().run()}>
          <RemoveFormattingIcon className="h-4 w-4 mr-2"/>
          <span>Remove Formatting&nbsp;&nbsp;</span> <MenubarShortcut>⌘\</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger className="text-sm text-muted-foreground">
        Extensions
      </MenubarTrigger>
    </MenubarMenu>
  </Menubar>
  )
}

export function Toolbar({ fileName, onChange }: { fileName: string, onChange?: () => void }) {
  const { editor } = useTextEditorStore()

  const findXYCoords = (editor: Editor) => {
    const { state, view } = editor;
    const { selection } = state;

    const pos = selection.from;
    const coords = view.coordsAtPos(pos);

    const pages = document.querySelectorAll('.page');
    let pageIndex = 0;
    for (let i = 0; i < pages.length; i++) {
        const pageRect = pages[i].getBoundingClientRect();
        if (
            coords.left >= pageRect.left &&
            coords.left <= pageRect.right &&
            coords.top >= pageRect.top &&
            coords.top <= pageRect.bottom
        ) {
            pageIndex = i;
            break;
        }
    }

    // change to make dynamic
    const currentPage = pages[pageIndex];
    const pageRect = currentPage.getBoundingClientRect();

    const x = coords.left - pageRect.left;
    const y = coords.top - pageRect.top;

    const insertWidth = 155;  
    const insertHeight = 25;  
    const offsetX = 25;    
    const offsetY = 25; 

    let insertX = x + offsetX;
    let insertY = y + offsetY;
    let overflowX = false
    let overflowY = false

    if (insertX + insertWidth > pageRect.width - 200) {
      overflowX = true
      insertX = pageRect.width - 165 - insertWidth;
    }

    if (insertY + insertHeight > pageRect.height - 50) {
      overflowY = true
      insertY = pageRect.height - 50 - insertHeight;
    }

    const adjustedX = insertX - offsetX;
    const adjustedY = insertY - offsetY;

    return [adjustedX - (!overflowX ? 75 : 0), adjustedY - (!overflowY || !overflowX ? 75 : 0)];
  };

  const sections: {
    label: string,
    icon: LucideIcon,
    isActive?: boolean,
    onClick: () => void,
  }[][] = [
    [
    {
      label: "Undo",
      icon: Undo2Icon,
      onClick: () => editor?.chain().focus().undo().run(),
    },
    {
      label: "Redo",
      icon: Redo2Icon,
      onClick: () => editor?.chain().focus().redo().run(),
    },
    {
      label: "Print",
      icon: PrinterIcon,
      onClick: () => {if(editor) printPDF(fileName, editor)},
    },
    {
      label: "Spell Check",
      icon: SpellCheckIcon,
      onClick: () => {
        const current = editor?.view.dom.getAttribute("spellcheck");
        editor?.view.dom.setAttribute("spellcheck", current === "false" ? "true" : "false");
      },
    }
  ],
  [
    {
      label: "Bold",
      icon: BoldIcon,
      isActive: editor?.isActive("bold"),
      onClick: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: ItalicIcon,
      isActive: editor?.isActive("italic"),
      onClick: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      isActive: editor?.isActive("underline"),
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Strikethrough",
      icon: StrikethroughIcon,
      isActive: editor?.isActive("strike"),
      onClick: () => editor?.chain().focus().toggleStrike().run(),
    }
  ],
  [
    {
      label: "Insert text",
      icon: TextCursorIcon,
      onClick: () => {
        if (!editor) return;
        const [x, y] = findXYCoords(editor);

        editor?.chain().focus().insertContent({
          type: 'insertText',
          attrs: {
            x: x,
            y: y,
            width: 150,
            height: "auto",
          },
          content: [
            {
              type: 'text',
              text: 'Insert text here!'
            }
          ]
        }).run();
      }
    },
    {
      label: "eSignature",
      icon: FeatherIcon,
      onClick: () => {
        if (!editor) return;
        const [x, y] = findXYCoords(editor);

        editor?.chain().focus().insertContent({
          type: 'insertESign',
          attrs: {
            x: x,
            y: y,
            width: 275,
            height: "auto",
            content: 'E-sign!'
          }
        }).run();
      }
    },
  ],
  [
    {
      label: "Bullet list",
      icon: ListIcon,
      isActive: editor?.isActive("bulletList"),
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrderedIcon,
      isActive: editor?.isActive("orderedList"),
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Remove formatting",
      icon: RemoveFormattingIcon,
      onClick: () => editor?.chain().focus().unsetAllMarks().run(),
    },
  ],
  []
]

  return (
    <div className="bg-input px-2.5 py-0.5 rounded-[24px] min-h-[40px] w-full flex items-center gap-x-0.5 overflow-x-auto">
      {sections[0].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 shrink-0" />
      <FontFamilyButton />
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 shrink-0" />
      <HeadingLevelButton />
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 shrink-0" />
      <FontSizeButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 shrink-0" />
      {sections[1].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <TextColorButton/>
      <HighlightColorButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/40" />
      <LinkButton/>
      <ImageButton/>
      {sections[2].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <MergeFilesButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 shrink-0" />
      <AlignButton/>
      <LineHeightButton/>
      {sections[3].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <div className="ml-auto flex items-center gap-x-0.5">
        {sections[sections.length - 1].map((tool) => (
          <ToolbarButton key={tool.label} {...tool} />
        ))}
      </div>
    </div>
  )
}

export function ToolbarButton({ 
  onClick, 
  isActive, 
  label,
  icon: Icon 
}: { 
  onClick: () => void, 
  isActive?: boolean, 
  label: string,
  icon: LucideIcon }) {
    return(
      <TooltipProvider>
        <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onClick} className={cn("h-7 min-w-7 rounded-sm flex items-center justify-center bg-transparent hover:bg-secondary-background/50",
            isActive && "bg-secondary-background"
          )}>
            <Icon className={cn("h-4 w-4 p-0 m-0", 
              isActive ? "text-primary" : "text-muted-foreground")}/>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider> 
    )
}

export function FontFamilyButton(){
  const { editor } = useTextEditorStore()

  const fonts = [
    { label: "Arial", value: "Arial" },
    { label: "Courier New", value: "Courier New" },
    { label: "Georgia", value: "Georgia" },
    { label: "Helvetica", value: "Helvetica" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Microsoft Sans Serif", value: "Microsoft Sans Serif" },
    { label: "Cambria", value: "Cambria" },
  ];
  
  return(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("h-7 w-[80px] shrink-0 flex items-center justify-between rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
          <span className="truncate text-sm text-muted-foreground">
            {editor?.getAttributes("textStyle")?.fontFamily || "Arial"}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-input">
        {fonts.map(({ label, value }) => (
          <button
          key={value}
          className={cn("flex items-center rounded-sm gap-x-2 px-2 py-1 hover:bg-secondary-background/50",
            editor?.getAttributes("textStyle")?.fontFamily === value && "bg-secondary-background"
          )}
          style={{ fontFamily: value }}
          onClick={() => editor?.chain().focus().setFontFamily(value).run()}
          >
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu> 
  )
}

export function HeadingLevelButton(){
  const { editor } = useTextEditorStore()

  const headings = [
    { label: "Normal text", value: 0, fontSize: "16px" },
    { label: "Heading 1", value: 1, fontSize: "32px" },
    { label: "Heading 2", value: 2, fontSize: "24px" },
    { label: "Heading 3", value: 3, fontSize: "20px" },
    { label: "Heading 4", value: 4, fontSize: "18px" },
    { label: "Heading 5", value: 5, fontSize: "16px" },
  ]

  const getCurrentHeading = () => {
    for(let level = 1; level <= 5; level++) {
      if(editor?.isActive("heading", { level })) {
        return `Heading ${level}`
      }
    }
    return "Normal text"
  }

  return(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("h-7 min-w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
          <span className="truncate text-sm text-muted-foreground">
            {getCurrentHeading()}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-input">
        {headings.map(({ label, value, fontSize }) => (
          <button
          key={value}
          className={cn("flex items-center rounded-sm gap-x-2 px-2 py-1 hover:bg-secondary-background/50",
            (value === 0 && !editor?.isActive("heading")) || editor?.isActive("heading", { level: value }) && "bg-secondary-background"
          )}
          style={{ fontSize: fontSize }}
          onClick={() => {
            if(value === 0) {
              editor?.chain().focus().setParagraph().run()
            }else{
              editor?.chain().focus().unsetFontSize().run()
              editor?.chain().focus().toggleHeading({ level: value as Level }).run()
            }
          }}
          >
            {label}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu> 
  )
}

const customColors = [
  "#000000", "#1C1C1C", "#393939", "#555555", "#717171", "#8E8E8E", "#AAAAAA", "#C6C6C6", "#E3E3E3", "#FFFFFF",
  "#FF0000", "#FF9900", "#CCFF00", "#33FF00", "#00FF99", "#00FFFF", "#0066FF", "#CC00FF", "#FF0033", "#FF0099",
  "#FF3333", "#FFAD33", "#D9FF33", "#66FF33", "#33FF99", "#33FFFF", "#3366FF", "#CC33FF", "#FF33CC", "#FF33AD",
  "#FF6666", "#FFBF66", "#E6FF66", "#99FF66", "#66FFBF", "#66FFFF", "#6699FF", "#CC66FF", "#FF66E6", "#FF66C2",
  "#BF0000", "#BF7300", "#99BF00", "#26BF00", "#00BF73", "#00BFBF", "#004DBF", "#9900BF", "#BF0099", "#BF0073",
  "#800000", "#804D00", "#668000", "#198000", "#00804D", "#008080", "#003380", "#660080", "#800066", "#80004D",
  "#400000", "#402600", "#334000", "#0D4000", "#004026", "#004040", "#001A40", "#330040", "#400033", "#400026"
]

export function TextColorButton(){
  const { editor } = useTextEditorStore()

  const value = editor?.getAttributes("textStyle")?.color || "#FFFFFF"

  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setColor(color.hex).run()
  }

  return(
    <DropdownMenu>
    <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <span className="text-xs text-muted-foreground">A</span>
                <div className="h-0.5 w-full mt-.5" style={{ backgroundColor: value }}></div>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-input border-secondary-background">Text color</TooltipContent>
        </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-2.5 bg-input border-secondary-background rounded-md flex flex-col gap-2">
      <CirclePicker 
        color={value} 
        onChange={onChange} 
        colors={customColors}
        circleSize={19}
        circleSpacing={2}
        width="210px"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function HighlightColorButton(){
  const { editor } = useTextEditorStore()

  const value = editor?.getAttributes("highlight")?.color || "#00000000"

  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setHighlight({ color: color.hex }).run()
  }

  const undoHighlight = () => {
    editor?.chain().focus().unsetHighlight().run()
  }

  return(
    <DropdownMenu>
    <TooltipProvider>
      <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <HighlighterIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Highlight color</TooltipContent>
      </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-2.5 bg-input border-secondary-background rounded-md flex flex-col gap-2">
        <button onClick={undoHighlight} className="w-full flex items-center rounded-sm bg-secondary-background/50 hover:text-sidebar px-1.5 py-1 gap-1"><TbDropletOff className="w-4 h-4"/>None</button>
        <CirclePicker 
        color={value}
        onChange={onChange} 
        colors={customColors}
        circleSize={19}
        circleSpacing={2}
        width="210px"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LinkButton(){
  const { editor } = useTextEditorStore()
  const [value, setValue] = useState("")

  const onChange = (href: string) => {
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run()
    setValue("")
  }

  return(
    <DropdownMenu onOpenChange={(open) => {
      if(open){
        setValue(editor?.getAttributes("link").href || "")
      }
    }}>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
              <Link2Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Insert link</TooltipContent>
      </Tooltip> 
      </TooltipProvider>
      <DropdownMenuContent className="p-2.5 bg-input border-secondary-background rounded-md flex gap-x-2">
        <Input
        placeholder="https://example.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border-border"
        />
        <Button variant="secondary" onClick={()=> onChange(value)}>Apply</Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ImageButton(){
  const { editor } = useTextEditorStore()
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [imageURL, setImageURL] = useState("")

  const onChange = (src: string) => {
    editor?.chain().focus().setImage({ src }).run()
  }

  const onUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept ="image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if(file){
        const imageUrl = URL.createObjectURL(file)
        onChange(imageUrl)
      }
    }
    input.click()
  }

  return(
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild tabIndex={-1}>
            <DropdownMenuTrigger asChild>
              <button onClick={onUpload} className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-input border-secondary-background">Insert image</TooltipContent>
        </Tooltip>
      </TooltipProvider> 
    </DropdownMenu>
  )
}

export function AlignButton(){
  const { editor } = useTextEditorStore()

  const alignments = [
    { label: "Align Left", value: "left", icon: AlignLeftIcon },
    { label: "Align Center", value: "center", icon: AlignCenterIcon },
    { label: "Align Right", value: "right", icon: AlignRightIcon },
    { label: "Align Justify", value: "justify", icon: AlignJustifyIcon },
  ]

  return(
    <DropdownMenu>
    <TooltipProvider>
      <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <AlignLeftIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Align</TooltipContent>
      </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-2 bg-input border-secondary-background rounded-md flex">
        {alignments.map(({ label, value, icon: Icon }) => (
          <button
          key={value}
          className={cn("flex items-center rounded-sm p-2 hover:bg-secondary-background/50",
            editor?.isActive({ textAlign: value }) && "bg-secondary-background"  
          )}
          onClick={() => editor?.chain().focus().setTextAlign(value).run()}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function FontSizeButton(){
  const { editor } = useTextEditorStore()

  const currentFontSize = editor?.getAttributes("textStyle")?.fontSize 
    ? editor?.getAttributes("textStyle")?.fontSize.replace("px", "")
    : "16"
  
  const [fontSize, setFontSize] = useState(currentFontSize)
  const [inputValue, setInputValue] = useState(fontSize)
  const [isEditing, setIsEditing] = useState(false)

  const updateFontSize = (newSize: string) => {
    const size = parseInt(newSize)

    if(!isNaN(size) && size > 0) {
      editor?.chain().focus().setFontSize(`${newSize}px`).run()
      setFontSize(newSize)
      setInputValue(newSize)
      setIsEditing(false)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleInputBlur = () => {
    updateFontSize(inputValue)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      updateFontSize(inputValue)
      editor?.commands.focus()
    }
  }

  const increment = () => {
    const newSize = parseInt(fontSize) + 1
    updateFontSize(newSize.toString())
  }

  const decrement = () => {
    const newSize = parseInt(fontSize) - 1
    if(newSize < 0) return
    updateFontSize(newSize.toString())
  }

  const defaultFontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96]

  useEffect(() => {
    if (!editor) return;
  
    const updateFromSelection = () => {
      const selection = editor.state.selection;
      const { from, to } = selection;
      const fontSizes = new Set<string>();
      if (selection.empty) {
        const resolvedPos = editor.state.doc.resolve(from);
        const isAtEnd = resolvedPos.pos === resolvedPos.end();
        let positionToCheck = from;
        
        const storedMarks = editor.view.state.storedMarks;
        let textStyleMark = null;
        
        if (storedMarks) {
          textStyleMark = storedMarks.find(mark => mark.type.name === 'textStyle');
        }
        
        if (!textStyleMark || !textStyleMark.attrs.fontSize) {
          if (from === 0) {
            positionToCheck = from;
          } 
          else if (isAtEnd && from > 0) {
            positionToCheck = from - 1;
          } 
          else if (resolvedPos.pos === resolvedPos.start()) {
            positionToCheck = from;
          }
          
          const checkPos = editor.state.doc.resolve(positionToCheck);
          const marks = checkPos.marks();
          
          textStyleMark = marks.find(mark => mark.type.name === 'textStyle');
        }
        
        if (textStyleMark && textStyleMark.attrs.fontSize) {
          const fontSize = textStyleMark.attrs.fontSize.replace("px", "");
          setFontSize(fontSize);
          setInputValue(fontSize);
        } else {
          const dom = editor.view.domAtPos(positionToCheck);
          let node = dom.node;
          
          if (node.nodeType === Node.TEXT_NODE) {
            const parentNode = node.parentNode as HTMLElement;
            if (parentNode) {
              const fontSize = window.getComputedStyle(parentNode).fontSize.replace("px", "");
              setFontSize(fontSize);
              setInputValue(fontSize);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const fontSize = window.getComputedStyle(node as HTMLElement).fontSize.replace("px", "");
            setFontSize(fontSize);
            setInputValue(fontSize);
          }
        }
      } else {
        editor.state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText) return;
    
          const start = Math.max(pos, from);
          const end = Math.min(pos + node.nodeSize, to);
          if (start >= end) return;
    
          let dom = editor.view.domAtPos(start, 1);
          let textNode = dom.node;
    
          if (textNode.nodeType !== Node.TEXT_NODE && start < end) {
            dom = editor.view.domAtPos(start + 1);
            textNode = dom.node;
          }
    
          if (textNode.nodeType === Node.TEXT_NODE && textNode.parentNode) {
            const parent = textNode.parentNode as HTMLElement;
            const fontSize = window.getComputedStyle(parent).fontSize.replace("px", "");
            fontSizes.add(fontSize);
          }
        });
    
        if (fontSizes.size === 1) {
          const fontSize = fontSizes.values().next().value;
          setFontSize(fontSize);
          setInputValue(fontSize);
        } else {
          setFontSize(null);
          setInputValue("");
        }
      }
    };

    updateFromSelection();
  
    editor.on("selectionUpdate", updateFromSelection);
    editor.on("update", updateFromSelection)
  
    return () => {
      editor.off("selectionUpdate", updateFromSelection);
      editor.off("update", updateFromSelection);
    };
  }, [editor]);

  return(
      <TooltipProvider>
        <div className="flex items-center gap-x-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={decrement} className={cn("h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden")}>
                <MinusIcon className="h-4 w-4 shrink-0 text-muted-foreground"/>
              </button>
              </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-input border-secondary-background">Decrease font size</TooltipContent>
          </Tooltip>
          <Tooltip>
          <TooltipTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="h-7 w-10 shrink-0 text-center rounded-sm bg-input px-1.5 border border-muted-foreground/20 text-sm text-muted-foreground focus:border-primary/50 focus:outline-none"
                    />
                  ) : (
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setIsDropdownOpen(true);
                      }}
                      className="h-7 w-10 shrink-0 flex items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 border border-muted-foreground/20 cursor-text"
                    >
                      <span className="text-muted-foreground text-sm">{fontSize}</span>
                    </button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start"
                  className="p-1 min-w-0 bg-input border-secondary-background rounded-md"
                  onInteractOutside={(e) => {
                    const target = e.target as Element;
                    if (target instanceof Element && target.closest('input')) {
                      e.preventDefault();
                    }
                  }}
                >
                  {defaultFontSizes.map((size) => (
                    <DropdownMenuItem
                      key={size}
                      className={cn(
                        "rounded-sm p-2 text-sm hover:bg-secondary-background/50 justify-center max-w-10",
                        editor?.getAttributes("textStyle")?.fontSize === size && "bg-secondary-background"
                      )}
                      onSelect={() => updateFontSize(size.toString())}
                    >
                      <span>{size}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu> */}
              {isEditing ? (
                <input 
                  type="text"
                  value={inputValue ? inputValue : ""}
                  onChange={handleInputChange} 
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  className="h-7 w-10 shrink-0 flex text-center justify-center rounded-sm bg-input px-1.5 overflow-hidden border border-muted-foreground/20 text-sm text-muted-foreground focus:border-primary/50 focus:outline-none"
                />
              ) : (
                <button 
                  onClick={() => {
                    setIsEditing(true)
                    setFontSize(fontSize)
                  }} 
                  className="h-7 w-10 shrink-0 flex items-center text-sm text-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden border border-muted-foreground/20 cursor-text"
                >
                  <span className="text-muted-foreground">{fontSize ? fontSize : ""}</span>
                </button>
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-input border-secondary-background">
              Font size
            </TooltipContent>
          </Tooltip>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-input border-secondary-background">Font size</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={increment} className={cn("h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden")}>
              <PlusIcon className="h-4 w-4 shrink-0 text-muted-foreground"/>
            </button>
          </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Increase font size</TooltipContent>
        </Tooltip>
        </div>
    </TooltipProvider> 
  )
}

export function LineHeightButton(){
  const { editor } = useTextEditorStore()

  const lineHeights = [
    { label: "Default", value: "normal" },
    { label: "Single", value: "1" },
    { label: "1.15", value: "1.15" },
    { label: "1.5", value: "1.5" },
    { label: "Double", value: "2" },
  ]
  return(
    <DropdownMenu>
    <TooltipProvider>
      <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <ListCollapseIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Line height</TooltipContent>
      </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-1 bg-input border-secondary-background rounded-md flex flex-col">
        {lineHeights.map(({ label, value }) => (
          <button
          key={value}
          className={cn("flex items-center rounded-sm p-2 hover:bg-secondary-background/50",
            editor?.isActive({ lineHeight: value }) && "bg-secondary-background"  
          )}
          onClick={() => editor?.chain().focus().setLineHeight(value).run()}
          >
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MergeFilesButton(){
  const { editor } = useTextEditorStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({
    far: false,
    dfars: false,
    itar: false,
    cam: false,
  });

  const handleCheckboxChange = (option: keyof typeof selectedOptions) => {
    setSelectedOptions(prev => ({
      ...prev,
      ["none"]: false,    
      [option]: !prev[option]
    }));
  };

  const processFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      console.log("converted:", result.value);
      if(editor) editor.commands.insertContent(result.value);
    } catch (error) {
      console.error("Error converting document:", error);
    }
  }

  const handleClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  }, [editor]);

  const handleDrop = useCallback((files: File | File[]) => {
    const file = Array.isArray(files) ? files[0] : files
    console.log("Dropped files:", files);
    if (file) {
      console.log("Dropped file:", file);
      processFile(file);
    }
  }, [editor]);

  return(
    <div>
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogTrigger asChild>
      <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
        <FilePlus2Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </DialogTrigger>
    <DialogContent> 
      <DialogHeader>
        <DialogTitle>Drag and drop files here</DialogTitle>
      </DialogHeader>
      <div 
      onClick={() => document.getElementById("file-upload")?.click()}
      className="w-full h-100">
      <FileDropZone 
      className="relative" 
      onDrop={handleDrop} 
      keepOpen
      acceptedTypes={[
        'pdf', 
        'doc', 
        'docx',
      ]}/>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex flex-end gap-2">
            <Settings2 className="h-4 w-4"/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-55" align="start">
          <DropdownMenuItem 
            
            className="flex items-center gap-2 focus:bg-transparent cursor-default"
            onSelect={(e: any) => e.preventDefault()}
          >
            <Checkbox
              id="far"
              checked={selectedOptions.far}
              onCheckedChange={() => handleCheckboxChange('far')}
              className="border-gray-300"
            />
            <label htmlFor="far" className="text-sm font-medium cursor-pointer flex flex-1 gap-1 items-center">
              <PiShieldCheckBold className="h-3 w-3"/> Federal Acquisition Regulation (FAR)
            </label>
          </DropdownMenuItem>

          <DropdownMenuItem 
            className="flex items-center gap-2 focus:bg-transparent cursor-default"
            onSelect={(e:  any) => e.preventDefault()}
          >
            <Checkbox
              id="dfars"
              checked={selectedOptions.dfars}
              onCheckedChange={() => handleCheckboxChange('dfars')}
              className="border-gray-300"
            />
            <label htmlFor="dfars" className="text-sm font-medium cursor-pointer flex flex-1 gap-1 items-center">
              <TbTank className="h-3 w-3"/> Defense Federal Acquisition Regulation (DFARS)
            </label>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            className="flex items-center gap-2 focus:bg-transparent cursor-default"
            onSelect={(e: any) => e.preventDefault()}
          >
            <Checkbox
              id="itar"
              checked={selectedOptions.itar}
              onCheckedChange={() => handleCheckboxChange('itar')}
              className="border-gray-300"
            />
            <label htmlFor="itar" className="text-sm font-medium cursor-pointer flex flex-1 gap-1 items-center">
              <PiAirplaneTakeoffBold className="h-3 w-3"/> International Traffic in Arms Regulations (ITAR)
            </label>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            className="flex items-center gap-2 focus:bg-transparent cursor-default"
            onSelect={(e: any) => e.preventDefault()}
          >
            <Checkbox
              id="cam"
              checked={selectedOptions.cam}
              onCheckedChange={() => handleCheckboxChange('cam')}
              className="border-gray-300"
            />
            <label htmlFor="cam" className="text-sm font-medium cursor-pointer flex flex-1 gap-1 items-center">
              <TbListSearch className="h-3 w-3"/> Contract Audit Manual (CAM)
            </label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </DialogContent>
    </Dialog>
    <input
      type="file"
      accept=".pdf,.doc,.docx"
      onChange={handleClick}
      className="hidden"
      id="file-upload"
    />
    </div>
)}