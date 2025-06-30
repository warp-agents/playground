"use client"

import React, { useEffect, useRef, useState } from "react"
import { BiCaretDown } from "react-icons/bi";

const RULER_WIDTH = 816
const MARKER_COUNT = 82

export function Ruler({ onChange }: { onChange: (leftMargin: number, rightMargin: number) => void }) {
    const markers = Array.from({ length: 83 }, (_, i) => i)
    const [leftMargin, setLeftMargin] = useState(96)
    const [rightMargin, setRightMargin] = useState(96)
    const [isDraggingLeft, setIsDraggingLeft] = useState(false)
    const [isDraggingRight, setIsDraggingRight] = useState(false)
    const rulerRef = useRef<HTMLDivElement>(null)

    const handleLeftMouseDown = () => {
        setIsDraggingLeft(true)
    }

    const handleRightMouseDown = () => {
        setIsDraggingRight(true)
    }

    const snapToGrid = (position: number): number => {
        const halfStep = ((RULER_WIDTH/MARKER_COUNT) / 2)
        
        const halfSteps = Math.round(position / halfStep) 
        
        return Math.round(halfSteps * halfStep)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if((isDraggingLeft || isDraggingRight) && rulerRef.current){
            const container = rulerRef.current.querySelector("#ruler-container")
            if(container){
                const containerRect = container.getBoundingClientRect()
                const relativeX = e.clientX - containerRect.left
                const rawPosition = Math.max(0, Math.min(RULER_WIDTH, relativeX))
                
                const snappedPosition = snapToGrid(rawPosition)

                if(isDraggingLeft){
                    const maxLeftPosition = RULER_WIDTH - rightMargin - 100
                    const newLeftPosition = Math.min(snappedPosition, maxLeftPosition)
                    setLeftMargin(newLeftPosition)
                } else if (isDraggingRight){
                    const snappedRightPos = snapToGrid(RULER_WIDTH - rawPosition)
                    const maxRightPosition = RULER_WIDTH - (leftMargin + 100)
                    const constrainedRightPosition = Math.min(snappedRightPos, maxRightPosition)
                    setRightMargin(constrainedRightPosition)
                }
            }
        }
    }

    const handleMouseUp = () => {    
        setIsDraggingLeft(false)
        setIsDraggingRight(false)
    }

    const handleLeftDoubleClick = () => {
        setLeftMargin(96)
    }

    const handleRightDoubleClick = () => {
        setRightMargin(96)
    }
  
    return (
      <div
       ref={rulerRef}
       onMouseMove={handleMouseMove}
       onMouseUp={handleMouseUp}
       onMouseLeave={handleMouseUp}
       className="h-6 w-[816px] mx-auto flex items-end relative select-none print:hidden">
        <div className="absolute bottom-[-1px] left-0 w-[calc(100%+1px)] border-b border-muted-foreground/20"></div>
        <div
        id="ruler-container"
        className={`relative h-full w-full `}
        >
          <Marker
            position={leftMargin}
            isLeft={true}
            isDragging={isDraggingLeft}
            onMouseDown={handleLeftMouseDown}
            onDoubleClick={handleLeftDoubleClick}
          />
          <Marker
            position={rightMargin}
            isLeft={false}
            isDragging={isDraggingRight}
            onMouseDown={handleRightMouseDown}
            onDoubleClick={handleRightDoubleClick}
          />
          <div className="absolute bottom-0 inset-x-0 h-full">
            <div className={`relative h-full w-[816px]`}>
              {markers.map((marker) => {
                const position = Math.round((marker * RULER_WIDTH) / MARKER_COUNT)
  
                return (
                  <div
                   key={marker}
                   className="absolute bottom-0"
                   style={{ left: `${position}px` }}
                   >
                    {marker % 10 === 0 && (
                      <>
                        <div className="absolute bottom-0 w-[1px] h-2 bg-muted-foreground/20"></div>
                        <span className="absolute bottom-2 text-[10px] text-muted-foreground/20 transform -translate-x-1/2">{marker / 10 + 1}</span>
                      </> 
                    )}
                    {marker % 5 === 0 && marker % 10 !== 0 && (
                      <>
                        <div className="absolute bottom-0 w-[1px] h-1.5 bg-muted-foreground/20"></div>
                      </> 
                    )}
                    {marker % 5 !== 0 && (
                      <>
                        <div className="absolute bottom-0 w-[1px] h-1 bg-muted-foreground/20"></div>
                      </> 
                    )}
                   </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
export function Marker({
    position,
    isLeft,
    isDragging,
    onMouseDown,
    onDoubleClick,
}:{
    position: number,
    isLeft: boolean,
    isDragging: boolean,
    onMouseDown: () => void,
    onDoubleClick: () => void,
}){

return (
    <div 
    className="absolute bottom-0 cursor-ew-resize z-[5] group"
    style={{ [isLeft ? "left" : "right"]: `${isLeft ? position + .5 : position - .5}px` }} // Offset for centering
    onMouseDown={onMouseDown}
    onDoubleClick={onDoubleClick}
    >
        <BiCaretDown className="absolute left-1/2 bottom-0 h-5 w-5 transform -translate-x-1/2 fill-[#2662D9]"/>
        {isDragging && (
        <div 
            className="absolute left-1/2 top-0 transform -translate-x-1/2 transition-opacity duration-150 w-[1px] bg-[#2662D9]"
            style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "100%",
            height: "100vh"
            }}
        ></div>
        )}
    </div>
)
}