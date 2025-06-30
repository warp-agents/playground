"use client"

import React, { useState, useCallback, useMemo, useRef, useEffect, createContext, Dispatch, SetStateAction } from 'react';
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
  CloudUploadIcon,
  Undo2Icon,
  Redo2Icon,
  Clipboard,
  PrinterIcon,
  ChevronDown,
  SpellCheckIcon,
  PaintBucketIcon,
  PaintRollerIcon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  RemoveFormattingIcon,
  ArrowUpToLineIcon,
  ArrowDownToLineIcon,
  FoldVerticalIcon,
  PaintbrushVerticalIcon,
  DollarSignIcon,
  PercentIcon,
  FilterIcon,
  SquareFunctionIcon,
  ChartPieIcon,
  EraserIcon,
  FeatherIcon,
  HighlighterIcon,
  TextCursorIcon,
  TextCursorInputIcon,
  TableColumnsSplit,
  TableRowsSplit,
  ImageIcon,
  LinkIcon,
  Link2Icon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  Grid2x2Icon,
  TextIcon,
  ListIcon,
  ListOrderedIcon,
  FilePlus2Icon,
  SparklesIcon,
  MinusIcon,
  PlusIcon,
  PaintbrushIcon,
  ALargeSmallIcon,
  ListCollapseIcon,
  Scissors,
  CopyIcon,
  MoveIcon,
  Trash2Icon,
  SquareIcon,
  Rows3Icon,
  Columns3Icon,
  SheetIcon,
  FunctionSquareIcon,
  BookmarkCheckIcon,
  CalculatorIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BsCloudCheck } from "react-icons/bs";
import { BiCaretDown } from "react-icons/bi";
import { TbDropletOff } from "react-icons/tb";
import { AiOutlineFunction } from "react-icons/ai";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Separator } from "@radix-ui/react-separator";
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
import { GPTTextareaForm } from "./gpt-textarea-form"
import { type ColorResult, CirclePicker } from 'react-color';
import Cells, { 
  CellBase, 
  Matrix, 
  CellComponentProps, 
  ColumnIndicatorProps, 
  RowIndicatorProps, 
  Selection, 
  RangeSelection, 
  EntireWorksheetSelection, 
  EntireColumnsSelection, 
  EntireRowsSelection, 
  EmptySelection, 
  Dimensions, 
  PointRange, 
} from 'react-spreadsheet';
import * as XLSX from 'xlsx';
import { Parser } from 'hot-formula-parser';
import { useGlobalContext } from '@/contexts/GlobalContext'
import * as Point from "@/lib/point";
import { cn } from '@/lib/utils';

export const CustomCell: React.FC<CellComponentProps> = ({
  row,
  column,
  DataViewer,
  selected,
  active,
  dragging,
  mode,
  data,
  evaluatedData,
  select,
  activate,
  setCellDimensions,
  setCellData,
}): React.ReactElement => {
  const customDataViewerRef = React.useRef<any>(null);
  const rootRef = React.useRef<HTMLTableCellElement | null>(null);
  
  const point = React.useMemo(
    (): Point.Point => ({
      row,
      column,
    }),
    [row, column]
  );

  const numericValue = React.useMemo(() => {
    if (evaluatedData?.value !== null && evaluatedData?.value !== undefined) {
      const evalValue = evaluatedData.value;
      if (typeof evalValue === 'number') return evalValue;
      if (typeof evalValue === 'string') {
        return Number(evalValue.replace(/[^0-9.-]+/g, ""));
      }
    }

    if (typeof data?.value === 'string') {
      if(!isNaN(Number(data.value.replace(/[^0-9.-]+/g, "")))){
        return Number(data.value.replace(/[^0-9.-]+/g, ""));
      }
    }
    
    return NaN;
  }, [data?.value, evaluatedData?.value]);

  const isAboveSatThresholdCell = React.useMemo(() => {
    return !isNaN(numericValue) && numericValue >= 250000;
  }, [numericValue]);

  const getOffsetRect = React.useCallback((element: HTMLElement): Dimensions => {
    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
      left: element.offsetLeft,
      top: element.offsetTop,
    };
  }, []);

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (mode === "view") {
        setCellDimensions(point, getOffsetRect(event.currentTarget));

        if (event.shiftKey) {
          select(point);
        } else {
          activate(point);
        }
      }
    },
    [mode, setCellDimensions, point, select, activate, getOffsetRect]
  );

  const handleMouseOver = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (dragging) {
        setCellDimensions(point, getOffsetRect(event.currentTarget));
        select(point);
      }
    },
    [setCellDimensions, select, dragging, point, getOffsetRect]
  );

  useEffect(() => {
    if (data && data.DataViewer) {
      customDataViewerRef.current = data.DataViewer;
    } else {
      customDataViewerRef.current = null;
    }
  }, [data]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    
    if (selected) {
      setCellDimensions(point, getOffsetRect(root));
    }
    
    if (active && mode === "view") {
      root.focus();
    }
  }, [setCellDimensions, selected, active, mode, point, getOffsetRect]);

  const CellDataViewer = customDataViewerRef.current || DataViewer;

  const cellClassName = React.useMemo(() => {
    const classNames = ["Spreadsheet__cell"];
    
    if (data?.className) classNames.push(data.className);
    if (data?.readOnly) classNames.push("Spreadsheet__cell--readonly");
    if (isAboveSatThresholdCell) classNames.push("Spreadsheet__cell--error");
    
    return classNames.join(" ");
  }, [data?.className, data?.readOnly, isAboveSatThresholdCell]);

  return (
    <td
      ref={rootRef}
      className={cellClassName}
      onMouseOver={handleMouseOver}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      <CellDataViewer
        row={row}
        column={column}
        cell={data}
        evaluatedCell={evaluatedData}
        setCellData={setCellData}
      />
    </td>
  );
};

