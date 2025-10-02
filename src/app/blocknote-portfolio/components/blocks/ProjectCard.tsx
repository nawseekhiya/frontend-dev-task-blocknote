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

import React, { useState } from "react";
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

      // ----------------------------------------------------------------------
      // Nested Editor Setup
      // ----------------------------------------------------------------------
      /**
       * Create a nested BlockNote editor for the modal.
       * This editor is independent from the parent editor and allows users
       * to write detailed project information using all BlockNote features.
       *
       * NOTE: The editor is created on every render. In production, consider
       * memoizing this or storing content in block props to persist data.
       */
      const nestedEditor = useCreateBlockNote({
        initialContent: [
          {
            type: "heading",
            content: block.props.title || "Project Title",
          },
          {
            type: "paragraph",
            content: "Start writing project details here...",
          },
        ],
      });

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
                  <BlockNoteView editor={nestedEditor} theme="light" />
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
 *
 * @note Currently unused but kept for potential future feature:
 *       Auto-extracting cover images from nested editor content
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
