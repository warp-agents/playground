import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import {
  createEditor,
  Transforms,
  Text,
  Element as SlateElement,
  Node as SlateNode,
  Editor,
  Range, // Import Range
  Descendant,
  Path,
  BaseEditor,
} from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';

type CustomEditor = BaseEditor & ReactEditor;

type ParagraphElement = {
  type: 'paragraph';
  children: CustomText[];
};

type CustomElement = ParagraphElement;

type FormattedText = {
  text: string;
  variable?: boolean;
  keyword?: string;
};

type CustomText = FormattedText;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

type DecoratedRange = Range & {
  variable?: boolean;
  keyword?: string;
};

const VARIABLE_REGEX = /\{\{(.*?)\}\}/g;
const keywords = ["else if", "if", "else", "then", "until", "while", "for"];
const KEYWORD_REGEX = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

const keywordColors = {
  if: "#ef4444",       // red-500
  else: "#22c55e",     // green-500
  "else if": "#eab308", // yellow-500
  then: "#a855f7",     // purple-500
  until: "#ec4899",    // pink-500
  while: "#6366f1",    // indigo-500
  for: "#f97316",      // orange-500
};

const AVAILABLE_VARIABLES = [
  'point_of_contact_email',
  'point_of_contact_phone_number',
  //
//   'supplier_address',
//   'supplier_email'
];

interface LeafProps {
  attributes: {
    'data-slate-leaf': true;
  };
  children: React.ReactNode;
  leaf: CustomText;
}

const Leaf = ({ attributes, children, leaf }: LeafProps) => {
  let style: React.CSSProperties = {};
  
  if (leaf.variable) {
    style.color = '#3b82f6'; // blue-500
    style.fontWeight = '600';
  }
  
  if (leaf.keyword && keywordColors[leaf.keyword as keyof typeof keywordColors]) {
    style.color = keywordColors[leaf.keyword as keyof typeof keywordColors];
    style.fontWeight = '600';
  }
  
  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

const decorate = ([node, path]: [SlateNode, Path]): DecoratedRange[] => {
  if (!Text.isText(node)) {
    return [];
  }
  
  const ranges: DecoratedRange[] = [];
  const text = node.text;
  let match;

  VARIABLE_REGEX.lastIndex = 0;
  KEYWORD_REGEX.lastIndex = 0;

  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    ranges.push({
      variable: true,
      anchor: { path, offset: match.index },
      focus: { path, offset: match.index + match[0].length },
    });
  }

  while ((match = KEYWORD_REGEX.exec(text)) !== null) {
    const keyword = match[0];
    ranges.push({
      keyword: keyword,
      anchor: { path, offset: match.index },
      focus: { path, offset: match.index + keyword.length },
    });
  }

  return ranges;
};

const withSingleLine = (editor: Editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry: [SlateNode, Path]) => {
    const [node, path] = entry;

    if (path.length === 0) {
      if (editor.children.length > 1) {
        Transforms.mergeNodes(editor, { at: [1] });
        return;
      }
    }
    
    if (SlateElement.isElement(node) && node.children.length === 0) {
      const emptyText: CustomText = { text: '' };
      Transforms.insertNodes(editor, emptyText, { at: path.concat(0) });
      return;
    }
    
    return normalizeNode(entry);
  };

  return editor;
};

interface PopoverProps {
  variables: string[];
  onSelect: (variable: string) => void;
  position: { top: number; left: number };
}

const VariablePopover = ({ variables, onSelect, position }: PopoverProps) => {
  return (
    <div
      className="absolute overflow-hidden z-50 bg-background border border-gray-200 rounded-lg shadow-lg py-1 min-w-48"
      style={{ top: position.top, left: position.left }}
    >
      {variables.map((variable) => (
        <button
          key={variable}
          className="w-full px-3 py-2 text-left text-sm hover:bg-input hover:text-blue-700 focus:bg-input focus:text-blue-700 focus:outline-none"
          onClick={() => onSelect(variable)}
        >
          <span className="font-mono text-blue-400">{"{{" + variable + "}}"}</span>
        </button>
      ))}
    </div>
  );
};

