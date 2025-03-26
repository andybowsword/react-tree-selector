"use client";

import React from "react";
import { useState } from "react";

import {
  type TreeNode,
  TreeMultiSelector,
} from "@/components/ui/tree-multi-selector";

// --- Sample Data for the Tree ---
const treeData: TreeNode[] = [
  {
    id: "fruits",
    label: "Fruits",
    children: [
      // Level 2
      { id: "apple", label: "Apple" },
      { id: "banana", label: "Banana" },
      {
        id: "citrus",
        label: "Citrus",
        children: [
          // Level 3
          { id: "orange", label: "Orange" },
          { id: "lemon", label: "Lemon" },
          {
            id: "grapefruit",
            label: "Grapefruit",
            children: [
              // Level 4
              { id: "pink-grapefruit", label: "Pink Grapefruit" },
              { id: "white-grapefruit", label: "White Grapefruit" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "vegetables",
    label: "Vegetables",
    children: [
      // Level 2
      { id: "carrot", label: "Carrot" },
      { id: "broccoli", label: "Broccoli" },
      { id: "spinach", label: "Spinach" },
    ],
  },
  // Node without children
  {
    id: "dairy",
    label: "Dairy (No Children)",
  },
];

const initSelection = ["apple", "lemon", "carrot"];

export function TreeMultiSelectorDemo() {
  // State to hold the selected node IDs from the tree
  const [selectedNodes, setSelectedNodes] = useState<string[]>(
    // Initialize with pre-selected nested nodes
    initSelection
  );

  const handleSelectionChange = (newSelectedIds: string[]) => {
    console.log("Showcase Page - Selected IDs:", newSelectedIds);
    setSelectedNodes(newSelectedIds);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Tree Selector Column */}
      <div className="w-full md:w-1/2 lg:w-1/3">
        <h2 className="text-xl font-semibold mb-4">Component Demo</h2>
        <TreeMultiSelector
          data={treeData}
          initialSelectedIds={selectedNodes} // Pass initial selection
          onChange={handleSelectionChange} // Handle selection changes
          className="border rounded-md p-4 bg-background" // Add some default styling
        />
      </div>

      {/* Selected Items Display Column */}
      <div className="w-full md:w-1/2 lg:w-2/3 mt-8 md:mt-0">
        <h2 className="text-xl font-semibold mb-4">Selected Node IDs</h2>
        <div className="p-4 border rounded-md bg-muted/50 min-h-[100px]">
          {selectedNodes.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {Array.from(selectedNodes)
                .sort()
                .map(
                  (
                    id // Sort for consistent display
                  ) => (
                    <li key={id}>
                      <code>{id}</code>
                    </li>
                  )
                )}
            </ul>
          ) : (
            <p className="text-muted-foreground italic">No nodes selected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
