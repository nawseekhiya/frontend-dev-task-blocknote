// ============================================================================
// Debug Helper Component
// ============================================================================
// Temporary component to help debug and fix localStorage issues
// Add this to your page to get a "Fix Storage" button
// ============================================================================

"use client";

import { useEffect, useState } from "react";

export function DebugHelper() {
  const [storageInfo, setStorageInfo] = useState<string>("");

  useEffect(() => {
    // Check localStorage status
    try {
      const stored = localStorage.getItem("blocknote-portfolio-content");
      if (!stored) {
        setStorageInfo("No saved content found");
      } else {
        const parsed = JSON.parse(stored);
        setStorageInfo(
          `Type: ${typeof parsed}, IsArray: ${Array.isArray(parsed)}, Length: ${
            Array.isArray(parsed) ? parsed.length : "N/A"
          }`
        );
      }
    } catch (e) {
      setStorageInfo(`Error: ${e}`);
    }
  }, []);

  const clearStorage = () => {
    localStorage.clear();
    alert("✅ localStorage cleared! Reloading page...");
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-yellow-900 mb-2">🔧 Debug Helper</h3>
      <p className="text-sm text-yellow-800 mb-2">
        <strong>Storage:</strong> {storageInfo}
      </p>
      <button
        onClick={clearStorage}
        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
      >
        🗑️ Clear Storage & Reload
      </button>
      <p className="text-xs text-yellow-700 mt-2">
        Use this if you see "Cannot read properties of undefined" error
      </p>
    </div>
  );
}
