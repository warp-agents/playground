"use client"

import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import TipTapImage from "@tiptap/extension-image";

const useEvent = <T extends (...args: any[]) => any>(handler: T): T => {
    const handlerRef = useRef<T | null>(null);
  
    useLayoutEffect(() => {
      handlerRef.current = handler;
    }, [handler]);
  
    return useCallback((...args: Parameters<T>): ReturnType<T> => {
      if (handlerRef.current === null) {
        throw new Error('Handler is not assigned');
      }
      return handlerRef.current(...args);
    }, []) as T;
  };
  
  const MIN_WIDTH = 60;
  const BORDER_COLOR = "#2662D9";
  
  const ResizableImageTemplate = ({ node, updateAttributes }: NodeViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [editing, setEditing] = useState(false);
    const [resizingStyle, setResizingStyle] = useState<Pick<CSSProperties, "width"> | undefined>();
  
    // Lots of work to handle "not" div click events.
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setEditing(false);
        }
      };
      // Add click event listener and remove on cleanup
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [editing]);
  
    const handleMouseDown = useEvent((event: React.MouseEvent<HTMLDivElement>) => {
      if (!imgRef.current) return;
      event.preventDefault();
      const direction = event.currentTarget.dataset.direction || "--";
      const initialXPosition = event.clientX;
      const currentWidth = imgRef.current.width;
      let newWidth = currentWidth;
      const transform = direction[1] === "w" ? -1 : 1;
  
      const removeListeners = () => {
        window.removeEventListener("mousemove", mouseMoveHandler);
        window.removeEventListener("mouseup", removeListeners);
        updateAttributes({ width: newWidth });
        setResizingStyle(undefined);
      };
  
      const mouseMoveHandler = (event: MouseEvent) => {
        newWidth = Math.max(currentWidth + (transform * (event.clientX - initialXPosition)), MIN_WIDTH);
        setResizingStyle({ width: newWidth });
        // If mouse is up, remove event listeners
        if (!event.buttons) removeListeners();
      };
  
      window.addEventListener("mousemove", mouseMoveHandler);
      window.addEventListener("mouseup", removeListeners);
    });
  
    const dragCornerButton = (direction: string) => (
      <div
        role="button"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        data-direction={direction}
        style={{
          position: 'absolute',
          height: '10px',
          width: '10px',
          backgroundColor: BORDER_COLOR,
          ...({ n: { top: 0 }, s: { bottom: 0 } }[direction[0]]),
          ...({ w: { left: 0 }, e: { right: 0 } }[direction[1]]),
          cursor: `${direction}-resize`,
        }}
      >
      </div>
    );
  
    return (
      <NodeViewWrapper
        ref={containerRef}
        as="div"
        draggable
        data-drag-handle
        onClick={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        style={{ display: 'inline-block' }} 
      >
        <div
          style={{
            overflow: 'hidden',
            position: 'relative',
            display: 'block',         // Change from inline-block to block
            lineHeight: 0,
            fontSize: 0,             // Eliminate any font-related spacing
            width: 'fit-content',    // Contain to image width
          }}
        >
          <img
            {...node.attrs} ref={imgRef}
            style={{
              ...resizingStyle,
              cursor: 'default',
              display: 'block',       // Force block layout
              margin: 0,              // Remove default margins
              padding: 0,             // Remove any padding
              verticalAlign: 'top',   // Ensure proper alignment
              height: 'auto',         // Prevent height distortion
            }}
          />
          {editing && (
            <>
              {/* Don't use a simple border as it pushes other content around. */}
              {[ 
                // Full-height side borders
                { left: 0, top: 0, height: '100%', width: '1px' },
                { right: 0, top: 0, height: '100%', width: '1px' },
                // Full-width top/bottom borders positioned flush to image edges
                { top: 0, left: 0, width: '100%', height: '2px', transform: 'translateY(-0.5px)' },
                { bottom: 0, left: 0, width: '100%', height: '2px', transform: 'translateY(0.5px)' }
                ].map((style, i) => (
                <div key={i} style={{ 
                    position: 'absolute', 
                    backgroundColor: BORDER_COLOR, 
                    ...style 
                }}></div>
               ))}
              {dragCornerButton("nw")}
              {dragCornerButton("ne")}
              {dragCornerButton("sw")}
              {dragCornerButton("se")}
            </>
          )}
        </div>
      </NodeViewWrapper>
    );
  };
  
  export default TipTapImage.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: { renderHTML: ({ width }) => ({ width }) },
        height: { renderHTML: ({ height }) => ({ height }) },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(ResizableImageTemplate);
    },
  }).configure({ inline: true });