import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type { StrapiBlock } from './strapi-blocks';
import { editorJsonToStrapiBlocks, strapiBlocksToEditorJson } from './strapi-blocks';

export interface RichTextEditorProps {
  value: StrapiBlock[] | string;
  onChange: (blocks: StrapiBlock[]) => void;
  placeholder?: string;
  error?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, error }: RichTextEditorProps) {
  const initialContent = getInitialContent(value);

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      const json = editor.getJSON();
      const blocks = editorJsonToStrapiBlocks(json);
      onChange(blocks);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: handleUpdate,
  });

  // Sync external value changes (e.g., when pre-populating for edit)
  useEffect(() => {
    if (!editor) return;
    const currentBlocks = editorJsonToStrapiBlocks(editor.getJSON());
    const incomingBlocks = normalizeValue(value);
    if (JSON.stringify(currentBlocks) !== JSON.stringify(incomingBlocks)) {
      const content = Array.isArray(value)
        ? strapiBlocksToEditorJson(value)
        : { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [] }] };
      editor.commands.setContent(content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div style={{ ...styles.wrapper, ...(error ? styles.wrapperError : {}) }}>
      {editor && <MenuBar editor={editor} />}
      <EditorContent editor={editor} style={styles.content} />
      {(!editor || editor.isEmpty) && placeholder && (
        <div style={styles.placeholder}>{placeholder}</div>
      )}
    </div>
  );
}

function MenuBar({ editor }: { editor: Editor }) {
  return (
    <div style={styles.menuBar}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={{
          ...styles.menuButton,
          ...(editor.isActive('bold') ? styles.menuButtonActive : {}),
        }}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={{
          ...styles.menuButton,
          ...(editor.isActive('italic') ? styles.menuButtonActive : {}),
        }}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={{
          ...styles.menuButton,
          ...(editor.isActive('heading', { level: 2 }) ? styles.menuButtonActive : {}),
        }}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        style={{
          ...styles.menuButton,
          ...(editor.isActive('heading', { level: 3 }) ? styles.menuButtonActive : {}),
        }}
        title="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={{
          ...styles.menuButton,
          ...(editor.isActive('bulletList') ? styles.menuButtonActive : {}),
        }}
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={{
          ...styles.menuButton,
          ...(editor.isActive('orderedList') ? styles.menuButtonActive : {}),
        }}
        title="Ordered List"
      >
        1. List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={{
          ...styles.menuButton,
          ...(editor.isActive('blockquote') ? styles.menuButtonActive : {}),
        }}
        title="Quote"
      >
        " Quote
      </button>
    </div>
  );
}

function getInitialContent(value: StrapiBlock[] | string) {
  if (Array.isArray(value) && value.length > 0) {
    return strapiBlocksToEditorJson(value);
  }
  if (typeof value === 'string' && value.trim()) {
    // Legacy: plain string — wrap in a paragraph
    return { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: value }] }] };
  }
  return { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [] }] };
}

function normalizeValue(value: StrapiBlock[] | string): StrapiBlock[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return [{ type: 'paragraph', children: [{ type: 'text', text: value }] }];
  }
  return [];
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  wrapperError: {
    borderColor: '#dc2626',
  },
  menuBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px',
    padding: '4px 8px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  menuButton: {
    minWidth: '36px',
    minHeight: '32px',
    padding: '4px 8px',
    border: '1px solid transparent',
    borderRadius: '3px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#374151',
  },
  menuButtonActive: {
    backgroundColor: '#e5e7eb',
    borderColor: '#d1d5db',
  },
  content: {
    padding: '12px',
    minHeight: '200px',
    fontSize: '16px',
    lineHeight: '1.6',
  },
  placeholder: {
    position: 'absolute',
    top: '52px',
    left: '12px',
    color: '#9ca3af',
    pointerEvents: 'none',
    fontSize: '16px',
  },
};
