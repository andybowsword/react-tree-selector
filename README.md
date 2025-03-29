# React TreeSelector built with shadcn/ui

A flexible React component for displaying hierarchical data (tree) with multi-selection checkboxes. Built using shadcn/ui components and designed as a **controlled component** for selection state.

**Preview:** [react-tree-multi-selector.vercel.app](https://react-tree-multi-selector.vercel.app/) _(Note: Preview might not reflect the latest controlled component pattern)_

## Key Features

- Displays tree data recursively.
- Allows expanding and collapsing parent nodes.
- **Controlled multi-selection:** Selection state is managed externally via `value` and `onChange` props.
- **Two selection reporting modes:** Controlled by the `topLevelOnly` prop.
- Handles parent/child selection logic internally based on the mode.
- Checkboxes show an indeterminate state if a node is not selected but has selected descendants (respecting `topLevelOnly` logic).
- Provides callbacks (`onChange`) for selection changes.
- **Accessibility:** Includes ARIA roles (`tree`, `treeitem`) and attributes for improved screen reader support.
- **Performance:** Optimized child item rendering using `React.memo`, `useCallback`, and `useMemo`.
- **Developer Friendly:** Includes development-mode warnings for duplicate node IDs.

## Important Note: Controlled Component

This component operates as a **controlled component** for its selection state. This means:

1. You **must** provide the current selection state (an array of selected node IDs) via the `value` prop.
2. You **must** provide an `onChange` callback function.
3. When the user interacts with a checkbox, the component calculates the _new_ proposed selection state and calls `onChange` with this new array of IDs.
4. Your parent component **must** handle the `onChange` callback, update its own state, and pass the updated state back into the `TreeSelector`'s `value` prop for the changes to be visually reflected.

## Selection Behavior (`topLevelOnly` Prop)

The `onChange` callback provides selected node IDs based on the `topLevelOnly` prop:

- **`topLevelOnly={false}` (Default):**
  - When a node is selected, its ID **and the IDs of all its descendants** are included in the array passed to `onChange`.
  - This provides an exhaustive list of all individual nodes covered by the selection.
- **`topLevelOnly={true}`:**
  - When a node is selected, **only its ID** is included in the array passed to `onChange`. Descendant IDs are excluded.
  - If multiple nodes in a branch are selected (e.g., parent and child), `onChange` will only receive the ID of the **highest-level selected node** in that branch.
  - This provides a concise list representing the root of each selected branch.

_(Internal display logic, like disabling descendants when a parent is selected in `topLevelOnly=true` mode, is handled automatically)._

## Installation

1. **Initialize shadcn/ui (if you haven't already):**

   ```bash
   npx shadcn-ui@latest init
   ```

2. **Add required shadcn/ui components:**

   ```bash
   npx shadcn-ui@latest add button checkbox utils
   ```

3. **Copy the Component Code:**
   Copy the `TreeSelector` component code (including helper functions and the `TreeNode` type) from `src/components/ui/tree-selector.tsx` (adjust path as needed) into your project, likely within your `components/ui` directory. Ensure internal import paths (`@/components/ui/...`, `@/lib/utils`) match your project structure.

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

| Prop           | Type                              | Default     | Description                                                                                                                                           |
| :------------- | :-------------------------------- | :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `treeData`     | `TreeNode[]`                      | `undefined` | **Required.** The array of root nodes for the tree.                                                                                                   |
| `value`        | `string[]`                        | `undefined` | **Required.** The controlled array of currently selected node IDs. Must be managed by the parent component.                                           |
| `onChange`     | `(selectedIds: string[]) => void` | `undefined` | **Required.** Callback function triggered when selection changes. Receives the _new_ proposed array of selected IDs based on the `topLevelOnly` mode. |
| `topLevelOnly` | `boolean`                         | `false`     | Optional. If `true`, `onChange` returns only the top-most selected ID per branch. If `false`, returns selected IDs plus all descendant IDs.           |
| `className`    | `string`                          | `undefined` | Optional. Additional CSS classes to apply to the root container element.                                                                              |

## Basic Usage (Controlled Component Example)

```jsx
"use client";

import React from "react";

import { type TreeNode, TreeSelector } from "@/components/ui/tree-selector";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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

const initSelection = ["apple", "lemon", "carrot", "grapefruit", "citrus"];

export function TreeSelectorDemo() {
  // State to control whether to include children or not
  const [topLevelOnly, setTopLevelOnly] = React.useState(false);

  // State to hold the selected node IDs from the tree
  const [selectedNodes, setSelectedNodes] = React.useState<string[]>(
    // Initialize with pre-selected nested nodes
    initSelection
  );

  const handleTopLevelOnlyChange = () => {
    setTopLevelOnly((prevState) => !prevState);
  };

  const handleSelectionChange = (newSelectedIds: string[]) => {
    console.log("Showcase Page - Selected IDs:", newSelectedIds);
    setSelectedNodes(newSelectedIds);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Tree Selector Column */}
      <div className="w-full md:w-1/2 lg:w-1/3">
        <h2 className="text-xl font-semibold mb-4">Component Demo</h2>
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-2">
          <Checkbox
            id="top-level-only"
            checked={topLevelOnly}
            onCheckedChange={handleTopLevelOnlyChange}
          />
          <div className="leading-1">
            <Label htmlFor="top-level-only">Select Top Level Only</Label>
          </div>
        </div>
        <TreeSelector
          treeData={treeData}
          value={selectedNodes}
          topLevelOnly={topLevelOnly}
          onChange={handleSelectionChange}
          className="border rounded-md p-4 bg-background"
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
```
