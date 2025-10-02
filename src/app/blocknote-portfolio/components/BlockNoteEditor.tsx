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

// BlockNote schema and block specifications
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { ProjectCard } from "./blocks/ProjectCard";

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
  // Editor Instance Creation
  // --------------------------------------------------------------------------
  // Initialize the BlockNote editor with our custom schema and initial content.
  // The editor instance is created once and remains stable across re-renders.
  const editor = useCreateBlockNote({
    schema, // Use our extended schema with custom blocks
    initialContent: [
      { type: "paragraph", content: "Press '/' and type: project" },
      { type: "paragraph", content: "" },
    ],
  });

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
    <div className="min-h-[400px]">
      {/* 
        BlockNoteView renders the editor UI with the following configuration:
        - slashMenu={false}: Disables the default slash menu
        - theme="light": Uses light theme styling
        - className="prose max-w-none": Applies Tailwind typography styles
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
  );
}
