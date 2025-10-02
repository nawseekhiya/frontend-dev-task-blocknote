// ============================================================================
// Storage Utility
// ============================================================================
// Provides functions to save and load BlockNote editor content to/from
// localStorage. Handles serialization and deserialization of the complete
// document structure, including custom ProjectCard blocks with nested content.
// ============================================================================

/**
 * Storage key for the editor content in localStorage
 */
const STORAGE_KEY = "blocknote-portfolio-content";

/**
 * Saves the complete BlockNote editor document to localStorage.
 * 
 * The document is serialized to JSON and stored persistently. This includes
 * all blocks, their properties, and any custom block data (like ProjectCard
 * nested content).
 * 
 * @param {any[]} document - The BlockNote document array to save
 * @returns {boolean} True if save was successful, false otherwise
 * 
 * @example
 * const document = editor.document;
 * const success = saveEditorContent(document);
 * if (success) {
 *   console.log("Content saved successfully");
 * }
 */
export function saveEditorContent(document: any[]): boolean {
  try {
    const serialized = JSON.stringify(document);
    localStorage.setItem(STORAGE_KEY, serialized);
    console.log("✅ Editor content saved to localStorage");
    return true;
  } catch (error) {
    console.error("❌ Failed to save editor content:", error);
    return false;
  }
}

/**
 * Loads the BlockNote editor document from localStorage.
 * 
 * Retrieves the previously saved document and deserializes it back into
 * the BlockNote document structure. Returns null if no saved content exists.
 * 
 * @returns {any[] | null} The loaded document array, or null if not found
 * 
 * @example
 * const savedContent = loadEditorContent();
 * const editor = useCreateBlockNote({
 *   initialContent: savedContent || defaultContent
 * });
 */
export function loadEditorContent(): any[] | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      console.log("ℹ️ No saved editor content found");
      return null;
    }
    const document = JSON.parse(serialized);
    
    // Validate that the loaded data is an array
    if (!Array.isArray(document)) {
      console.error("❌ Loaded content is not an array, clearing corrupted data");
      clearEditorContent();
      return null;
    }
    
    // Validate that the array is not empty
    if (document.length === 0) {
      console.warn("⚠️ Loaded content is an empty array");
      return null;
    }
    
    console.log("✅ Editor content loaded from localStorage");
    return document;
  } catch (error) {
    console.error("❌ Failed to load editor content:", error);
    // Clear corrupted data
    clearEditorContent();
    return null;
  }
}

/**
 * Clears the saved editor content from localStorage.
 * 
 * Useful for resetting the editor to a clean state or for implementing
 * a "clear all" feature.
 * 
 * @returns {boolean} True if clear was successful, false otherwise
 * 
 * @example
 * if (clearEditorContent()) {
 *   console.log("Content cleared, editor reset");
 * }
 */
export function clearEditorContent(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("✅ Editor content cleared from localStorage");
    return true;
  } catch (error) {
    console.error("❌ Failed to clear editor content:", error);
    return false;
  }
}

/**
 * Checks if there is saved editor content in localStorage.
 * 
 * @returns {boolean} True if saved content exists, false otherwise
 */
export function hasSavedContent(): boolean {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized !== null && serialized.trim() !== "";
  } catch (error) {
    return false;
  }
}
