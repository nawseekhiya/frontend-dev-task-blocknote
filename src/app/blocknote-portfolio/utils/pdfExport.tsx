// ============================================================================
// PDF Export Utility
// ============================================================================
// Converts BlockNote editor content to PDF format using @react-pdf/renderer
// Handles different block types including custom ProjectCard blocks
// ============================================================================

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  Font,
} from "@react-pdf/renderer";

// ============================================================================
// PDF Styles
// ============================================================================

/**
 * Stylesheet for PDF document
 * Defines consistent styling for all block types
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  heading1: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 16,
    color: "#1a1a1a",
  },
  heading2: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 14,
    color: "#2a2a2a",
  },
  heading3: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
    color: "#3a3a3a",
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 8,
    color: "#4a4a4a",
    textAlign: "justify",
  },
  bulletList: {
    marginLeft: 20,
    marginBottom: 8,
  },
  numberedList: {
    marginLeft: 20,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 4,
    flexDirection: "row",
  },
  listItemBullet: {
    width: 15,
    fontSize: 12,
  },
  listItemText: {
    flex: 1,
  },
  image: {
    marginVertical: 12,
    maxWidth: "100%",
    maxHeight: 300,
    objectFit: "contain",
  },
  codeBlock: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    marginVertical: 8,
    fontFamily: "Courier",
    fontSize: 10,
    borderRadius: 4,
    border: "1px solid #e0e0e0",
  },
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    paddingLeft: 16,
    marginVertical: 12,
    fontStyle: "italic",
    color: "#6b7280",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 16,
  },
  projectCard: {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    backgroundColor: "#f9fafb",
  },
  projectCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
  },
  projectCardImage: {
    marginTop: 8,
    maxWidth: "100%",
    maxHeight: 200,
    objectFit: "cover",
    borderRadius: 4,
  },
  projectCardContent: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#4b5563",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "underline",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecoration: "underline",
  },
  strikethrough: {
    textDecoration: "line-through",
  },
  code: {
    fontFamily: "Courier",
    backgroundColor: "#f5f5f5",
    padding: 2,
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts plain text from BlockNote inline content
 * Handles both string content and structured inline content arrays
 *
 * @param {any} content - BlockNote inline content
 * @returns {string} Extracted plain text
 */
function extractTextContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item.type === "text" && item.text) return item.text;
        if (item.type === "link" && item.content) {
          return extractTextContent(item.content);
        }
        if (item.content) return extractTextContent(item.content);
        return "";
      })
      .join("");
  }
  return "";
}

/**
 * Renders inline content with styling (bold, italic, etc.)
 * Converts BlockNote inline content to PDF Text components
 *
 * @param {any} content - BlockNote inline content
 * @returns {React.ReactNode} PDF Text components with styles
 */
function renderInlineContent(content: any): React.ReactNode {
  if (!content) return null;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item, index) => {
      if (!item) return null;
      if (typeof item === "string") return <Text key={index}>{item}</Text>;

      // Handle text with styles
      if (item.type === "text") {
        const textStyle: Record<string, any> = {};
        
        // Check if styles object exists and has actual properties
        const hasStyles = item.styles && typeof item.styles === 'object' && Object.keys(item.styles).length > 0;
        
        if (hasStyles) {
          try {
            if (item.styles.bold === true) {
              textStyle.fontWeight = "bold";
            }
            if (item.styles.italic === true) {
              textStyle.fontStyle = "italic";
            }
            if (item.styles.underline === true) {
              textStyle.textDecoration = "underline";
            }
            if (item.styles.strikethrough === true) {
              textStyle.textDecoration = "line-through";
            }
            if (item.styles.code === true) {
              textStyle.fontFamily = "Courier";
              textStyle.backgroundColor = "#f5f5f5";
              textStyle.padding = 2;
              textStyle.fontSize = 10;
            }
          } catch (e) {
            console.warn("Error applying text styles:", e);
          }
        }

        // Only pass style prop if we have styles to apply
        const styleProps = Object.keys(textStyle).length > 0 ? { style: textStyle } : {};

        return (
          <Text key={index} {...styleProps}>
            {item.text || ""}
          </Text>
        );
      }

      // Handle links
      if (item.type === "link") {
        const href = item.href && typeof item.href === 'string' ? item.href : "#";
        return (
          <Link key={index} src={href} style={styles.link}>
            {renderInlineContent(item.content)}
          </Link>
        );
      }

      return null;
    });
  }
  return content;
}

/**
 * Finds the first image URL in a document tree
 * Used for ProjectCard cover images
 *
 * @param {any[]} doc - BlockNote document array
 * @returns {string} First image URL found, or empty string
 */
function findFirstImage(doc: any[]): string {
  if (!Array.isArray(doc)) return "";
  for (const node of doc) {
    if (node.type === "image" && node.props?.url) {
      return node.props.url;
    }
    if (node.content && Array.isArray(node.content)) {
      const nested = findFirstImage(node.content);
      if (nested) return nested;
    }
  }
  return "";
}

// ============================================================================
// Block Renderers
// ============================================================================

/**
 * Renders a single BlockNote block as PDF component
 *
 * @param {any} block - BlockNote block object
 * @param {number} index - Block index for React key
 * @param {number} listIndex - Current index in numbered list (optional)
 * @returns {React.ReactNode} PDF component(s) for the block
 */
