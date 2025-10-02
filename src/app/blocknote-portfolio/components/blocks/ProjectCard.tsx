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
      subtext: {
        default: "Project description", // Default subtext/description
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
    render: function Render({ block, editor }) {
      // ----------------------------------------------------------------------
      // State Management
      // ----------------------------------------------------------------------
      // Track whether the modal is open or closed
      const [open, setOpen] = useState(false);

      // Track whether we're in edit mode for title/subtext (card view)
      const [isEditing, setIsEditing] = useState(false);

      // Track whether we're in edit mode for title in modal
      const [isEditingModalTitle, setIsEditingModalTitle] = useState(false);

      // Local state for editing title and subtext
      const [editTitle, setEditTitle] = useState(block.props.title);
      const [editSubtext, setEditSubtext] = useState(block.props.subtext);

      // Local state for editing title in modal
      const [editModalTitle, setEditModalTitle] = useState(block.props.title);

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

            // Find first image for cover (update cover image automatically)
            const newCoverImage = findFirstImage(document);

            // Serialize document to JSON string
            const serializedContent = JSON.stringify(document);

            // Update parent block props with new data
            // Note: We keep the existing title and subtext as they are manually editable
            // Only update the nested content and cover image automatically
            editor.updateBlock(block, {
              props: {
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
      // Handler Functions
      // ----------------------------------------------------------------------

      /**
       * Handle card click - open modal only if not in edit mode
       */
      const handleCardClick = () => {
        if (!isEditing) {
          setOpen(true);
        }
      };

      /**
       * Save edited title and subtext
       */
      const handleSaveEdit = () => {
        editor.updateBlock(block, {
          props: {
            title: editTitle || "New Project",
            subtext: editSubtext || "Project description",
          },
        });
        setIsEditing(false);
      };

      /**
       * Cancel editing and revert to original values
       */
      const handleCancelEdit = () => {
        setEditTitle(block.props.title);
        setEditSubtext(block.props.subtext);
        setIsEditing(false);
      };

      /**
       * Enter edit mode
       */
      const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        setIsEditing(true);
      };

      /**
       * Enter edit mode for modal title
       */
      const handleEditModalTitle = () => {
        setEditModalTitle(block.props.title);
        setIsEditingModalTitle(true);
      };

      /**
       * Save edited modal title
       */
      const handleSaveModalTitle = () => {
        editor.updateBlock(block, {
          props: {
            title: editModalTitle || "New Project",
          },
        });
        setIsEditingModalTitle(false);
      };

      /**
       * Cancel editing modal title and revert to original value
       */
      const handleCancelModalTitle = () => {
        setEditModalTitle(block.props.title);
        setIsEditingModalTitle(false);
      };

      /**
       * Handle Enter key to save modal title
       */
      const handleModalTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSaveModalTitle();
        } else if (e.key === "Escape") {
          handleCancelModalTitle();
        }
      };

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
            className="border rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition relative"
            onClick={handleCardClick}
          >
            {/* Edit Button - Top Right Corner */}
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition z-10"
                aria-label="Edit title and description"
                title="Edit title and description"
              >
                ✏️
              </button>
            )}

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

            {/* Editable Title and Subtext */}
            {isEditing ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-lg font-semibold border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project title"
                  autoFocus
                />
                <input
                  type="text"
                  value={editSubtext}
                  onChange={(e) => setEditSubtext(e.target.value)}
                  className="w-full text-sm text-gray-600 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project description"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Project Title */}
                <h3 className="text-lg font-semibold">{block.props.title}</h3>
                {/* Project Subtext */}
                <p className="text-sm text-gray-600 mt-1">
                  {block.props.subtext}
                </p>
              </>
            )}
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
                  {/* Editable Title in Modal */}
                  {isEditingModalTitle ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editModalTitle}
                        onChange={(e) => setEditModalTitle(e.target.value)}
                        onKeyDown={handleModalTitleKeyDown}
                        className="flex-1 text-xl font-semibold border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Project title"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveModalTitle}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        title="Save title"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelModalTitle}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <h2 className="text-xl font-semibold">
                        {block.props.title}
                      </h2>
                      <button
                        onClick={handleEditModalTitle}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        aria-label="Edit project title"
                        title="Edit project title"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                  {/* Close Button */}
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-black ml-4"
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