type CellType = {
  value: string | number | null;
  formula?: string | null;
};

export default function Spreadsheet() {
  const [mounted, setMounted] = useState(false);
  const [fileName, setFileName] = useState("Untitled Document")
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCell, setSelectedCell] = useState<string | null>("A1");
  const [selectedCellValue, setSelectedCellValue] = useState(selectedCell);
  const [formulaValue, setFormulaValue] = useState("=SUM(A1,A1)");
  const [spreadsheetData, setSpreadsheetData] = useState<CellType[][]>(Array.from({ length: 50 }, () =>
    Array.from({ length: 26 }, () => ({ value: "", formula: "" }))
  ));
  const [highlightedCells, setHighlightedCells] = useState<CellType[][] | CellType[]>([]);
  const [highlightedCellsType, setHighlightedCellsType] = useState<'single' | 'multi' | 'entire' | 'column' | 'row' | null>(null)
  const [floatingRectDimensions, setFloatingRectDimensions] = useState<{
    left: number;
    top: number;
    width: number;    
    height: number;
  } | null>(null);
  const [width, setWidth] = useState(0);
  const [rowLength, setRowLength] = useState(50);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [selectedCells, setSelectedCells] = useState<Selection | undefined>(undefined);
  const [showPopover, setShowPopover] = useState(false);
  const [showFloatingRect, setShowFloatingRect] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const columnHeaders = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  }

  const handleInputBlur = () => {
    setIsEditing(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateWidth);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        spreadsheetRef.current && 
        !spreadsheetRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false)
        setShowFloatingRect(false)
      }else if(
        popoverRef.current && 
        popoverRef.current.contains(event.target as Node)
      ){
        setShowFloatingRect(true)
      }else{
        setShowFloatingRect(false)
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  const handlePopoverPosition = (startRow: number, startCol: number) => {
    const parentContainer = document.querySelector('.spreadsheet-container');
    if (!parentContainer) return;

    const topLeftCell = document.querySelector(
      `tr[row="${startRow}"] td:nth-of-type(${startCol + 1})`
    );

    if (topLeftCell && parentContainer) {
      const cellRect = topLeftCell.getBoundingClientRect();
      const parentRect = parentContainer.getBoundingClientRect();

      const left = cellRect.right - parentRect.left + 10;
      const top = cellRect.top - parentRect.top;

      setPopoverPosition({ left, top });
      setShowPopover(true);
    }
  }

  const handleFloatingRect = (selection: Selection) => {
    if (!selection || selection instanceof EmptySelection) return;
    
    const parentContainer = document.querySelector('.spreadsheet-container');
    if (!parentContainer) return;
  
    if (selection instanceof RangeSelection) {
      const startRow = selection.range.start.row;
      const startCol = selection.range.start.column;
      const endRow = selection.range.end.row;
      const endCol = selection.range.end.column;
      
      const startCell = document.querySelector(
        `tr[row="${startRow}"] td:nth-of-type(${startCol + 1})`
      );
      
      const endCell = document.querySelector(
        `tr[row="${endRow}"] td:nth-of-type(${endCol + 1})`
      );
      
      if (startCell && endCell && parentContainer) {
        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();
        const parentRect = parentContainer.getBoundingClientRect();
        
        const left = startRect.left - parentRect.left;
        const top = startRect.top - parentRect.top;
        const width = endRect.right - startRect.left;
        const height = endRect.bottom - startRect.top;
        
        return { left, top, width, height };
      }
    } else if (selection instanceof EntireWorksheetSelection) {
      const allCells = parentContainer.querySelectorAll('td');
      if (allCells.length > 0) {
        const firstCell = allCells[0].getBoundingClientRect();
        const lastCell = allCells[allCells.length - 1].getBoundingClientRect();
        const parentRect = parentContainer.getBoundingClientRect();
        
        const left = firstCell.left - parentRect.left;
        const top = firstCell.top - parentRect.top;
        const width = lastCell.right - firstCell.left;
        const height = lastCell.bottom - firstCell.top;
        
        return { left, top, width, height };
      }
    } else if (selection instanceof EntireColumnsSelection) {
      const startCol = selection.end;
      const rowCount = spreadsheetData.length;
      
      const firstRowCell = document.querySelector(
        `tr[row="0"] td:nth-of-type(${startCol + 1})`
      );
      const lastRowCell = document.querySelector(
        `tr[row="${rowCount - 1}"] td:nth-of-type(${startCol + 1})`
      );
      
      if (firstRowCell && lastRowCell && parentContainer) {
        const firstRect = firstRowCell.getBoundingClientRect();
        const lastRect = lastRowCell.getBoundingClientRect();
        const parentRect = parentContainer.getBoundingClientRect();
        
        const left = firstRect.left - parentRect.left;
        const top = firstRect.top - parentRect.top;
        const width = firstRect.width;
        const height = lastRect.bottom - firstRect.top;
        
        return { left, top, width, height };
      }
    } else if (selection instanceof EntireRowsSelection) {
      const startRow = selection.start;
      const firstRow = document.querySelector(`tr[row="${startRow}"]`);
      
      if (firstRow && parentContainer) {
        const cells = firstRow.querySelectorAll('td');
        const firstCell = cells[0];
        const lastCell = cells[cells.length - 1];
        
        if (firstCell && lastCell) {
          const firstRect = firstCell.getBoundingClientRect();
          const lastRect = lastCell.getBoundingClientRect();
          const parentRect = parentContainer.getBoundingClientRect();
          
          const left = firstRect.left - parentRect.left;
          const top = firstRect.top - parentRect.top;
          const width = lastRect.right - firstRect.left;
          const height = firstRect.height;
          
          return { left, top, width, height };
        }
      }
    }
    return null;
  };

  useEffect(() => {
    console.log(highlightedCellsType, highlightedCells)
  }, [highlightedCells])

  const handleSelection = (selection: Selection) => {
    if (selection instanceof EmptySelection) {
      setHighlightedCellsType(null)
      return
    }
    setSelectedCells(selection)
    const dimensions = handleFloatingRect(selection)
    if (dimensions) setFloatingRectDimensions(dimensions)
    if (selection instanceof RangeSelection) {
      const startRow = selection.range.start.row;
      const startCol = selection.range.start.column;
      const endRow = selection.range.end.row;
      const endCol = selection.range.end.column;
      handlePopoverPosition(startRow, startCol)

      const newArr = []
      for(let i = 0; i < spreadsheetData.length; i++){
        if(i >= startRow && i <= endRow){
          const row = spreadsheetData[i];
          const subArr = []
          for(let j = 0; j < row.length; j++){
            if(j >= startCol && j <= endCol){
              subArr.push(row[j])
            }
          }
          newArr.push(subArr)
        }
      }
      setHighlightedCells(newArr)
      if(newArr.length > 1){
        setHighlightedCellsType('multi')
        return
      }
      setHighlightedCellsType('single')
    } else if (selection instanceof EntireWorksheetSelection) {
      handlePopoverPosition(0, 0)

      setHighlightedCells(spreadsheetData)
      setHighlightedCellsType('entire')
    } else if (selection instanceof EntireColumnsSelection) {
      const startCol = selection.end;
      handlePopoverPosition(0, startCol)

      const newArr = []
      for(let i = 0; i < spreadsheetData.length; i++){
        const row = spreadsheetData[i];
        const cell = row[startCol];
        newArr.push([cell])
      }

      setHighlightedCells(newArr)
      setHighlightedCellsType('column')
    } else if (selection instanceof EntireRowsSelection) {
      const startRow = selection.start;
      handlePopoverPosition(startRow, 0)

      const newArr = spreadsheetData[startRow]
      setHighlightedCells(newArr)
      setHighlightedCellsType('row')
    }
  };

  const evaluateFormula = (formula: string, workbook: XLSX.WorkBook): string | number => {
    // add parser
    return formula;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const ROWS = spreadsheetData.length;
    const COLS = spreadsheetData[0].length;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellFormula: true, cellStyles: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1:Z50');

      const newData: CellType[][] = Array(ROWS).fill(null).map(() =>
        Array(COLS).fill(null).map(() => ({ value: null }))
      );

      for (let R = 0; R <= Math.min(range.e.r, ROWS - 1); ++R) {
        for (let C = 0; C <= Math.min(range.e.c, COLS - 1); ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = firstSheet[cellRef];

          if (cell) {
            if (cell.f) {
              const formulaValue = evaluateFormula(`=${cell.f}`, workbook);
              newData[R][C] = {
                value: formulaValue,
                formula: `=${cell.f}`
              };
            } else {
              newData[R][C] = {
                value: cell.v ?? null
              };
            }
          }
        }
      }
      setSpreadsheetData(newData);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleChange = (newData: Matrix<any>) => {
    setSpreadsheetData(newData);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden bg-secondary-background flex flex-col">
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
      <Toolbar onFileUpload={() => (document.getElementById("file-upload") as HTMLInputElement).click()} />
    </header>
    <div className='w-full h-10 flex items-center p-2 space-x-2'>
      <div className='flex shrink-0 items-center rounded-sm overflow-hidden hover:bg-sidebar/50'>
        {isEditing ? (
          <input 
            type="text"
            value={selectedCellValue ? selectedCellValue : ""}
            onChange={handleInputChange} 
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="h-7 w-20 shrink-0 flex items-center bg-input px-1.5 pl-2 overflow-hidden text-sm text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        ) : (
          <button 
            onClick={() => {
              setIsEditing(true)
              setSelectedCell(selectedCell)
            }} 
            className="h-7 w-20 shrink-0 flex text-sm items-center hover:bg-secondary-background/50 px-1.5 pl-2 overflow-hiddens cursor-text"
          >
            <span className="text-muted-foreground">{selectedCell ? selectedCell : ""}</span>
          </button>
        )}
        <div className="flex items-center justify-center p-1">
          <BiCaretDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </div>
      </div>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      <div className='h-full w-full flex items-center gap-1'>
        <AiOutlineFunction className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input 
          type="text"
          value={formulaValue ? formulaValue : ""}
          onChange={handleInputChange} 
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="h-7 w-full flex items-center bg-secondary-background px-1.5 pl-2 overflow-hidden text-sm text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
      </div>
    </div>
    <div className="w-full bg-secondary-background overflow-auto print-block print:p-0 print:bg-white print:overflow-visible">
      <div ref={spreadsheetRef} className="relative w-full print:py-0 print:w-full print:min-w-0 print:h-full print:text-black">
        <Cells
          className='spreadsheet-container'
          data={spreadsheetData}
          onChange={handleChange}
          columnLabels={columnHeaders}
          rowLabels={Array.from({ length: rowLength }, (_, i) => (i + 1).toString())}
          selected={(selectedCells as Selection)}
          onSelect={handleSelection}
          Cell={CustomCell}
        />
        <style jsx global>{`
          .spreadsheet-container {
            display: flex;
            height: 100%;
            width: ${width}px;
          }
          .Spreadsheet__cell {
            border: 1px solid hsl(var(--border));
            background: hsl(var(--input));
            color: white;
          }
          .Spreadsheet__active-cell {
            position: absolute;
            border: 2px solid #3b82f6 !important;
            color: white;
          }
          .Spreadsheet__active-cell--edit {
            background: hsl(var(--input));
            box-shadow: 0 2px 5px rgb(0 0 0 / 40%);
            color: white;
          }
          .Spreadsheet__cell--error {
            background: rgba(246, 59, 130, 0.4);
            color: black;
          }
          .Spreadsheet__header {
            background: hsl(var(--secondary-background));
            color: hsla(var(--primary), 0.95));
            font-weight: bold;
            border: 1px solid hsl(var(--border));
          } 
        `}</style>
        {showPopover &&
          <div
          id={"spreadsheet-popover"}
          ref={popoverRef}
          className={
            cn("absolute w-[300px] h-fit z-10 print:hidden rounded-xl overflow-hidden",
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
        {showFloatingRect && floatingRectDimensions && 
        <div 
          className="absolute pointer-events-none box-border border-2 border-solid"
          style={{
            left: `${floatingRectDimensions.left}px`,
            top: `${floatingRectDimensions.top}px`,
            width: `${floatingRectDimensions.width}px`, 
            height: `${floatingRectDimensions.height}px`,
            background: 'rgb(160 195 255 / 20%)',
            border: '2px #4285f4 solid',
          }}
        />}
      </div>
    </div>
    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={handleFileUpload}
      className="hidden"
      id="file-upload"
    />
    </div>
  );
};

export function MenuBar({ fileName, onChange }: { fileName: string, onChange?: () => void }) {
  const [clipboardText, setClipboardText] = useState<string | null>(null);

  function isTextSelected() {
    // const { state } = editor;
    // const { from, to } = state.selection;
    // const selectedText = state.doc.textBetween(from, to, " ");
    // return selectedText.trim().length > 0;
  }

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
          <MenubarItem>
              <FileCode className="h-4 w-4 mr-2"/>
              CSV {"(.csv)"}
            </MenubarItem>
            <MenubarItem>
              <FileText className="h-4 w-4 mr-2"/>
              Excel Document {"(.xlsx)"}
            </MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator/>
        <MenubarItem>
          <CloudUploadIcon className="h-4 w-4 mr-2"/>
          Import
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarSub>
          <MenubarSubTrigger>
            <BookmarkCheckIcon className="h-4 w-4 mr-2"/>
            Add to
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
          <MenubarItem>
              <FileText className="h-4 w-4 mr-2"/>
              Document
            </MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
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
        <MenubarItem>
          <Undo2Icon className="h-4 w-4 mr-2"/>
          Undo <MenubarShortcut>⌘Z</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          <Redo2Icon className="h-4 w-4 mr-2"/>
          Redo <MenubarShortcut>⌘Y</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarItem> 
          <Scissors className="h-4 w-4 mr-2"/>
          Cut <MenubarShortcut>⌘X</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          <CopyIcon className="h-4 w-4 mr-2"/>
          Copy<MenubarShortcut>⌘C</MenubarShortcut>
        </MenubarItem>
        <MenubarItem disabled={!clipboardText}>
          <Clipboard className="h-4 w-4 mr-2"/>
          Paste <MenubarShortcut>⌘V</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarItem>
          <MoveIcon className="h-4 w-4 mr-2"/>
          Move
        </MenubarItem>
        <MenubarItem>
          <Trash2Icon className="h-4 w-4 mr-2"/>
          Delete
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
        <MenubarSub>
          <MenubarSubTrigger>
            <SquareIcon className="h-4 w-4 mr-2"/>
            Cell
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSub>
          <MenubarSubTrigger>
            <Rows3Icon className="h-4 w-4 mr-2"/>
            Rows
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSub>
          <MenubarSubTrigger>
            <Columns3Icon className="h-4 w-4 mr-2"/>
            Columns
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSub>
          <MenubarSubTrigger>
            <SheetIcon className="h-4 w-4 mr-2"/>
            Table
          </MenubarSubTrigger>
          <MenubarSubContent className="bg-secondary-background">
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator/>
        <MenubarItem>
          <ChartPieIcon className="h-4 w-4 mr-2"/>
          Chart
        </MenubarItem>
        <MenubarSeparator/>
        <MenubarItem>
          <FunctionSquareIcon className="h-4 w-4 mr-2"/>
          Functions
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
            <MenubarItem>
              <BoldIcon className="h-4 w-4 mr-2"/>
              Bold <MenubarShortcut>⌘B</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <ItalicIcon className="h-4 w-4 mr-2"/>
              Italic <MenubarShortcut>⌘I</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <UnderlineIcon className="h-4 w-4 mr-2"/>
              Underline <MenubarShortcut>⌘U</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <StrikethroughIcon className="h-4 w-4 mr-2"/>
              <span>Strikethrough&nbsp;&nbsp;</span> <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator/>
        <MenubarItem>
          <PaintbrushVerticalIcon className="h-4 w-4 mr-2"/>
          <span>Conditional Formatting&nbsp;&nbsp;</span>
        </MenubarItem>
        <MenubarItem>
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

export function Toolbar({ onFileUpload }: { onFileUpload: () => void }) {

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
      onClick: () => {},
    },
    {
      label: "Redo",
      icon: Redo2Icon,
      onClick: () => {},
    },
    {
      label: "Print",
      icon: PrinterIcon,
      onClick: () => window.print(),
    },
    {
      label: "Paint format",
      icon: PaintRollerIcon,
      onClick: () => {},
    },
    {
      label: "Spell check",
      icon: SpellCheckIcon,
      onClick: () => {},
    },
    {
      label: "Remove formatting",
      icon: RemoveFormattingIcon,
      onClick: () => {},
    }
  ],
  [
    {
      label: "Format as currency",
      icon: DollarSignIcon,
      onClick: () => {},
    },
    {
      label: "Format as percentage",
      icon: PercentIcon,
      onClick: () => {},
    }
  ],
  [
    {
      label: "Bold",
      icon: BoldIcon,
      isActive: false,
      onClick: () => {},
    },
    {
      label: "Italic",
      icon: ItalicIcon,
      isActive: false,
      onClick: () => {},
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      isActive: false,
      onClick: () => {},
    },
    {
      label: "Strikethrough",
      icon: StrikethroughIcon,
      isActive: false,
      onClick: () => {},
    }
  ],
  [
    {
      label: "Borders",
      icon: Grid2x2Icon,
      onClick: () => {},
    },
  ],
  [
    {
      label: "Insert chart",
      icon: ChartPieIcon,
      onClick: () => {},
    },
    {
      label: "Functions",
      icon: SquareFunctionIcon,
      onClick: () => {},
    },
    // {
    //   label: "Conditional formatting",
    //   icon: PaintbrushVerticalIcon,
    //   onClick: () => {},
    // }
  ],
  [
    { 
    label: "Upload",
    icon: CloudUploadIcon,
    onClick: onFileUpload,
    },
    { 
      label: "Download",
      icon: Download,
      onClick: () => {},
    },
  ],
]

  return (
    <div className="bg-input px-2.5 py-0.5 rounded-[24px] min-h-[40px] w-full flex items-center gap-x-0.5 overflow-x-auto">
      {sections[0].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      {sections[1].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <FormatsButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      <FontFamilyButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      <FontSizeButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      {sections[2].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <TextColorButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      <FillColorButton/>
      {sections[3].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/40" />
      <HorizontalAlignButton/>
      <VerticalAlignButton/>
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      {sections[4].map((tool) => (
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
      <Separator orientation="vertical" className="h-6 w-[0.5px] m-[1.5px] bg-muted-foreground/50 flex shrink-0" />
      {/* <UploadButton onFileChange={onFileUpload}/> */}
      {sections[sections.length - 1].map((tool) => ( 
        <ToolbarButton key={tool.label} {...tool}
        />
      ))}
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
  // const { editor } = useTextEditorStore()

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
            {/* {editor?.getAttributes("textStyle")?.fontFamily || "Arial"} */}
            Arial
          </span>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-input">
        {fonts.map(({ label, value }) => (
          <button
          key={value}
          className={cn("flex items-center rounded-sm gap-x-2 px-2 py-1 hover:bg-secondary-background/50",
            true && "bg-secondary-background"
          )}
          style={{ fontFamily: value }}
          // onClick={() => editor?.chain().focus().setFontFamily(value).run()}
          >
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu> 
  )
}

export function FormatsButton(){
  // const { editor } = useTextEditorStore()

  const formats = [
    { label: "Accounting", value: "$(1,000.15)" },
    { label: "Financial", value: "(1,000.15)" },
    { label: "Currency", value: "$1,000.00" },
    { label: "Rounded", value: "$1,000" },
  ];
  
  return(
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <CalculatorIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-input border-secondary-background">More formats</TooltipContent>
        </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-input">
        {formats.map(({ label, value }) => (
          <button
          key={value}
          className={cn("flex items-center justify-between rounded-sm gap-x-2 px-2 py-1 hover:bg-secondary-background/50",
            false && "bg-secondary-background"
          )}
          // onClick={() => editor?.chain().focus().setFontFamily(value).run()}
          >
            <span className="text-sm">{label}{"\u00A0\u00A0"}</span>
            <span className="text-sm text-muted-foreground">{value}</span>
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
  // const { editor } = useTextEditorStore()

  const value = "#FFFFFF"

  const onChange = (color: ColorResult) => {
    // editor?.chain().focus().setColor(color.hex).run()
  }

  return(
    <DropdownMenu>
    <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <span className="text-xs text-muted-foreground">A</span>
                <div className="h-0.5 w-full mt-.5" style={{ backgroundColor: "white" }}></div>
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

export function FillColorButton(){
  // const { editor } = useTextEditorStore()

  const value = "#FFFFFF"

  const onChange = (color: ColorResult) => {
    // editor?.chain().focus().setHighlight({ color: color.hex }).run()
    return
  }

  const undoFill = () => {
    // editor?.chain().focus().unsetFill().run()
  }

  return(
    <DropdownMenu>
    <TooltipProvider>
      <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <span className="text-xs text-muted-foreground"><PaintBucketIcon className="h-3 w-3 shrink-0 text-muted-foreground mb-[4px]" /></span>
                <div className="h-0.5 w-full mt-.5" style={{ backgroundColor: "black" }}></div>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Fill color</TooltipContent>
      </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-2.5 bg-input border-secondary-background rounded-md flex flex-col gap-2">
        <button onClick={undoFill} className="w-full flex items-center rounded-sm bg-secondary-background/50 hover:text-sidebar px-1.5 py-1 gap-1"><TbDropletOff className="w-4 h-4"/>None</button>
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

export function HorizontalAlignButton(){
  // const { editor } = useTextEditorStore()

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
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Verical Align</TooltipContent>
      </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-2 bg-input border-secondary-background rounded-md flex">
        {alignments.map(({ label, value, icon: Icon }) => (
          <button
          key={value}
          className={cn("flex items-center rounded-sm p-2 hover:bg-secondary-background/50",
            "bg-secondary-background"  
          )}
          // onClick={() => editor?.chain().focus().setTextAlign(value).run()}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function VerticalAlignButton(){
  // const { editor } = useTextEditorStore()

  const alignments = [
    { label: "Align Top", value: "top", icon: ArrowUpToLineIcon },
    { label: "Align Center", value: "center", icon: FoldVerticalIcon },
    { label: "Align Bottom", value: "bottom", icon: ArrowDownToLineIcon },
  ]

  return(
    <DropdownMenu>
    <TooltipProvider>
      <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={cn("h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-secondary-background/50 px-1.5 overflow-hidden ")}>
                <ArrowDownToLineIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-input border-secondary-background">Horizontal Align</TooltipContent>
      </Tooltip>
      </TooltipProvider> 
      <DropdownMenuContent className="p-2 min-w-fit bg-input border-secondary-background rounded-md flex">
        {alignments.map(({ label, value, icon: Icon }) => (
          <button
          key={value}
          className={cn("flex items-center rounded-sm p-2 hover:bg-secondary-background/50",
            true && "bg-secondary-background"  
          )}
          // onClick={() => editor?.chain().focus().setTextAlign(value).run()}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function FontSizeButton(){

  // const currentFontSize = editor?.getAttributes("textStyle")?.fontSize 
  //   ? editor?.getAttributes("textStyle")?.fontSize.replace("px", "")
  //   : "16"
  
  const [fontSize, setFontSize] = useState(16)
  const [inputValue, setInputValue] = useState(fontSize)
  const [isEditing, setIsEditing] = useState(false)

  // const updateFontSize = (newSize: string) => {
  //   const size = parseInt(newSize)

  //   if(!isNaN(size) && size > 0) {
  //     editor?.chain().focus().setFontSize(`${newSize}px`).run()
  //     setFontSize(newSize)
  //     setInputValue(newSize)
  //     setIsEditing(false)
  //   }
  // }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // setInputValue(event.target.value as string)
  }

  const handleInputBlur = () => {
    // updateFontSize(inputValue)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // if (event.key === "Enter") {
    //   event.preventDefault()
    //   updateFontSize(inputValue)
    //   editor?.commands.focus()
    // }
  }

  const increment = () => {
    // const newSize = parseInt(fontSize) + 1
    // updateFontSize(newSize.toString())
  }

  const decrement = () => {
    // const newSize = parseInt(fontSize) - 1
    // if(newSize < 0) return
    // updateFontSize(newSize.toString())
  }

  const defaultFontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96]

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