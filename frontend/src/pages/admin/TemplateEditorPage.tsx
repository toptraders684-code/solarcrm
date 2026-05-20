import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { ArrowLeft, Save, FileText, Users, Building2, Database, Activity, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlaceholderNode } from '@/components/template/PlaceholderNode';
import { TemplateToolbar } from '@/components/template/TemplateToolbar';
import { documentMasterService } from '@/services/document-master.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

// A4 dimensions at 96dpi: 794px × 1123px
// We scale the preview to fit the panel width

const TIPTAP_EXTENSIONS = [
  StarterKit,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  FontSize,
  Underline,
  Color,
  Image.configure({ inline: false, allowBase64: true }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  PlaceholderNode,
];

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [isDirty, setIsDirty] = useState(false);
  const editorPageRef = useRef<HTMLDivElement>(null);

  const { data: templateData, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => documentMasterService.getTemplate(id!),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: (content: any) => documentMasterService.saveTemplate(id!, content),
    onSuccess: () => {
      toast.success('Template saved');
      setIsDirty(false);
    },
    onError: () => toast.error('Failed to save template'),
  });

  const editor = useEditor({
    extensions: TIPTAP_EXTENSIONS,
    content: '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-full',
        style: 'font-family: serif; font-size: 12pt; line-height: 1.6;',
      },
    },
    onUpdate: () => setIsDirty(true),
  });

  // Load template content once fetched
  useEffect(() => {
    if (editor && templateData?.templateContent) {
      editor.commands.setContent(templateData.templateContent as any);
      setIsDirty(false);
    }
  }, [editor, templateData]);

  const handleSave = () => {
    if (!editor) return;
    saveMutation.mutate(editor.getJSON());
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const title = templateData?.title ?? 'Template Editor';

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-20 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <img src="/images/solar.png" alt="Usolar" className="w-8 h-8 object-contain rounded-lg" />
            <div>
              <p className="text-sm font-black text-primary leading-none">Usolar CRM</p>
              <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest">Super Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-variant hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors"
            >
              <LogOut size={15} />Logout
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-6 border-t border-outline-variant/10">
          {[
            { to: '/admin/companies', icon: Building2, label: 'Companies' },
            { to: '/admin/documents', icon: FileText, label: 'Document Master' },
            { to: '/admin/masters', icon: Database, label: 'Master Data' },
            { to: '/admin/users', icon: Users, label: 'Admin Users' },
            { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
              }`}>
              <Icon size={13} />{label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Sub-header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-outline-variant/10 bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/documents')}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft size={15} />Back
          </button>
          <div className="w-px h-4 bg-outline-variant/30" />
          <div>
            <p className="text-sm font-black text-on-surface">{title}</p>
            <p className="text-[10px] text-on-surface-variant/50">
              {isDirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          loading={saveMutation.isPending}
          disabled={!isDirty}
        >
          <Save size={13} />Save Template
        </Button>
      </div>

      {/* Editor / Preview split */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant/50">
          Loading template…
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Left: Editor */}
          <div className="flex flex-col w-1/2 border-r border-outline-variant/10 min-h-0">
            <div className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 px-4 py-2 bg-surface-container border-b border-outline-variant/10">
              Editor
            </div>
            <div className="flex-shrink-0">
              {editor && <TemplateToolbar editor={editor} />}
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto p-8 min-h-0" style={{ background: '#525659' }}>
              <div
                ref={editorPageRef}
                className="mx-auto"
                style={{
                  width: A4_W, minHeight: A4_H,
                  background: 'white',
                  boxShadow: '0 2px 14px rgba(0,0,0,0.45)',
                  padding: `${A4_V_PAD}px ${A4_H_PAD}px`,
                }}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Right: A4 Preview */}
          <div className="flex flex-col w-1/2 min-h-0">
            <div className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 px-4 py-2 bg-surface-container border-b border-outline-variant/10">
              A4 Preview — Placeholders shown as chips
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <A4Preview editor={editor} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── A4 Preview panel ────────────────────────────────────────────────────────
// Rendered at IDENTICAL dimensions to the editor (794px, padding 72/80px).
// No CSS scaling — both panels show the same physical size so line-wrapping
// and page breaks are always in sync.
const A4_W = 794;
const A4_H = 1123;
const A4_H_PAD = 80;
const A4_V_PAD = 36;
const A4_CONTENT_H = A4_H - A4_V_PAD * 2; // 979px per page

type TableMeasure = { top: number; bottom: number; headerHtml: string; headerHeight: number };

function A4Preview({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [html, setHtml] = useState('');
  const [numPages, setNumPages] = useState(1);
  const [processedHtml, setProcessedHtml] = useState('');
  const [tableMeasures, setTableMeasures] = useState<TableMeasure[]>([]);

  // Listen to editor updates
  useEffect(() => {
    if (!editor) return;
    // Just capture the raw HTML; nPages is derived in the processing effect below
    const measure = () => { setHtml(editor.getHTML()); };
    measure();
    editor.on('update', measure);
    return () => { editor.off('update', measure); };
  }, [editor]);

  // Process HTML and measure table positions whenever raw html changes
  useEffect(() => {
    if (!html) { setProcessedHtml(''); setTableMeasures([]); return; }

    // 1. Fix empty paragraphs
    const withBr = html.replace(/<p([^>]*)>\s*<\/p>/g, '<p$1><br></p>');

    // 2. Move leading <th> rows from <tbody> into a proper <thead>
    //    TipTap stores header cells as <th> inside <tbody>, which breaks CSS thead repetition
    const tmpDiv = document.createElement('div');
    tmpDiv.innerHTML = withBr;
    for (const table of Array.from(tmpDiv.querySelectorAll('table'))) {
      const tbody = table.querySelector('tbody');
      if (!tbody) continue;
      const headerRows: Element[] = [];
      for (const row of Array.from(tbody.querySelectorAll(':scope > tr'))) {
        const cells = Array.from((row as HTMLTableRowElement).cells);
        if (cells.length > 0 && cells.every(c => c.tagName === 'TH')) {
          headerRows.push(row);
        } else break;
      }
      if (!headerRows.length) continue;
      const thead = document.createElement('thead');
      headerRows.forEach(r => { thead.appendChild(r.cloneNode(true)); r.remove(); });
      table.insertBefore(thead, tbody);
    }
    const pHtml = tmpDiv.innerHTML;
    setProcessedHtml(pHtml);

    // 3. Measure table positions for repeated-header overlay on continuation pages
    const mDiv = document.createElement('div');
    mDiv.setAttribute('style',
      `position:fixed;left:-9999px;top:0;width:${A4_W - A4_H_PAD * 2}px;` +
      `font-family:serif;font-size:12pt;line-height:1.6;visibility:hidden;pointer-events:none`
    );
    mDiv.className = 'template-preview-content';
    mDiv.innerHTML = pHtml;
    document.body.appendChild(mDiv);

    const base = mDiv.getBoundingClientRect().top;
    const measures: TableMeasure[] = [];
    for (const table of Array.from(mDiv.querySelectorAll('table'))) {
      const thead = table.querySelector('thead');
      if (!thead) continue;
      const rect = table.getBoundingClientRect();
      const colgroup = table.querySelector('colgroup');
      const colgroupHtml = colgroup ? colgroup.outerHTML : '';

      // Use stored colgroup pixel widths (TipTap's source of truth for column sizing).
      // Fall back to getBoundingClientRect only when no explicit widths exist.
      const cols = Array.from(table.querySelectorAll('colgroup > col'));
      const colgroupWidths = cols.map(col => parseInt((col as HTMLElement).style.width) || 0);
      const useColgroup = colgroupWidths.length > 0 && colgroupWidths.every(w => w > 0);

      const theadClone = thead.cloneNode(true) as HTMLElement;
      const cloneFirstRow = theadClone.querySelector('tr');
      if (cloneFirstRow) {
        const headerCells = Array.from(thead.querySelectorAll('tr:first-child > th, tr:first-child > td'));
        Array.from(cloneFirstRow.children).forEach((cell, idx) => {
          const w = useColgroup
            ? (colgroupWidths[idx] || 0)
            : (headerCells[idx] ? Math.round((headerCells[idx] as HTMLElement).getBoundingClientRect().width) : 0);
          if (w > 0) {
            (cell as HTMLElement).style.width = w + 'px';
            (cell as HTMLElement).style.minWidth = w + 'px';
          }
        });
      }

      const tableWidth = useColgroup
        ? colgroupWidths.reduce((s, w) => s + w, 0)
        : Math.round(rect.width);

      // Measure header height so continuation pages can offset content past the partial row
      const theadRect = thead.getBoundingClientRect();
      const headerHeight = Math.round(theadRect.height);

      measures.push({
        top: Math.round(rect.top - base),
        bottom: Math.round(rect.bottom - base),
        headerHeight,
        headerHtml: `<table style="border-collapse:collapse;table-layout:fixed;width:${tableWidth}px;margin:0">${colgroupHtml}<thead>${theadClone.innerHTML}</thead></table>`,
      });
    }
    // Derive page count from the same measurement used by the left panel's spacer logic
    const mH = mDiv.scrollHeight;
    document.body.removeChild(mDiv);
    setTableMeasures(measures);
    const rawPages = Math.max(1, Math.ceil(mH / A4_CONTENT_H));
    const lastPageH = mH - (rawPages - 1) * A4_CONTENT_H;
    setNumPages((rawPages > 1 && lastPageH < 50) ? rawPages - 1 : rawPages);
  }, [html]);

  const isEmpty = !html || html.replace(/<[^>]+>/g, '').trim() === '';

  return (
    <div
      style={{ background: '#525659', minHeight: '100%' }}
      className="p-8 flex flex-col items-center gap-2"
    >
      {isEmpty ? (
        <div style={{
          width: A4_W, height: A4_H, background: 'white',
          boxShadow: '0 2px 14px rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ color: '#ccc', fontSize: 12 }}>Start typing to preview…</p>
        </div>
      ) : (
        Array.from({ length: numPages }, (_, pageIndex) => {
          const pageStart = pageIndex * A4_CONTENT_H;
          const repeatedHeaders = tableMeasures.filter(
            t => t.top < pageStart && t.bottom > pageStart
          );
          return (
            <div key={pageIndex} style={{ flexShrink: 0 }}>
              {pageIndex > 0 && (
                <div style={{
                  textAlign: 'center', marginBottom: 8,
                  color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                }}>
                  PAGE {pageIndex + 1}
                </div>
              )}
              <div style={{
                width: A4_W, height: A4_H, background: 'white',
                boxShadow: '0 2px 14px rgba(0,0,0,0.45)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: A4_V_PAD, left: A4_H_PAD,
                  right: A4_H_PAD, height: A4_CONTENT_H, overflow: 'hidden',
                }}>
                  {(() => {
                    const hasHeader = repeatedHeaders.length > 0;
                    const hH = hasHeader ? repeatedHeaders[0].headerHeight : 0;
                    // Shift content so that after the white top margin + header, the first
                    // visible data row is exactly the first complete row past the page break.
                    const contentTop = hasHeader ? -pageStart + A4_V_PAD + hH : -pageStart;
                    return (
                      <>
                        {/* Full document content, sliced to this page */}
                        <div
                          style={{
                            position: 'absolute', top: contentTop,
                            left: 0, right: 0,
                            fontFamily: 'serif', fontSize: '12pt', lineHeight: 1.6, color: '#000',
                          }}
                          className="template-preview-content"
                          dangerouslySetInnerHTML={{ __html: processedHtml }}
                        />
                        {/* White top-margin band — mirrors left panel's top-margin overlay */}
                        {hasHeader && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            height: A4_V_PAD, background: 'white', zIndex: 1,
                          }} />
                        )}
                        {/* Repeated table header — clipped window into the same processedHtml
                            so column widths are identical to page 1 */}
                        {repeatedHeaders.map((t, hi) => (
                          <div key={hi} style={{
                            position: 'absolute', top: A4_V_PAD,
                            left: 0, right: 0,
                            height: t.headerHeight, overflow: 'hidden',
                            zIndex: 2, background: 'white',
                          }}>
                            <div style={{
                              position: 'absolute', top: -t.top, left: 0, right: 0,
                              fontFamily: 'serif', fontSize: '12pt', lineHeight: 1.6, color: '#000',
                            }}
                              className="template-preview-content"
                              dangerouslySetInnerHTML={{ __html: processedHtml }}
                            />
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
                <div style={{
                  position: 'absolute', bottom: 14, right: 18,
                  fontSize: 9, color: '#bbb', fontFamily: 'sans-serif',
                }}>
                  {pageIndex + 1} / {numPages}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
