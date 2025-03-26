# React TreeMultiSelector built with shadcn/ui

A simple, minimalistic React component for displaying hierarchical data (a tree) with multi-selection capabilities using checkboxes. Built with shadcn/ui components.

**Preview:** [react-tree-multi-selector.vercel.app](https://react-tree-multi-selector.vercel.app/)

## Selection Behavior (`includeChildren` Prop)

The component offers two modes for reporting selected IDs via the `onChange` callback, controlled by the `includeChildren` prop:

- **`includeChildren={true}` (Default):**

  - The `selectedIds` array will include the ID of the selected node **plus the IDs of all its descendants**.
  - If you select a parent node, its `id` and the `id`s of all its children, grandchildren, etc., are returned.
  - This provides an exhaustive list of all individual nodes covered by the selection.

- **`includeChildren={false}`:**

  - The `selectedIds` array will **only** contain the ID of the **highest-level selected node** within any given branch.
  - If you select a parent node, only the parent's `id` is returned. Descendant `id`s are excluded.
  - This provides a concise list representing the root of each selected branch.

## Features

- Displays tree data recursively.
- Allows expanding and collapsing parent nodes.
- Supports multi-selection with checkboxes.
- Handles parent/child selection logic internally.
- Checkboxes show an indeterminate state if a node is not selected but has selected descendants.
- Provides callbacks (`onChange`) for selection changes.
- Configurable selection reporting (`includeChildren` prop).
- Automatically expands parent nodes of initially selected items.

## Installation

- **Initialize shadcn/ui (if you haven't already):**

  ```bash
  npx shadcn-ui@latest init
  ```

- **Add required shadcn/ui components:**

  ```bash
  npx shadcn-ui@latest add button checkbox # (or ensure these exist)
  ```

  _(Note: `utils` is needed for the `cn` function)_

- **Copy the Component Code:**
  Copy the `TreeMultiSelector` component code (and its associated helper functions/types) from `src/components/ui/tree-multi-selector.tsx` into your project, likely placing it in a similar path within your `components/ui` directory. Ensure the import paths within the component file match your project structure (e.g., for `@/lib/utils`, `@/components/ui/button`, etc.).

## Data Structure

The component expects data in the following `TreeNode` format:

```typescript
type TreeNode = {
  id: string; // Must be unique across the entire tree
  label: string;
  children?: TreeNode[];
};
```

## Component Props

| Prop                 | Type                              | Default     | Description                                                                                                                                  |
| :------------------- | :-------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`               | `TreeNode[]`                      | `undefined` | **Required.** The array of root nodes for the tree.                                                                                          |
| `className`          | `string`                          | `undefined` | Optional. Additional CSS classes to apply to the root container element.                                                                     |
| `initialSelectedIds` | `string[]`                        | `[]`        | Optional. An array of node IDs that should be selected initially. Behavior respects the `includeChildren` prop during initialization.        |
| `onChange`           | `(selectedIds: string[]) => void` | `undefined` | Optional. Callback function triggered when the selection changes. The output format depends on the `includeChildren` prop.                   |
| `includeChildren`    | `boolean`                         | `true`      | Optional. If `true`, `onChange` returns selected node IDs plus all their descendant IDs. If `false`, returns only the top-most selected IDs. |

## Basic Usage (Demo Example)

This example demonstrates using the `TreeMultiSelector` with sample data and displaying the selected IDs.

```jsx
"use client";

import React, { useState } from 'react';
import {
  type TreeNode,
  TreeMultiSelector,
} from "@/components/ui/tree-multi-selector";

// Sample Data
const treeData: TreeNode[] = [
  {
    id: "fruits",
    label: "Fruits",
    children: [
      { id: "apple", label: "Apple" },
      { id: "banana", label: "Banana" },
      {
        id: "citrus",
        label: "Citrus",
        children: [
          { id: "orange", label: "Orange" },
          { id: "lemon", label: "Lemon" },
        ],
      },
    ],
  },
  {
    id: "vegetables",
    label: "Vegetables",
    children: [
      { id: "carrot", label: "Carrot" },
      { id: "broccoli", label: "Broccoli" },
    ],
  },
];

// Initial selection example
const initialSelection = ["apple", "lemon", "carrot"];

export function TreeMultiSelectorDemo() {
  const [selectedNodes, setSelectedNodes] = useState<string[]>(initialSelection);


  const handleSelectionChange = (newSelectedIds: string[]) => {
    console.log(`Selected IDs (includeChildren=${shouldIncludeChildren}):`, newSelectedIds);
    setSelectedNodes(newSelectedIds);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4">
      {/* Tree Selector */}
      <div className="w-full md:w-1/2 lg:w-1/3">
        <h2 className="text-xl font-semibold mb-4">Component Demo</h2>
        <TreeMultiSelector
          data={treeData}
          initialSelectedIds={selectedNodes}
          onChange={handleSelectionChange}
          className="border rounded-md p-4 bg-background"
        />
      </div>

      {/* Display Selected IDs */}
      <div className="w-full md:w-1/2 lg:w-2/3 mt-8 md:mt-0">
        <h2 className="text-xl font-semibold mb-4">Selected Node IDs</h2>
        <div className="p-4 border rounded-md bg-muted/50 min-h-[100px]">
          {selectedNodes.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {selectedNodes.sort().map((id) => ( // Sort for consistent display
                <li key={id}><code>{id}</code></li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground italic">No nodes selected.</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Selection mode: <code>includeChildren={shouldIncludeChildren.toString()}</code>
        </p>
      </div>
    </div>
  );
}
```
