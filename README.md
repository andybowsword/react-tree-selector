# React Tree Selector Component

A flexible and accessible React component for displaying hierarchical data (trees) and allowing users to select nodes via checkboxes. Built with **shadcn/ui**, **Tailwind CSS**, and **Lucide Icons**.

[![Made with React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white&style=flat-square)](https://reactjs.org/)
[![Styled with Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white&style=flat-square)](https://tailwindcss.com/)
[![Built with shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black?style=flat-square)](https://ui.shadcn.com/)

## Features

- **Hierarchical Display:** Renders nested tree structures based on your data.
- **Checkbox Selection:** Allows single and multiple node selection using checkboxes.
- **Expand/Collapse:** Users can expand and collapse parent nodes to view or hide children.
- **Controlled Component:** Selection state is managed externally via `value` and `onChange` props.
- **Two Selection Modes (`includeChildren` prop):**
  - **Cascade Selection (default):** Selecting a parent implicitly selects all its descendants. Unselecting a parent unselects all descendants. Checkboxes show an indeterminate state for partially selected subtrees.
  - **Top-Level Selection:** Selecting a parent selects _only_ that parent. Descendants remain selectable individually _unless_ an ancestor is selected (then they become disabled).
- **Accessibility:** Implements ARIA roles (`tree`, `treeitem`) and attributes (`aria-selected`, `aria-expanded`, `aria-disabled`, `aria-level`) for better screen reader support.
- **Customizable:** Built with `shadcn/ui` and Tailwind CSS, allowing easy styling and theming.
- **TypeScript Support:** Fully typed for better developer experience.

## Prerequisites

This component assumes you have a React project set up with:

1. **Tailwind CSS:** Configured for styling.
2. **shadcn/ui:** Initialized in your project (`npx shadcn-ui@latest init`).
3. **Required shadcn/ui Components:** You need the `Button` and `Checkbox` components added to your project:

   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add checkbox
   ```

## Installation

1. Copy the provided `TreeSelector.tsx` (or the file containing the code) into your components directory (e.g., `src/components/ui/tree-selector.tsx`).
2. Ensure the import paths for `Button`, `Checkbox`, and `cn` match your project structure (e.g., `@/components/ui/button`, `@/lib/utils`).
3. Export the component and necessary types from your component's index file if needed.

## Usage

Import the `TreeSelector` component and the `TreeNode` type. Provide your hierarchical data (`treeData`), the current selection state (`value`), and an `onChange` handler to update the selection.

```tsx
"use client";

import React from "react";
import { TreeSelector, type TreeNode } from "@/components/ui/tree-selector";

// Sample Tree Data
const sampleTreeData: TreeNode[] = [
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
  { id: "uncategorized", label: "Uncategorized Item" },
];

function MyTreePage() {
  // State to manage selected node IDs
  const [selectedIds, setSelectedIds] = React.useState<string[]>([
    "apple",
    "orange",
  ]);
  // State to toggle selection behavior
  const [includeChildrenMode, setIncludeChildrenMode] = React.useState(false);

  const handleSelectionChange = (newSelectedIds: string[]) => {
    console.log("Selection changed:", newSelectedIds);
    setSelectedIds(newSelectedIds);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Select Items</h2>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="includeChildrenToggle"
          checked={includeChildrenMode}
          onChange={(e) => setIncludeChildrenMode(e.target.checked)}
        />
        <label htmlFor="includeChildrenToggle">
          Enable "Top-Level Only" Selection (includeChildren=true)
        </label>
      </div>

      <TreeSelector
        treeData={sampleTreeData}
        value={selectedIds}
        onChange={handleSelectionChange}
        includeChildren={includeChildrenMode} // Control selection behavior
        className="max-w-md" // Optional: Add custom styling
      />

      <div className="mt-4">
        <h3 className="font-medium">Current Selection:</h3>
        <pre className="text-sm bg-muted p-2 rounded">
          {JSON.stringify(selectedIds, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default MyTreePage;
```

## API Reference

### `<TreeSelector />` Props

| Prop              | Type                              | Default     | Description                                                                                                                                                                                                                        |
| :---------------- | :-------------------------------- | :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `treeData`        | `TreeNode[]`                      | `undefined` | **Required.** An array of `TreeNode` objects representing the root nodes of the tree.                                                                                                                                              |
| `value`           | `string[]`                        | `undefined` | **Required.** An array of strings representing the IDs of the currently selected nodes. Controls the component's selection state.                                                                                                  |
| `onChange`        | `(selectedIds: string[]) => void` | `undefined` | **Required.** Callback function invoked when the selection changes. Receives the new array of selected node IDs.                                                                                                                   |
| `includeChildren` | `boolean`                         | `false`     | Controls the selection behavior (see [Selection Behavior](#selection-behavior) below). If `true`, selecting a parent only selects that node and disables descendants. If `false`, selecting a parent also selects all descendants. |
| `className`       | `string`                          | `undefined` | Optional CSS classes to apply to the root `div` element of the component for custom styling.                                                                                                                                       |

### `TreeNode` Type

Each object in the `treeData` array (and their `children`) must conform to this structure:

```typescript
type TreeNode = {
  id: string; // Must be unique across the entire tree
  label: string; // Text displayed for the node
  children?: TreeNode[]; // Optional array of child nodes
};
```

## Selection Behavior (`includeChildren` prop)

The `includeChildren` prop fundamentally changes how selection works:

- **`includeChildren={false}` (Default - Cascade Selection):**

  - Checking a parent node's checkbox selects the parent **and** all its descendants (recursively).
  - Unchecking a parent node's checkbox unselects the parent **and** all its descendants.
  - If some, but not all, descendants of a parent are selected (e.g., due to initial `value` or individual child interaction), the parent checkbox will show an **indeterminate** state.
  - The `value`/`onChange` arrays will contain the IDs of _all_ implicitly or explicitly selected nodes.

- **`includeChildren={true}` (Top-Level Selection):**
  - Checking a parent node's checkbox selects **only** the parent node itself.
  - Unchecking a parent node's checkbox unselects **only** the parent node.
  - If a parent node is selected, its direct and indirect children become **disabled** and cannot be individually selected or unselected. Their checkboxes reflect the parent's selection state but are grayed out.
  - If a parent node is _not_ selected, its children can be selected or unselected independently.
  - The `value`/`onChange` arrays will only contain the IDs of the nodes that are _explicitly_ checked (no implicit descendant selection).

**Note:** When the `includeChildren` prop changes dynamically, the component attempts to reconcile the `value` array according to the new mode.