function renderBlock(
  block: any,
  index: number,
  listIndex?: number
): React.ReactNode {
  if (!block || !block.type) return null;

  switch (block.type) {
    case "heading": {
      const level = block.props?.level || 1;
      const headingStyle =
        level === 1
          ? styles.heading1
          : level === 2
          ? styles.heading2
          : styles.heading3;
      return (
        <Text key={index} style={headingStyle}>
          {renderInlineContent(block.content)}
        </Text>
      );
    }

    case "paragraph": {
      const text = extractTextContent(block.content);
      if (!text.trim()) return <View key={index} style={{ height: 8 }} />;
      return (
        <Text key={index} style={styles.paragraph}>
          {renderInlineContent(block.content)}
        </Text>
      );
    }

    case "bulletListItem": {
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listItemBullet}>•</Text>
          <View style={styles.listItemText}>
            <Text>{renderInlineContent(block.content)}</Text>
            {block.children &&
              block.children.map((child: any, idx: number) =>
                renderBlock(child, idx)
              )}
          </View>
        </View>
      );
    }

    case "numberedListItem": {
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listItemBullet}>{(listIndex || 0) + 1}.</Text>
          <View style={styles.listItemText}>
            <Text>{renderInlineContent(block.content)}</Text>
            {block.children &&
              block.children.map((child: any, idx: number) =>
                renderBlock(child, idx)
              )}
          </View>
        </View>
      );
    }

    case "image": {
      const url = block.props?.url;
      if (!url) return null;
      return (
        <View key={index}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={url} style={styles.image} />
          {block.props?.caption && (
            <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
              {block.props.caption}
            </Text>
          )}
        </View>
      );
    }

    case "codeBlock": {
      const code = extractTextContent(block.content);
      return (
        <View key={index} style={styles.codeBlock}>
          <Text style={{ fontFamily: "Courier" }}>{code}</Text>
        </View>
      );
    }

    case "quote": {
      return (
        <View key={index} style={styles.quote}>
          <Text>{renderInlineContent(block.content)}</Text>
        </View>
      );
    }

    case "divider": {
      return <View key={index} style={styles.divider} />;
    }

    case "projectCard": {
      try {
        const title = block.props?.title || "Untitled Project";
        const coverImage = block.props?.coverImage;
        let nestedContent = null;

        // Parse nested content if available
        if (block.props?.nestedContent) {
          try {
            const parsed = JSON.parse(block.props.nestedContent);
            if (Array.isArray(parsed)) {
              // Filter out invalid blocks
              nestedContent = parsed.filter(
                (b) => b && typeof b === "object" && b.type
              );
            }
          } catch (e) {
            console.warn("Failed to parse nested content for ProjectCard:", e);
          }
        }

        return (
          <View key={index} style={styles.projectCard}>
            <Text style={styles.projectCardTitle}>{title}</Text>
            {coverImage && typeof coverImage === "string" && coverImage.trim() && (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image src={coverImage} style={styles.projectCardImage} />
            )}
            {nestedContent && nestedContent.length > 0 && (
              <View style={styles.projectCardContent}>
                {nestedContent.map((nestedBlock: any, idx: number) => {
                  try {
                    return renderBlock(nestedBlock, idx);
                  } catch (err) {
                    console.warn(`Error rendering nested block ${idx}:`, err);
                    return null;
                  }
                })}
              </View>
            )}
          </View>
        );
      } catch (e) {
        console.error("Error rendering ProjectCard:", e);
        return (
          <View key={index} style={styles.projectCard}>
            <Text style={styles.projectCardTitle}>Error rendering project card</Text>
          </View>
        );
      }
    }

    default:
      // Handle unknown block types gracefully
      const text = extractTextContent(block.content);
      if (text.trim()) {
        return (
          <Text key={index} style={styles.paragraph}>
            {text}
          </Text>
        );
      }
      return null;
  }
}

// ============================================================================
// Main PDF Document Component
// ============================================================================

/**
 * PDF Document Component
 * Renders the complete BlockNote document as a PDF
 *
 * @param {Object} props - Component props
 * @param {any[]} props.document - BlockNote document array
 * @param {string} props.title - Document title (optional)
 * @returns {JSX.Element} PDF Document component
 */
export function PDFDocument({
  document,
  title = "BlockNote Document",
}: {
  document: any[];
  title?: string;
}) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group numbered list items together
  const processedBlocks: any[] = [];
  let numberedListItems: any[] = [];

  document.forEach((block, index) => {
    if (block.type === "numberedListItem") {
      numberedListItems.push(block);
    } else {
      // Flush accumulated numbered list items
      if (numberedListItems.length > 0) {
        processedBlocks.push({
          type: "numberedList",
          items: numberedListItems,
        });
        numberedListItems = [];
      }
      processedBlocks.push(block);
    }
  });

  // Flush any remaining numbered list items
  if (numberedListItems.length > 0) {
    processedBlocks.push({
      type: "numberedList",
      items: numberedListItems,
    });
  }

  return (
    <Document
      title={title}
      author="BlockNote Portfolio"
      subject="Exported from BlockNote Editor"
      keywords="blocknote, portfolio, export"
    >
      <Page size="A4" style={styles.page}>
        {/* Document Title */}
        <Text style={[styles.heading1, { marginTop: 0, marginBottom: 24 }]}>
          {title}
        </Text>

        {/* Content */}
        {processedBlocks.map((block, index) => {
          if (block.type === "numberedList") {
            return (
              <View key={index} style={styles.numberedList}>
                {block.items.map((item: any, itemIndex: number) =>
                  renderBlock(item, itemIndex, itemIndex)
                )}
              </View>
            );
          }
          return renderBlock(block, index);
        })}

        {/* Footer with date */}
        <View style={styles.footer} fixed>
          <Text>
            Exported on {currentDate} • Generated by BlockNote Portfolio
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Export Options Interface
 */
export interface ExportOptions {
  filename?: string;
  title?: string;
}

/**
 * Default export options
 */
export const defaultExportOptions: ExportOptions = {
  filename: "blocknote-document.pdf",
  title: "BlockNote Document",
};
