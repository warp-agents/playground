'use client';
import React, { useState, useEffect, useRef }  from 'react';
import { cn } from '@/lib/utils';

interface UseAutosizeTextAreaProps {
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  minHeight?: number;
  maxHeight?: number;
  triggerAutoSize: string;
}

export const useAutosizeTextArea = ({
  textAreaRef,
  triggerAutoSize,
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 0,
}: UseAutosizeTextAreaProps) => {
  const [init, setInit] = useState(true);

  useEffect(() => {
    // We need to reset the height momentarily to get the correct scrollHeight for the textarea
    const offsetBorder = 6;
    const textAreaElement = textAreaRef.current;
    if (textAreaElement) {
      if (init) {
        textAreaElement.style.minHeight = `${minHeight + offsetBorder}px`;
        if (maxHeight > minHeight) {
          textAreaElement.style.maxHeight = `${maxHeight}px`;
        }
        setInit(false);
      }
      textAreaElement.style.height = `${minHeight + offsetBorder}px`;
      const scrollHeight = textAreaElement.scrollHeight;
      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will produce an incorrect value.
      if (scrollHeight > maxHeight) {
        textAreaElement.style.height = `${maxHeight}px`;
      } else {
        textAreaElement.style.height = `${scrollHeight + offsetBorder}px`;
      }
    }
  }, [textAreaRef, triggerAutoSize, maxHeight, minHeight, init]);
};

export type AutosizeTextAreaRef = {
  textArea: HTMLTextAreaElement;
  maxHeight: number;
  minHeight: number;
};

type AutosizeTextAreaProps = {
  maxHeight?: number;
  minHeight?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AutosizeTextarea = React.forwardRef<AutosizeTextAreaRef, AutosizeTextAreaProps>(
  (
    {
      maxHeight = Number.MAX_SAFE_INTEGER,
      minHeight = 52,
      className,
      onChange,
      value,
      ...props
    }: AutosizeTextAreaProps,
    ref: React.Ref<AutosizeTextAreaRef>,
  ) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const [triggerAutoSize, setTriggerAutoSize] = useState('');

    useAutosizeTextArea({
      textAreaRef,
      triggerAutoSize: triggerAutoSize,
      maxHeight,
      minHeight,
    });

    useEffect(() => {
      setTriggerAutoSize(value as string);
    }, [props?.defaultValue, value]);

    return (
      <textarea
        {...props}
        value={value}
        ref={textAreaRef}
        className={cn(
          'flex w-full rounded-md border border-input bg-input px-3 py-2 box-border overflow-y-auto text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50', 
          className,
        )}
        onChange={(e) => {
          setTriggerAutoSize(e.target.value);
          onChange?.(e);
        }}
      />
    );
  },
);
AutosizeTextarea.displayName = 'AutosizeTextarea';
