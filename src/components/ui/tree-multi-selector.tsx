"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { ChevronRight, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type TreeNode = {
  id: string; // Must be unique across the entire tree
  label: string;
  children?: TreeNode[];
};

export type SelectedNodesMap = Map<string, string>;

/**
 * Recursively gets all descendant IDs for a given node.
 */
function getAllDescendantIds(node: TreeNode): string[] {
  let ids: string[] = [];
  if (node.children) {
    for (const child of node.children) {
      ids.push(child.id);
      ids = ids.concat(getAllDescendantIds(child));
    }
  }
  return ids;
}

/**
 * Recursively checks if any descendant of a node is selected.
 * Excludes nodes that are themselves descendants of already selected nodes further up the chain.
 */
function hasSelectedDescendant(
  node: TreeNode,
  selectedIds: Set<string>,
  ancestorSelected: boolean = false // Tracks if an ancestor is selected
): boolean {
  if (!node.children) {
    return false;
  }

  for (const child of node.children) {
    const isChildSelected = selectedIds.has(child.id);
    // If this child is selected directly AND no ancestor was selected, return true
    if (isChildSelected && !ancestorSelected) {
      return true;
    }
    // If this child is NOT selected, but one of ITS descendants is selected, return true
    // Pass down whether the current node (child) is selected as the new ancestorSelected state
    if (
      hasSelectedDescendant(
        child,
        selectedIds,
        ancestorSelected || isChildSelected
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively searches for ancestors of a set of target IDs in a tree.
 */
function findAncestorIds(
  targetIds: Set<string>,
  nodes: TreeNode[]
): Set<string> {
  const ancestorIds = new Set<string>();

  // Recursive DFS function to find ancestors of a single targetId
  function searchForAncestors(
    node: TreeNode,
    targetId: string,
    currentPath: string[] // IDs of ancestors leading to 'node'
  ): string[] | null {
    // Returns the ancestor path if target is found, otherwise null
    if (node.id === targetId) {
      return currentPath; // Found the target, return the path leading to it
    }

    if (node.children && node.children.length > 0) {
      const newPath = [...currentPath, node.id]; // Add current node to path for children
      for (const child of node.children) {
        const result = searchForAncestors(child, targetId, newPath);
        if (result !== null) {
          return result; // Target found in this subtree, propagate the path up
        }
      }
    }

    return null; // Target not found in this node or its descendants
  }

  // Iterate through each ID we need to find ancestors for
  for (const targetId of targetIds) {
    // Search starting from each root node in the tree data
    for (const rootNode of nodes) {
      const path = searchForAncestors(rootNode, targetId, []); // Start with empty path
      if (path !== null) {
        // If found, add all ancestors in the path to the set
        path.forEach((ancestorId) => ancestorIds.add(ancestorId));
        // Optimization: Found the target in this root's tree,
        // no need to check other roots for *this* specific targetId.
        break;
      }
    }
  }

  return ancestorIds;
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggleSelected: (node: TreeNode, isChecked: boolean) => void;
  onToggleExpanded: (nodeId: string) => void;
  isAncestorSelected: boolean;
}

function TreeNodeItem({
  node,
  level,
  selectedIds,
  expandedIds,
  onToggleSelected,
  onToggleExpanded,
  isAncestorSelected,
}: TreeNodeItemProps) {
  const isDisabled = isAncestorSelected;
  const isSelected = selectedIds.has(node.id);
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  // Determine checkbox state: checked, unchecked, or indeterminate
  let checkedState: boolean | "indeterminate" = false;
  if (isSelected) {
    checkedState = true;
  } else if (
    hasSelectedDescendant(node, selectedIds, false) ||
    isAncestorSelected
  ) {
    // Check descendants for indeterminate state ONLY if the node itself isn't selected
    checkedState = "indeterminate";
  }

  const handleCheckedChange = (isChecked: boolean | "indeterminate") => {
    // The Checkbox component's onCheckedChange provides the *new* state (true/false)
    // It doesn't pass 'indeterminate', it resolves to false when clicked from indeterminate
    onToggleSelected(node, !!isChecked);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2 py-1">
        {/* Indentation */}
        <div style={{ paddingLeft: `${level * 1.5}rem` }} aria-hidden="true" />

        {/* Collapse/Expand Button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onToggleExpanded(node.id)}
            aria-label={
              isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`
            }
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          // Placeholder for alignment if no children
          <div className="h-6 w-6" aria-hidden="true" />
        )}

        {/* Checkbox and Label */}
        <div className="flex items-center space-x-2 flex-1">
          <Checkbox
            id={`node-${node.id}`}
            checked={checkedState}
            onCheckedChange={handleCheckedChange}
            disabled={isDisabled}
            aria-label={node.label} // More specific label
          />
          <label
            htmlFor={`node-${node.id}`}
            className={cn(
              "text-sm font-medium leading-none",
              isDisabled
                ? "cursor-not-allowed text-muted-foreground"
                : "cursor-pointer",
              isSelected && !isDisabled && "font-semibold" // Optional: highlight selected
            )}
          >
            {node.label}
          </label>
        </div>
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Optional: Add subtle vertical line for structure */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-muted"
            style={{ marginLeft: `${level * 1.5 + 0.75}rem` }} // Adjust positioning
          />
          {node.children?.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleSelected={onToggleSelected}
              onToggleExpanded={onToggleExpanded}
              isAncestorSelected={isAncestorSelected || isSelected} // Pass down if current node is selected OR if an ancestor was already selected
            />
          ))}
        </div>
      )}
    </div>
  );
}

