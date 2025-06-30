"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

const BORDER_COLOR = "#4299e1";

const InsertESignComponent = ({
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
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: node.attrs.x || 0, y: node.attrs.y || 0 });
  const [width, setWidth] = useState(node.attrs.width || 100);

  const containerRef = useRef<HTMLDivElement>(null);
  const sigCanvasRef = useRef<any>(null); 
  const offsetRef = useRef({ x: 0, y: 0 });

  const minWidth = 100;
  const maxWidth = 500;
  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));

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
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
    e.dataTransfer.setDragImage(img, 0, 0);

    setIsDragging(true);
  }, [position]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    if (!e.clientX || !e.clientY) return;

    const pageContainer = containerRef.current?.closest(".page");
    if (!pageContainer) return;

    const pageRect = pageContainer.getBoundingClientRect();
    const cursorX = e.clientX - pageRect.left;
    const cursorY = e.clientY - pageRect.top;

    const newX = cursorX - offsetRef.current.x;
    const newY = cursorY - offsetRef.current.y;

    const maxX = pageRect.width - (96 * 2) - (containerRef.current?.offsetWidth || 0);
    const maxY = pageRect.height - (96 * 2) - (containerRef.current?.offsetHeight || 0);

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

      const editor = containerRef.current?.closest(".ProseMirror");
      if (editor) {
        const editorRect = editor.getBoundingClientRect();
        newWidth = Math.min(newWidth, editorRect.width - position.x);
      }

      newWidth = Math.max(200, Math.min(newWidth, 400));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
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
        position: "absolute",
        height: "10px",
        width: "10px",
        backgroundColor: BORDER_COLOR,
        bottom: 0,
        right: 0,
        cursor: "se-resize",
      }}
    />
  );

  return (
    <NodeViewWrapper style={{ display: "contents" }}>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          width: width,
          height: "auto",
          cursor: isDragging
            ? "grabbing"
            : selected
            ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'><path d='M7.127 22.562l-7.127 1.438 1.438-7.128 5.689 5.69zm1.414-1.414l11.228-11.225-5.69-5.692-11.227 11.227 5.689 5.69zm9.768-21.148l-2.816 2.817 5.691 5.691 2.816-2.819-5.691-5.689z' stroke='white' stroke-width='1.5' /></svg>"), auto`
            : "grab",
          zIndex: 5,
          pointerEvents: "auto",
          minHeight: "24px",
        }}
        draggable={!selected}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <div
          className="w-fit h-fit rounded-md overflow-hidden"
          onDragStart={handleAutoTextSizeDragStart}
        >
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="#000000"
            canvasProps={{
              width: clampedWidth,
              height: clampedWidth * (45 / 200),
              className: "sigCanvas",
            }}
          />
          <>
            {dragCornerButton("se")} 
            <div
              className="print:hidden"
              style={{
                position: "absolute",
                inset: 0,
                border: `2px solid ${BORDER_COLOR}`,
                pointerEvents: "none",
              }}
            />
          </>
          <div
            style={{
              position: "absolute",
              inset: -2,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const InsertESign = Node.create({
  name: "insertESign",
  group: "inline",
  draggable: true,
  selectable: true,
  inline: true,

  addAttributes() {
    return {
      x: { default: 0 },
      y: { default: 0 },
      width: { default: 100 },
      height: { default: "auto" },
      content: { default: "Insert e-sign here!" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="insert-e-sign"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "insert-e-sign" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InsertESignComponent);
  },
});