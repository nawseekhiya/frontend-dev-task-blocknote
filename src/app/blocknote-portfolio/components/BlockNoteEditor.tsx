"use client";

// ============================================================================
// BlockNote Editor Component
// ============================================================================
// This is the main editor component that integrates BlockNote with our custom
// ProjectCard block. It demonstrates:
// 1. Schema extension with custom blocks
// 2. Custom slash menu integration
// 3. Suggestion menu controller setup
// ============================================================================

// BlockNote core styles and fonts
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

// BlockNote React hooks and utilities
import { useCreateBlockNote } from "@blocknote/react";
import {
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
} from "@blocknote/react";
import { filterSuggestionItems, insertOrUpdateBlock } from "@blocknote/core";
import { useEffect, useState } from "react";

// BlockNote schema and block specifications
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { ProjectCard } from "./blocks/ProjectCard";

// Storage utilities for persistence
import {
  saveEditorContent,
  loadEditorContent,
  clearEditorContent,
} from "../utils/storage";

/**
 * BlockNoteEditor Component
 *
 * A rich text editor built with BlockNote that includes a custom ProjectCard block.
 * Users can insert project cards through the slash menu by typing '/project'.
 *
 * @returns {JSX.Element} The BlockNote editor with custom block support
 */
export default function BlockNoteEditor() {
  // --------------------------------------------------------------------------
  // Schema Configuration
  // --------------------------------------------------------------------------
  // Extend the default BlockNote schema to include our custom ProjectCard block.
  // The schema defines all available block types and their behaviors.
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs, // Include all default blocks (paragraph, heading, etc.)
      projectCard: ProjectCard, // Add our custom ProjectCard block
    },
  });

  // --------------------------------------------------------------------------
  // Editor Instance Creation with Persistence
  // --------------------------------------------------------------------------
  // Default content to use when no saved content exists or loading fails
  const defaultContent = [
    { type: "paragraph", content: "Press '/' and type: project" },
    { type: "paragraph", content: "" },
  ];

  // Load saved content from localStorage if available, otherwise use default content.
  let savedContent = loadEditorContent();

  // Additional validation: ensure savedContent is a valid non-empty array
  if (
    savedContent &&
    (!Array.isArray(savedContent) || savedContent.length === 0)
  ) {
    console.warn("⚠️ Invalid saved content detected, using default content");
    savedContent = null;
  }

  // Initialize the BlockNote editor with our custom schema and initial content.
  // The editor instance is created once and remains stable across re-renders.
  const editor = useCreateBlockNote({
    schema, // Use our extended schema with custom blocks
    initialContent: savedContent || defaultContent,
  });

  // --------------------------------------------------------------------------
  // Auto-Save Functionality
  // --------------------------------------------------------------------------
  /**
   * Auto-save editor content to localStorage whenever it changes.
   * Debounced to avoid excessive saves during rapid typing.
   */
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;

    const handleChange = () => {
      // Debounce saves by 1 second to avoid excessive localStorage writes
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveEditorContent(editor.document);
      }, 1000);
    };

    // Subscribe to editor changes
    const unsubscribe = editor.onChange(handleChange);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [editor]);

  // --------------------------------------------------------------------------
  // Save/Load Control Functions
  // --------------------------------------------------------------------------
  /**
   * Manually save current editor content
   */
  const handleManualSave = () => {
    if (editor) {
      const success = saveEditorContent(editor.document);
      if (success) {
        alert("✅ Content saved successfully!");
      } else {
        alert("❌ Failed to save content");
      }
    }
  };

  /**
   * Clear all saved content and reset editor
   */
  const handleClear = () => {
    if (
      confirm(
        "Are you sure you want to clear all content? This cannot be undone."
      )
    ) {
      clearEditorContent();
      // Reload the page to reset the editor
      window.location.reload();
    }
  };

  // --------------------------------------------------------------------------
  // PDF Export Functionality
  // --------------------------------------------------------------------------
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export editor content to PDF
   * Uses @react-pdf/renderer to generate a PDF from the editor document
   */
  const handleExportPDF = async () => {
    if (!editor) return;

    setIsExporting(true);
    try {
      // Dynamically import PDF libraries (client-side only)
      const { pdf } = await import("@react-pdf/renderer");
      const { PDFDocument } = await import("../utils/pdfExport");

      // Get current document and sanitize it
      const rawDocument = editor.document;
      
      // Deep clone to create plain JSON objects (removes methods, symbols, etc.)
      let document;
      try {
        document = JSON.parse(JSON.stringify(rawDocument, (key, value) => {
          // Filter out undefined, functions, and symbols
          if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
            return undefined;
          }
          // Remove any keys that start with special characters or are internal
          if (typeof key === 'string' && (key.startsWith('_') || key.startsWith('$$'))) {
            return undefined;
          }
          return value;
        }));
      } catch (e) {
        throw new Error(`Failed to serialize document: ${e}`);
      }
      
      // Validate document is an array
      if (!Array.isArray(document)) {
        throw new Error("Invalid document format: expected array");
      }

      // Recursively sanitize blocks to ensure they only contain serializable data
      const sanitizeBlock = (block: any): any => {
        if (!block || typeof block !== 'object') return null;
        
        const sanitized: any = {
          type: block.type,
        };
        
        // Only include known safe properties
        if (block.id) sanitized.id = block.id;
        if (block.content) sanitized.content = Array.isArray(block.content) ? block.content : [];
        if (block.children) sanitized.children = Array.isArray(block.children) 
          ? block.children.map(sanitizeBlock).filter(Boolean)
          : [];
        if (block.props && typeof block.props === 'object') {
          sanitized.props = {};
          // Copy primitive values and strings (includes nestedContent which is stringified JSON)
          for (const [key, value] of Object.entries(block.props)) {
            if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
              sanitized.props[key] = value;
            }
          }
        }
        
        return sanitized;
      };

      // Filter and sanitize all blocks
      const validDocument = document
        .filter((block) => block && typeof block === "object" && block.type)
        .map(sanitizeBlock)
        .filter(Boolean);

      if (validDocument.length === 0) {
        alert("⚠️ No content to export. Please add some content first.");
        return;
      }

      // Log ProjectCard blocks for debugging
      const projectCards = validDocument.filter(b => b.type === 'projectCard');
      if (projectCards.length > 0) {
        console.log("ProjectCard blocks found:", projectCards.length);
        console.log("ProjectCard data:", JSON.stringify(projectCards, null, 2));
      }

      // Generate PDF document
      const pdfDoc = <PDFDocument document={validDocument} title="My Portfolio" />;

      // Create blob
      const blob = await pdf(pdfDoc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `portfolio-${new Date().toISOString().split("T")[0]}.pdf`;

      // Trigger download
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      alert("✅ PDF exported successfully!");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert(`❌ Failed to export PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Custom Slash Menu Configuration
  // --------------------------------------------------------------------------

  /**
   * Creates a custom slash menu item for inserting ProjectCard blocks.
   *
   * This function returns a menu item configuration that appears in the slash menu
   * when users type '/' followed by 'project', 'projectcard', or 'card'.
   *
   * @param {any} editorInstance - The BlockNote editor instance
   * @returns {DefaultReactSuggestionItem} The menu item configuration
   */
  const projectCardItem = (
    editorInstance: any
  ): DefaultReactSuggestionItem => ({
    title: "Project Card",
    subtext: "Create a project card (opens modal)",
    aliases: ["project", "projectcard", "card"], // Search terms that trigger this item
    group: "Blocks", // Group items together in the menu
    // When user selects this item, insert a new ProjectCard block
    onItemClick: () =>
      insertOrUpdateBlock(editorInstance, {
        type: "projectCard", // Block type must match the schema key
      }),
  });

  /**
   * Combines default slash menu items with our custom ProjectCard item.
   *
   * @param {any} editorInstance - The BlockNote editor instance
   * @returns {DefaultReactSuggestionItem[]} Complete list of slash menu items
   */
  const getCustomSlashMenuItems = (editorInstance: any) => [
    ...getDefaultReactSlashMenuItems(editorInstance), // All default items (heading, bullet list, etc.)
    projectCardItem(editorInstance), // Our custom ProjectCard item
  ];

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Control Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export content to PDF"
        >
          {isExporting ? "📄 Exporting..." : "📄 Export PDF"}
        </button>
        <button
          onClick={handleManualSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          title="Manually save current content"
        >
          💾 Save
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          title="Clear all content and reset"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Editor Container */}
      <div className="min-h-[400px]">
        {/* 
          BlockNoteView renders the editor UI with the following configuration:
          - slashMenu={false}: Disables the default slash menu
          - theme="light": Uses light theme styling
          - className="prose max-w-none": Applies Tailwind typography styles
          
          Content is automatically saved to localStorage on change (with 1s debounce)
        */}
        <BlockNoteView
          editor={editor}
          theme="light"
          className="prose max-w-none"
          slashMenu={false} // Disable default menu to use our custom one
        >
          {/* 
          SuggestionMenuController provides a custom slash menu implementation.
          It triggers when user types '/' and filters items based on their query.
          This gives us full control over menu items and behavior.
        */}
          <SuggestionMenuController
            triggerCharacter="/" // Character that opens the menu
            getItems={async (query) =>
              // Filter menu items based on user's search query
              // Searches through title, aliases, and subtext
              filterSuggestionItems(getCustomSlashMenuItems(editor), query)
            }
            // Optional: minQueryLength={1} to require text after '/'
          />
        </BlockNoteView>
      </div>
    </div>
  );
}
