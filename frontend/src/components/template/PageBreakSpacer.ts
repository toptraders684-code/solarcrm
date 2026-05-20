import { Node } from '@tiptap/core';

// Thin page-break indicator inserted automatically between pages.
// Height must match PAGE_BREAK_SPACER_H in TemplateEditorPage.tsx (24px).
// Stripped on save and stripped from the right-panel preview HTML.

export const PageBreakSpacer = Node.create({
  name: 'pageBreakSpacer',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break-spacer"]' }];
  },

  renderHTML() {
    return ['div', { 'data-type': 'page-break-spacer', style: 'height:24px;pointer-events:none;user-select:none' }];
  },

  addNodeView() {
    return () => {
      const dom = document.createElement('div');
      dom.setAttribute('data-type', 'page-break-spacer');
      dom.style.height = '24px';
      dom.style.display = 'flex';
      dom.style.alignItems = 'center';
      dom.style.pointerEvents = 'none';
      dom.style.userSelect = 'none';
      dom.contentEditable = 'false';

      const left = document.createElement('div');
      left.style.flex = '1';
      left.style.borderTop = '2px dashed #6366f1';

      const label = document.createElement('span');
      label.textContent = 'page break';
      label.style.fontSize = '10px';
      label.style.fontWeight = '600';
      label.style.fontFamily = 'sans-serif';
      label.style.color = '#6366f1';
      label.style.letterSpacing = '0.08em';
      label.style.padding = '0 8px';

      const right = document.createElement('div');
      right.style.flex = '1';
      right.style.borderTop = '2px dashed #6366f1';

      dom.appendChild(left);
      dom.appendChild(label);
      dom.appendChild(right);

      return { dom };
    };
  },
});
