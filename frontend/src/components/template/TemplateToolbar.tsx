import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Table as TableIcon, Image as ImageIcon, ChevronDown,
  ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine,
  Rows3, Columns3, Merge, Split, Trash2,
} from 'lucide-react';
import { FONT_SIZES } from './FontSize';
import { PLACEHOLDER_GROUPS } from '@/utils/templatePlaceholders';

interface Props {
  editor: Editor;
}

function ToolBtn({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-outline-variant/30 mx-1" />;
}

// Grid picker for table insertion (up to 6×6)
function TablePicker({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const MAX = 6;
  return (
    <div className="p-2">
      <p className="text-[10px] text-on-surface-variant/60 mb-2 font-semibold">
        {hover.r > 0 ? `${hover.r} × ${hover.c} Table` : 'Select size'}
      </p>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)` }}
      >
        {Array.from({ length: MAX * MAX }, (_, i) => {
          const r = Math.floor(i / MAX) + 1;
          const c = (i % MAX) + 1;
          const filled = r <= hover.r && c <= hover.c;
          return (
            <div
              key={i}
              className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${
                filled ? 'bg-primary/40 border-primary/60' : 'bg-surface-container border-outline-variant/30 hover:bg-primary/10'
              }`}
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => onInsert(r, c)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function TemplateToolbar({ editor }: Props) {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [placeholderSearch, setPlaceholderSearch] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const tablePickerRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setShowTablePicker(false);
      }
      if (placeholderRef.current && !placeholderRef.current.contains(e.target as Node)) {
        setShowPlaceholders(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) {
        setShowFontSize(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const rawFontSize = (editor.getAttributes('textStyle').fontSize as string) || '';
  const currentFontSize = rawFontSize.replace('pt', '') || '12';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (src) editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filteredGroups = PLACEHOLDER_GROUPS.map((g) => ({
    ...g,
    fields: placeholderSearch
      ? g.fields.filter(
          (f) =>
            f.label.toLowerCase().includes(placeholderSearch.toLowerCase()) ||
            f.key.includes(placeholderSearch.toLowerCase()),
        )
      : g.fields,
  })).filter((g) => g.fields.length > 0);

  const inTable = editor.isActive('table');

  return (
    <div className="border-b border-outline-variant/10 bg-surface-container-lowest">
    {/* ── Main toolbar row ── */}
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
      {/* Font size */}
      <div className="relative" ref={fontSizeRef}>
        <button
          type="button"
          onClick={() => { setShowFontSize((v) => !v); setShowTablePicker(false); setShowPlaceholders(false); }}
          className="flex items-center gap-1 h-7 px-2 rounded text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors min-w-[52px]"
        >
          {currentFontSize}pt <ChevronDown size={11} />
        </button>
        {showFontSize && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-surface border border-outline-variant/20 rounded-xl shadow-xl overflow-hidden w-20">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-container transition-colors ${
                  currentFontSize === s ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'
                }`}
                onClick={() => { editor.chain().focus().setFontSize(s + 'pt').run(); setShowFontSize(false); }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Text formatting */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <Underline size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={13} />
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={13} />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
        <ListOrdered size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Indent">
        <Indent size={13} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Outdent">
        <Outdent size={13} />
      </ToolBtn>

      <Divider />

      {/* Table insert */}
      <div className="relative" ref={tablePickerRef}>
        <ToolBtn
          onClick={() => { setShowTablePicker((v) => !v); setShowPlaceholders(false); setShowFontSize(false); }}
          active={showTablePicker}
          title="Insert Table"
        >
          <TableIcon size={13} />
        </ToolBtn>
        {showTablePicker && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-surface border border-outline-variant/20 rounded-xl shadow-xl">
            <TablePicker
              onInsert={(rows, cols) => {
                editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                setShowTablePicker(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Image insert */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <ToolBtn onClick={() => imageInputRef.current?.click()} title="Insert Image">
        <ImageIcon size={13} />
      </ToolBtn>

      <Divider />

      {/* Placeholder insert */}
      <div className="relative" ref={placeholderRef}>
        <button
          type="button"
          onClick={() => { setShowPlaceholders((v) => !v); setShowTablePicker(false); setShowFontSize(false); }}
          className={`flex items-center gap-1 h-7 px-2.5 rounded text-[11px] font-bold transition-colors border ${
            showPlaceholders
              ? 'bg-primary text-white border-primary'
              : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
          }`}
        >
          {'{ }'} Insert Variable <ChevronDown size={11} />
        </button>
        {showPlaceholders && (
          <div className="absolute top-full right-0 mt-1 z-50 bg-surface border border-outline-variant/20 rounded-xl shadow-xl w-64 max-h-80 flex flex-col">
            <div className="p-2 border-b border-outline-variant/10">
              <input
                type="text"
                placeholder="Search variables…"
                value={placeholderSearch}
                onChange={(e) => setPlaceholderSearch(e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-lg border border-outline-variant/20 bg-surface-container focus:outline-none focus:border-primary/40"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 bg-surface-container/50">
                    {group.label}
                  </p>
                  {group.fields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container transition-colors flex items-center justify-between gap-2"
                      onClick={() => {
                        editor.chain().focus().insertPlaceholder(field.key, field.label).run();
                        setShowPlaceholders(false);
                        setPlaceholderSearch('');
                      }}
                    >
                      <span>{field.label}</span>
                      <span className="text-[10px] text-on-surface-variant/40 font-mono">
                        {`{{${field.key}}}`}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <p className="px-3 py-4 text-xs text-on-surface-variant/50 text-center">No variables found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>{/* end main row */}

    {/* ── Contextual table row — shown only when cursor is inside a table ── */}
    {inTable && (
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-t border-outline-variant/10 bg-secondary-container/30">
        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 mr-1">Table</span>
        <Divider />

        {/* Row controls */}
        <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Above">
          <ArrowUpToLine size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row Below">
          <ArrowDownToLine size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
          <Rows3 size={13} />
        </ToolBtn>

        <Divider />

        {/* Column controls */}
        <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Left">
          <ArrowLeftToLine size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column Right">
          <ArrowRightToLine size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
          <Columns3 size={13} />
        </ToolBtn>

        <Divider />

        {/* Cell controls */}
        <ToolBtn onClick={() => editor.chain().focus().mergeCells().run()} title="Merge Selected Cells">
          <Merge size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().splitCell().run()} title="Split Cell">
          <Split size={13} />
        </ToolBtn>

        <Divider />

        {/* Delete table */}
        <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
          <Trash2 size={13} />
        </ToolBtn>
      </div>
    )}
    </div>
  );
}
