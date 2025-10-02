// ============================================================================
// ProjectCard Custom Block
// ============================================================================
// A custom BlockNote block that displays a project card with:
// - Title and optional cover image in collapsed state
// - Modal with nested BlockNote editor for detailed project information
// - Click-to-expand interaction pattern
//
// This demonstrates BlockNote's custom block API and nested editor capabilities.
// ============================================================================

"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import "@blocknote/mantine/style.css";

// ============================================================================
// Block Configuration
// ============================================================================

/**
 * ProjectCard Block Specification
 *
 * Defines a custom block type for displaying project portfolio items.
 * Each card can have a title and cover image, and clicking it opens a modal
 * with a full BlockNote editor for detailed project content.
 *
 * Block Structure:
 * - type: "projectCard" - Unique identifier for this block type
 * - content: "none" - This block doesn't contain inline content
 * - propSchema: Defines the data structure for block properties
 */
export const ProjectCard = createReactBlockSpec(
  // --------------------------------------------------------------------------
  // Block Configuration Object
  // --------------------------------------------------------------------------
  {
    type: "projectCard", // Unique block type identifier
    content: "none", // No inline content (not a text-based block)

    /**
     * Property Schema
     * Defines the structure and default values for block properties.
     * These properties are stored in the editor's document structure.
     */
    propSchema: {
      title: {
        default: "New Project", // Default title for new project cards
      },
      coverImage: {
        default: "", // Default to no cover image
      },
      nestedContent: {
        default: "", // Stores serialized nested editor content as JSON string
      },
    },
  },
  // --------------------------------------------------------------------------
  // Render Implementation
  // --------------------------------------------------------------------------
  {
    /**
     * Render Function
     *
     * Defines how the block appears in the editor and handles user interactions.
     *
     * @param {Object} params - Render parameters
     * @param {Object} params.block - The block instance with props and content
     * @param {Object} params.editor - The parent BlockNote editor instance
     * @returns {JSX.Element} The rendered block component
     */
    render: ({ block, editor }) => {
      // ----------------------------------------------------------------------
      // State Management
      // ----------------------------------------------------------------------
      // Track whether the modal is open or closed
      const [open, setOpen] = useState(false);

      // Use ref to track if we're currently updating to prevent recursive updates
      const isUpdatingRef = useRef(false);

      // ----------------------------------------------------------------------
      // Nested Editor Setup with Persistence
      // ----------------------------------------------------------------------
      /**
       * Parse nested content from block props, or use default initial content.
       * The content is stored as a JSON string in block.props.nestedContent.
       *
       * This function safely parses the content and validates it's an array.
       */
      const getInitialNestedContent = () => {
        if (
          block.props.nestedContent &&
          block.props.nestedContent.trim() !== ""
        ) {
          try {
            const parsed = JSON.parse(block.props.nestedContent);

            // Validate it's an array and not empty
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            } else {
              console.warn(
                "⚠️ Nested content is not a valid array, using default"
              );
              return getDefaultNestedContent(block.props.title);
            }
          } catch (e) {
            console.error("Failed to parse nested content:", e);
            return getDefaultNestedContent(block.props.title);
          }
        }
        return getDefaultNestedContent(block.props.title);
      };

      /**
       * Create a nested BlockNote editor for the modal.
       * Only create the editor when modal is open to avoid stale state issues.
       */
      const nestedEditor = useCreateBlockNote(
        open
          ? {
              initialContent: getInitialNestedContent(),
            }
          : undefined
      );

      /**
       * Sync nested editor changes back to parent editor's block props.
       * This enables content persistence across page reloads.
       * Uses a ref to prevent infinite update loops.
       */
      useEffect(() => {
        if (!nestedEditor || !open) return;

        const unsubscribe = nestedEditor.onChange(() => {
          // Prevent recursive updates
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;

          try {
            const document = nestedEditor.document;

            // Extract title from first heading (if exists)
            const firstBlock = document[0];
            const newTitle =
              firstBlock?.type === "heading" && firstBlock.content
                ? extractTextContent(firstBlock.content)
                : block.props.title;

            // Find first image for cover
            const newCoverImage = findFirstImage(document);

            // Serialize document to JSON string
            const serializedContent = JSON.stringify(document);

            // Update parent block props with new data
            editor.updateBlock(block, {
              props: {
                title: newTitle || "New Project",
                coverImage: newCoverImage || block.props.coverImage,
                nestedContent: serializedContent,
              },
            });
          } catch (e) {
            console.error("Failed to sync nested editor content:", e);
          } finally {
            // Reset the flag after a short delay to allow the update to complete
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 100);
          }
        });

        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      }, [nestedEditor, editor, block, open]);

      // ----------------------------------------------------------------------
      // Component Render
      // ----------------------------------------------------------------------
      return (
        <>
          {/* ==============================================================
               Card Preview (Collapsed State)
               ============================================================== 
               Displays a compact card showing the project title and cover image.
               Clicking anywhere on the card opens the modal for editing.
          */}
          <div
            className="border rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition"
            onClick={() => setOpen(true)}
          >
            {/* Cover Image or Placeholder */}
            {block.props.coverImage ? (
              <img
                src={block.props.coverImage}
                alt="cover"
                className="w-full h-40 object-cover rounded-md mb-2"
              />
            ) : (
              // Show placeholder when no image is set
              <div className="w-full h-40 bg-gray-200 rounded-md mb-2 flex items-center justify-center text-gray-500">
                No image
              </div>
            )}

            {/* Project Title */}
            <h3 className="text-lg font-semibold">{block.props.title}</h3>
          </div>

          {/* ==============================================================
               Modal (Expanded State)
               ============================================================== 
               Full-screen modal containing a nested BlockNote editor.
               Users can write detailed project information here.
               
               Future Enhancement: Consider saving nested editor content
               back to block.props for persistence.
          */}
          {open && (
            // Modal Overlay - clicking outside could close modal
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              {/* Modal Content Container */}
              <div className="bg-white rounded-lg shadow-lg w-[90%] h-[90%] flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b p-4">
                  <h2 className="text-xl font-semibold">{block.props.title}</h2>
                  {/* Close Button */}
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-black"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body - Nested Editor */}
                <div className="flex-1 overflow-auto p-4">
                  {/* Nested BlockNote editor with full functionality */}
                  {nestedEditor ? (
                    <BlockNoteView editor={nestedEditor} theme="light" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Loading editor...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      );
    },
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Returns default nested editor content structure.
 *
 * @param {string} title - The project title to use in the heading
 * @returns {any[]} Array of BlockNote blocks for initial content
 */
function getDefaultNestedContent(title: string): any[] {
  return [
    {
      type: "heading",
      content: title || "Project Title",
    },
    {
      type: "paragraph",
      content: "Start writing project details here...",
    },
  ];
}

/**
 * Extracts plain text content from BlockNote inline content.
 *
 * BlockNote stores text as inline content objects. This function
 * recursively extracts the text strings.
 *
 * @param {any} content - BlockNote inline content (string or array)
 * @returns {string} Extracted text content
 */
function extractTextContent(content: any): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item.type === "text" && item.text) return item.text;
        if (item.content) return extractTextContent(item.content);
        return "";
      })
      .join("");
  }
  return "";
}

/**
 * Recursively searches through a BlockNote document structure to find the
 * first image block and extract its URL.
 *
 * This utility function traverses the document tree depth-first, checking each
 * node for image blocks. It handles nested content structures (like lists
 * containing images) by recursively searching child nodes.
 *
 * @param {any[]} doc - Array of BlockNote block objects to search through
 * @returns {string} The URL of the first image found, or empty string if none found
 *
 * @example
 * const doc = [
 *   { type: "paragraph", content: "Hello" },
 *   { type: "image", props: { url: "cover.jpg" } }
 * ];
 * findFirstImage(doc); // Returns "cover.jpg"
 */
function findFirstImage(doc: any[]): string {
  // Iterate through each block in the document
  for (const node of doc) {
    // Check if current node is an image block with a URL
    if (node.type === "image" && node.props?.url) {
      return node.props.url;
    }

    // If node has nested content (e.g., list items), search recursively
    if (node.content && Array.isArray(node.content)) {
      const nested = findFirstImage(node.content);
      if (nested) return nested; // Return first image found in nested content
    }
  }

  // No image found in this document branch
  return "";
}
