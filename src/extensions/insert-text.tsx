"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AutoTextSize } from 'auto-text-size';
import { Plugin } from 'prosemirror-state';

const BORDER_COLOR = "#4299e1";

const InsertTextComponent = ({
  node,
  updateAttributes,
  editor,
  getPos,
  selected,
}: {
  node: any;
  updateAttributes: (attrs: any) => void;
  editor: any;
  getPos: () => number;
  selected: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: node.attrs.x || 0, y: node.attrs.y || 0 });
  const [width, setWidth] = useState(node.attrs.width || 100);
  const [minFontSizePx, setMinFontSizePx] = useState('16');
  const [maxFontSizePx, setMaxFontSizePx] = useState('28');
  const [fontSizePrecisionPx, setFontSizePrecisionPx] = useState('0.1');
  const parsedMinFontSizePx = parseFloat(minFontSizePx);
  const parsedMaxFontSizePx = parseFloat(maxFontSizePx);
  const parsedFontSizePrecisionPx = parseFloat(fontSizePrecisionPx);

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    updateAttributes({
      ...position,
      width,
      height: "auto",
    });
  }, [position, width, updateAttributes]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    const pageContainer = containerRef.current?.closest(".page");
    if (!pageContainer) return;

    const pageRect = pageContainer.getBoundingClientRect();
    const cursorX = e.clientX - pageRect.left;
    const cursorY = e.clientY - pageRect.top;

    offsetRef.current = {
      x: cursorX - position.x,
      y: cursorY - position.y,
    };

    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="; // 1x1 transparent GIF
    e.dataTransfer.setDragImage(img, 0, 0);

    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    if (!e.clientX || !e.clientY) return;

    const pageContainer = containerRef.current?.closest(".page");
    if (!pageContainer) return;

    const pageRect = pageContainer.getBoundingClientRect();
    const cursorX = e.clientX - pageRect.left;
    const cursorY = e.clientY - pageRect.top;

    const newX = cursorX - offsetRef.current.x;
    const newY = cursorY - offsetRef.current.y;

    const maxX = (pageRect.width - (96 * 2)) - (textRef.current?.offsetWidth || 0);
    const maxY = (pageRect.height - (96 * 2)) - (textRef.current?.offsetHeight || 0);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleAutoTextSizeDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const direction = (e.target as HTMLElement).dataset.direction;
    if (!direction || !containerRef.current) return;

    const startX = e.clientX;
    const startWidth = containerRef.current.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth + deltaX;

      const editor = containerRef.current?.closest('.ProseMirror');
      if (editor) {
        const editorRect = editor.getBoundingClientRect();
        newWidth = Math.min(newWidth, editorRect.width - position.x);
      }

      newWidth = Math.max(50, newWidth);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if(textRef.current?.offsetWidth){
        setWidth(textRef.current.offsetWidth - 2);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [position.x]);

  const dragCornerButton = (direction: string) => (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      data-direction={direction}
      className="print:hidden"
      style={{
        position: 'absolute',
        height: '10px',
        width: '10px',
        backgroundColor: BORDER_COLOR,
        bottom: 0,
        right: 0,
        cursor: 'se-resize',
      }}
    />
  );

  return (
    <NodeViewWrapper style={{ display: 'contents' }}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: width,
          height: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 5,
          pointerEvents: 'auto',
          minHeight: '24px',
        }}
        draggable
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={() => setEditing(true)}
        onBlur={() => setEditing(false)}
      >
        <AutoTextSize
          mode="oneline"
          minFontSizePx={parsedMinFontSizePx}
          maxFontSizePx={parsedMaxFontSizePx}
          fontSizePrecisionPx={parsedFontSizePrecisionPx}
          contentEditable={editing}
          suppressContentEditableWarning
          className="print:border-none print:text-black relative auto-text-size"
          style={{
            border: '1px dashed white',
            borderRadius: '0px',
            backgroundColor: 'transparent',
            position: 'relative',
            minWidth: 'fit-content',
          }}
          onDragStart={handleAutoTextSizeDragStart}
        >
          <NodeViewContent style={{ display: 'inline', whiteSpace: 'nowrap' }} />
          {editing && (
            <>
              {dragCornerButton("se")}
              <div 
              className="print:hidden"
              style={{
                position: 'absolute',
                inset: 0,
                border: `2px solid ${BORDER_COLOR}`,
                pointerEvents: 'none',
              }} />
            </>
          )}
          <div 
            ref={textRef}
            style={{
              position: 'absolute',
              inset: -2,
              pointerEvents: 'none',
            }} />
        </AutoTextSize>
      </div>
    </NodeViewWrapper>
  );
};

export const InsertText = Node.create({
  name: 'insertText',
  group: 'inline',
  content: 'text*',
  draggable: true,
  selectable: true,
  inline: true,

  addAttributes() {
    return {
      x: { default: 0 },
      y: { default: 0 },
      width: { default: 100 },
      height: { default: "auto" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="insert-text"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'insert-text' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InsertTextComponent);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          let tr = newState.tr;
          let changed = false;

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'insertText' && node.textContent.trim() === '') {
              tr = tr.delete(pos, pos + node.nodeSize);
              changed = true;
            }
          });

          if (changed) {
            return tr;
          }
          return null;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-i': ({ editor }) => {
        const state = editor.state;
        const { selection } = state;
        const parent = selection.$from.parent;
  
        if (parent.type.name === 'insertText') {
          const originalNode = parent;
          
          const newNode = originalNode.type.create(
            {
              ...originalNode.attrs,
              x: (originalNode.attrs.x || 0) + 20,
              y: (originalNode.attrs.y || 0) + 20,
            },
            originalNode.content
          );
          const pos = selection.$from.end();

          const tr = state.tr.insert(pos, newNode);

          editor.view.dispatch(tr);
          return true; 
        }
        return false;
      },
    };
  },
});