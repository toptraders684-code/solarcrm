import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    placeholderChip: {
      insertPlaceholder: (field: string, label: string) => ReturnType;
    };
  }
}

export const PlaceholderNode = Node.create({
  name: 'placeholderChip',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      field: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="placeholder"]' }];
  },

  renderHTML({ node }) {
    return [
      'span',
      mergeAttributes({
        'data-type': 'placeholder',
        'data-field': node.attrs.field,
        class: 'placeholder-chip',
      }),
      `{{${node.attrs.field}}}`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.setAttribute('data-type', 'placeholder');
      dom.setAttribute('data-field', node.attrs.field);
      dom.className =
        'placeholder-chip inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30 mx-0.5 cursor-default select-none';
      dom.contentEditable = 'false';
      dom.textContent = node.attrs.label || `{{${node.attrs.field}}}`;
      return { dom };
    };
  },

  addCommands() {
    return {
      insertPlaceholder:
        (field: string, label: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { field, label },
          });
        },
    };
  },
});
