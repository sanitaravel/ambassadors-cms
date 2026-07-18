/**
 * Conversion utilities between TipTap editor JSON and Strapi v5 Blocks format.
 *
 * Strapi Blocks format uses a tree structure:
 * - Paragraphs: { type: "paragraph", children: [{ type: "text", text: "...", bold?: true, italic?: true }] }
 * - Headings: { type: "heading", level: 2, children: [...] }
 * - Lists: { type: "list", format: "ordered"|"unordered", children: [{ type: "list-item", children: [...] }] }
 * - Quotes: { type: "quote", children: [...] }
 */

// -- Strapi Block Types --

export interface StrapiTextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface StrapiParagraphBlock {
  type: 'paragraph';
  children: StrapiTextNode[];
}

export interface StrapiHeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: StrapiTextNode[];
}

export interface StrapiListItemBlock {
  type: 'list-item';
  children: StrapiTextNode[];
}

export interface StrapiListBlock {
  type: 'list';
  format: 'ordered' | 'unordered';
  children: StrapiListItemBlock[];
}

export interface StrapiQuoteBlock {
  type: 'quote';
  children: StrapiTextNode[];
}

export type StrapiBlock =
  | StrapiParagraphBlock
  | StrapiHeadingBlock
  | StrapiListBlock
  | StrapiQuoteBlock;

// -- TipTap JSON Types (simplified) --

interface TipTapMark {
  type: string;
}

interface TipTapNode {
  type: string;
  text?: string;
  marks?: TipTapMark[];
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
}

interface TipTapDoc {
  type: 'doc';
  content: TipTapNode[];
}

// -- Conversion: TipTap → Strapi --

export function editorJsonToStrapiBlocks(doc: TipTapDoc | Record<string, unknown>): StrapiBlock[] {
  const content = (doc as TipTapDoc).content;
  if (!content || !Array.isArray(content)) return [];

  const blocks: StrapiBlock[] = [];

  for (const node of content) {
    const converted = convertTipTapNodeToStrapi(node);
    if (converted) {
      blocks.push(...converted);
    }
  }

  return blocks;
}

function convertTipTapNodeToStrapi(node: TipTapNode): StrapiBlock[] | null {
  switch (node.type) {
    case 'paragraph':
      return [{ type: 'paragraph', children: extractTextChildren(node) }];

    case 'heading': {
      const level = (node.attrs?.level as number) || 2;
      return [{
        type: 'heading',
        level: Math.min(Math.max(level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6,
        children: extractTextChildren(node),
      }];
    }

    case 'bulletList':
      return [{
        type: 'list',
        format: 'unordered',
        children: extractListItems(node),
      }];

    case 'orderedList':
      return [{
        type: 'list',
        format: 'ordered',
        children: extractListItems(node),
      }];

    case 'blockquote': {
      // Blockquote in TipTap contains paragraphs; flatten to text children
      const children: StrapiTextNode[] = [];
      for (const child of node.content || []) {
        if (child.type === 'paragraph') {
          children.push(...extractTextChildren(child));
        }
      }
      return [{ type: 'quote', children }];
    }

    default:
      // Unsupported nodes treated as paragraphs
      if (node.content) {
        return [{ type: 'paragraph', children: extractTextChildren(node) }];
      }
      return null;
  }
}

function extractTextChildren(node: TipTapNode): StrapiTextNode[] {
  if (!node.content || node.content.length === 0) {
    return [{ type: 'text', text: '' }];
  }

  return node.content.map((child) => {
    const textNode: StrapiTextNode = {
      type: 'text',
      text: child.text || '',
    };

    if (child.marks) {
      for (const mark of child.marks) {
        if (mark.type === 'bold') textNode.bold = true;
        if (mark.type === 'italic') textNode.italic = true;
        if (mark.type === 'strike') textNode.strikethrough = true;
        if (mark.type === 'code') textNode.code = true;
      }
    }

    return textNode;
  });
}

function extractListItems(node: TipTapNode): StrapiListItemBlock[] {
  if (!node.content) return [];

  return node.content.map((listItem) => {
    // TipTap list items contain paragraphs
    const children: StrapiTextNode[] = [];
    for (const child of listItem.content || []) {
      if (child.type === 'paragraph') {
        children.push(...extractTextChildren(child));
      }
    }
    return { type: 'list-item' as const, children };
  });
}

// -- Conversion: Strapi → TipTap --

export function strapiBlocksToEditorJson(blocks: StrapiBlock[]): TipTapDoc {
  const content: TipTapNode[] = [];

  for (const block of blocks) {
    const node = convertStrapiBlockToTipTap(block);
    if (node) content.push(node);
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] });
  }

  return { type: 'doc', content };
}

function convertStrapiBlockToTipTap(block: StrapiBlock): TipTapNode | null {
  switch (block.type) {
    case 'paragraph':
      return { type: 'paragraph', content: strapiTextToTipTap(block.children) };

    case 'heading':
      return {
        type: 'heading',
        attrs: { level: block.level },
        content: strapiTextToTipTap(block.children),
      };

    case 'list': {
      const listType = block.format === 'ordered' ? 'orderedList' : 'bulletList';
      return {
        type: listType,
        content: block.children.map((item) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: strapiTextToTipTap(item.children) }],
        })),
      };
    }

    case 'quote':
      return {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: strapiTextToTipTap(block.children) }],
      };

    default:
      return null;
  }
}

function strapiTextToTipTap(children: StrapiTextNode[]): TipTapNode[] {
  if (!children || children.length === 0) return [];

  return children
    .filter((child) => child.text !== '')
    .map((child) => {
      const node: TipTapNode = { type: 'text', text: child.text };
      const marks: TipTapMark[] = [];

      if (child.bold) marks.push({ type: 'bold' });
      if (child.italic) marks.push({ type: 'italic' });
      if (child.strikethrough) marks.push({ type: 'strike' });
      if (child.code) marks.push({ type: 'code' });

      if (marks.length > 0) node.marks = marks;
      return node;
    });
}
