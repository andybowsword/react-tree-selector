# React TreeMultiSelector built with shadcn/ui

A simple, minimalistic React component for displaying hierarchical data (a tree) with multi-selection capabilities using checkboxes. Built with shadcn/ui components.

## Important Note

Please be aware that the `selectedIds` array (returned via the `onChange` callback) will only contain the ID of the highest-level selected node within any given branch of the tree.

- If you select a parent node, only the parent's id is added to the `selectedIds` list.
- Any ids belonging to its descendants (children, grandchildren, etc.) are automatically **excluded** from the list, even if they were selected previously.

## Features

- Displays tree data recursively.
- Allows expanding and collapsing parent nodes.
- Supports multi-selection with checkboxes.
- Handles parent/child selection logic:
  - Selecting a parent node selects it.
  - Descendants of a selected node are visually indicated but cannot be individually selected/deselected.
  - Checkboxes show an indeterminate state if a node is not selected but has selected descendants.
- Provides callbacks for selection changes.
- Automatically expands parent nodes of initially selected items.

## Installation

Install shadcn/ui using the following command:

```bash
npx shadcn@latest init
```

Add the required components from shadcn to your project:

```bash
npx shadcn@latest add button checkbox
```

copy the component code from `src/components/ui/tree-multi-selector.tsx` into your project.

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

| Prop                 | Type                              | Description                                                              | Default     |
| :------------------- | :-------------------------------- | :----------------------------------------------------------------------- | :---------- |
| `data`               | `TreeNode[]`                      | **Required.** The array of root nodes for the tree.                      | `undefined` |
| `initialSelectedIds` | `string[]`                        | Optional. An array of node IDs that should be selected initially.        | `[]`        |
| `onChange`           | `(selectedIds: string[]) => void` | Optional. Callback function triggered when the selection changes.        | `undefined` |
| `className`          | `string`                          | Optional. Additional CSS classes to apply to the root container element. | `undefined` |

## Basic Usage

```jsx
import React, { useState } from 'react';
import { TreeMultiSelector, type TreeNode } from '@/components/ui/tree-multi-selector';

const treeData: TreeNode[] = [
  {
    id: '1',
    label: 'Root 1',
    children: [
      { id: '1-1', label: 'Child 1.1' },
      {
        id: '1-2',
        label: 'Child 1.2',
        children: [{ id: '1-2-1', label: 'Grandchild 1.2.1' }],
      },
    ],
  },
  {
    id: '2',
    label: 'Root 2',
  },
];

export function TreeMultiSelectorDemo() {
  const [selected, setSelected] = useState<string[]>(['1-1']); // Example initial selection

  const handleSelectionChange = (newSelectedIds: string[]) => {
    console.log('Selected IDs:', newSelectedIds);
    setSelected(newSelectedIds);
  };

  return (
    <div>
      <h2>Select Items</h2>
      <TreeMultiSelector
        data={treeData}
        initialSelectedIds={selected}
        onChange={handleSelectionChange}
        className="max-w-sm"
      />
      {/* Display selected items or use the 'selected' state elsewhere */}
      <p>Currently selected: {selected.join(', ') || 'None'}</p>
    </div>
  );
}

```