TreeNodeItem.displayName = "TreeNodeItem";

interface TreeMultiSelectorProps {
  data: TreeNode[];
  initialSelectedIds?: string[];
  onChange?: (selectedIds: string[]) => void;
  className?: string;
}

function TreeMultiSelector({
  data,
  initialSelectedIds = [],
  onChange,
  className,
}: TreeMultiSelectorProps) {
  const [selectedIds, setSelectedIds] = React.useState(() => {
    // Ensure no descendants are selected if a parent is
    const cleanedIds = new Set(initialSelectedIds);
    const allNodesMap = new Map<string, TreeNode>();
    const queue = [...data];
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) continue;
      allNodesMap.set(node.id, node);
      if (node.children) queue.push(...node.children);
    }

    for (const id of initialSelectedIds) {
      const node = allNodesMap.get(id);
      if (node) {
        const descendantIds = getAllDescendantIds(node);
        descendantIds.forEach((descId) => cleanedIds.delete(descId));
      }
    }
    return cleanedIds;
  });

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    // Calculate initial expanded state by finding ancestors of initially selected nodes
    if (initialSelectedIds && initialSelectedIds.length > 0) {
      return findAncestorIds(new Set(initialSelectedIds), data);
    }
    return new Set<string>(); // Default to empty set if no initial selection
  });

  const handleToggleSelected = React.useCallback(
    (node: TreeNode, isChecked: boolean) => {
      let finalSelectedIds: Set<string> | null = null;

      setSelectedIds((prevSelectedIds) => {
        const newSelectedIds = new Set(prevSelectedIds);
        const descendantIds = getAllDescendantIds(node);

        if (isChecked) {
          // Select the node
          newSelectedIds.add(node.id);

          // Unselect and disable all descendants
          descendantIds.forEach((id) => newSelectedIds.delete(id));
        } else {
          // Unselect the node
          newSelectedIds.delete(node.id);

          // We don't automatically select children when unchecking a parent.
          // Descendants become potentially selectable again if no other ancestor is selected.
        }

        finalSelectedIds = newSelectedIds;

        return newSelectedIds;
      });

      // Trigger onChange callback outside of setSelectedIds state update
      if (onChange && finalSelectedIds) {
        onChange?.(Array.from(finalSelectedIds));
      }
    },
    [onChange]
  );

  const handleToggleExpanded = React.useCallback((nodeId: string) => {
    setExpandedIds((prevExpandedIds) => {
      const newExpandedIds = new Set(prevExpandedIds);
      if (newExpandedIds.has(nodeId)) {
        newExpandedIds.delete(nodeId);
      } else {
        newExpandedIds.add(nodeId);
      }
      return newExpandedIds;
    });
  }, []);

  return (
    <div className={cn("w-full rounded-md border p-4", className)}>
      {data.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          selectedIds={selectedIds}
          expandedIds={expandedIds}
          onToggleSelected={handleToggleSelected}
          onToggleExpanded={handleToggleExpanded}
          isAncestorSelected={false} // Root nodes have no selected ancestors
        />
      ))}
    </div>
  );
}

export { TreeMultiSelector, type TreeNode };
