import type {
  StrapiBlock,
  StrapiTextNode,
} from '../forms/strapi-blocks';

interface BlocksRendererProps {
  blocks: StrapiBlock[] | string | undefined | null;
}

/**
 * Renders Strapi rich-text blocks as read-only HTML.
 * Handles paragraphs, headings, lists, and quotes with inline formatting.
 */
export function BlocksRenderer({ blocks }: BlocksRendererProps) {
  if (!blocks) return <p style={styles.empty}>—</p>;

  // If it's a plain string (legacy), render as a paragraph
  if (typeof blocks === 'string') {
    if (!blocks.trim()) return <p style={styles.empty}>—</p>;
    return <p style={styles.paragraph}>{blocks}</p>;
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return <p style={styles.empty}>—</p>;
  }

  return (
    <div style={styles.container}>
      {blocks.map((block, idx) => (
        <RenderBlock key={idx} block={block} />
      ))}
    </div>
  );
}

function RenderBlock({ block }: { block: StrapiBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p style={styles.paragraph}><RenderChildren children={block.children} /></p>;

    case 'heading': {
      const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
      return <Tag style={styles[`h${block.level}`] || styles.h2}><RenderChildren children={block.children} /></Tag>;
    }

    case 'list': {
      const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
      return (
        <ListTag style={styles.list}>
          {block.children.map((item, idx) => (
            <li key={idx} style={styles.listItem}>
              <RenderChildren children={item.children} />
            </li>
          ))}
        </ListTag>
      );
    }

    case 'quote':
      return (
        <blockquote style={styles.quote}>
          <RenderChildren children={block.children} />
        </blockquote>
      );

    default:
      return null;
  }
}

function RenderChildren({ children }: { children: StrapiTextNode[] }) {
  if (!children || children.length === 0) return null;

  return (
    <>
      {children.map((node, idx) => (
        <RenderTextNode key={idx} node={node} />
      ))}
    </>
  );
}

function RenderTextNode({ node }: { node: StrapiTextNode }) {
  let content: React.ReactNode = node.text;

  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;
  if (node.code) content = <code style={styles.code}>{content}</code>;

  return <>{content}</>;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    lineHeight: 1.7,
    color: '#374151',
  },
  empty: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  paragraph: {
    margin: '0 0 12px 0',
    lineHeight: 1.7,
  },
  h1: { fontSize: '2rem', fontWeight: 700, margin: '24px 0 12px 0', color: '#111827' },
  h2: { fontSize: '1.5rem', fontWeight: 700, margin: '20px 0 10px 0', color: '#111827' },
  h3: { fontSize: '1.25rem', fontWeight: 600, margin: '16px 0 8px 0', color: '#111827' },
  h4: { fontSize: '1.1rem', fontWeight: 600, margin: '14px 0 6px 0', color: '#111827' },
  h5: { fontSize: '1rem', fontWeight: 600, margin: '12px 0 6px 0', color: '#111827' },
  h6: { fontSize: '0.875rem', fontWeight: 600, margin: '10px 0 4px 0', color: '#111827' },
  list: {
    margin: '0 0 12px 0',
    paddingLeft: '24px',
  },
  listItem: {
    marginBottom: '4px',
  },
  quote: {
    margin: '0 0 12px 0',
    paddingLeft: '16px',
    borderLeft: '3px solid #d1d5db',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  code: {
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.875em',
    fontFamily: 'monospace',
  },
};