interface SyntaxHighlightInputProps {
  id?: string;
  initialValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function SyntaxHighlightInput({
  id,
  initialValue = '',
  placeholder = 'Enter text...',
  onChange,
  className = ''
}: SyntaxHighlightInputProps) {
  const editor = useMemo(() => withSingleLine(withReact(createEditor())), []);
  const editableRef = useRef<HTMLDivElement>(null);
  
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [openBracePosition, setOpenBracePosition] = useState<Path | null>(null);

  const initialSlateValue = useMemo((): Descendant[] => [
    { type: "paragraph", children: [{ text: initialValue }] }
  ], [initialValue]);

  const handleSlateChange = useCallback((value: Descendant[]) => {
    if (onChange) {
      const plainText = value.map(n => SlateNode.string(n)).join('\n');
      onChange(plainText);
    }

    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const beforeText = Editor.string(editor, { anchor: { path: start.path, offset: 0 }, focus: start });
      
      const lastOpenBrace = beforeText.lastIndexOf('{{');
      const lastCloseBrace = beforeText.lastIndexOf('}}');

      if (lastOpenBrace > lastCloseBrace) {
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const domRange = domSelection.getRangeAt(0);
          const rect = domRange.getBoundingClientRect();
          const editableRect = editableRef.current?.getBoundingClientRect();
          
          if (editableRect) {
            setPopoverPosition({
              top: rect.bottom - editableRect.top + 5,
              left: rect.left - editableRect.left,
            });
            setOpenBracePosition(start.path); 
            setShowPopover(true);
          }
        }
      } else {
        setShowPopover(false);
        setOpenBracePosition(null);
      }
    }
  }, [onChange, editor]);

  const handleVariableSelect = useCallback((variable: string) => {
    if (openBracePosition && editor.selection) {
      const textBefore = Editor.string(editor, { anchor: {path: openBracePosition, offset: 0}, focus: editor.selection.anchor });
      const openBraceOffset = textBefore.lastIndexOf('{{');

      if(openBraceOffset !== -1) {
        const rangeToReplace = {
            anchor: { path: openBracePosition, offset: openBraceOffset },
            focus: editor.selection.anchor
        };
        Transforms.select(editor, rangeToReplace);
        Transforms.insertText(editor, `{{${variable}}}`);
      }
    }
    setShowPopover(false);
    setOpenBracePosition(null);
  }, [editor, openBracePosition]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
    
    if (event.key === 'Escape' && showPopover) {
      setShowPopover(false);
      setOpenBracePosition(null);
      event.preventDefault();
    }
    
    if (showPopover && event.key === '}') {
        const { selection } = editor;
        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection);
          const charBefore = Editor.string(editor, {anchor: {...start, offset: start.offset-1}, focus: start});
          
          if (charBefore === '}') {
            setShowPopover(false);
            setOpenBracePosition(null);
          }
        }
    }
  }, [editor, showPopover]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        showPopover &&
        editableRef.current &&
        target instanceof Node &&
        !editableRef.current.contains(target)
      ) {
        setShowPopover(false);
        setOpenBracePosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  return (
    <div className={`relative nodrag ${className}`} ref={editableRef}>
      <Slate editor={editor} initialValue={initialSlateValue} onChange={handleSlateChange}>
        <Editable
          id={id}
          decorate={decorate}
          renderLeaf={Leaf}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex h-8 items-center w-full rounded-md border border-input bg-input px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            whiteSpace: 'pre',
            overflowX: 'auto',
            lineHeight: '1.5',
          }}
        />
      </Slate>
      
      {showPopover && (
        <VariablePopover
          variables={AVAILABLE_VARIABLES}
          onSelect={handleVariableSelect}
          position={popoverPosition}
        />
      )}
    </div>
  );
}