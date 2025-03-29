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
  ancestorSelected: boolean = false
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

/**
 * Processes an array of selected IDs based on the tree structure and selection mode.
 * Handles initial selection cleanup for topLevelOnly mode and includes duplicate ID checks in dev mode.
 * @param data The root nodes of the tree.
 * @param selectedIds The array of IDs to process (e.g., from the 'value' prop).
 * @param topLevelOnly If true, processes the IDs to ensure only the highest-level selected node in any branch is included. If false, includes selected nodes and their descendants.
 * @returns A Set containing the processed selected node IDs.
 */
function getSelectedIdsFromData(
  data: TreeNode[],
  selectedIds: string[] = [],
  topLevelOnly: boolean
): Set<string> {
  const initialSet = new Set(selectedIds);
  if (initialSet.size === 0) {
    return initialSet; // Return early if nothing is selected initially
  }

  const nodesToProcess = [...data];
  const nodesMap = new Map<string, TreeNode>();
  if (process.env.NODE_ENV !== "production") {
    // --- Development: Build Nodes Map and Check for Duplicates ---
    const existingIds = new Set<string>();
    while (nodesToProcess.length > 0) {
      const node = nodesToProcess.pop();
      if (!node) continue;
      if (existingIds.has(node.id)) {
        console.warn(
          `[TreeSelector] Duplicate TreeNode ID detected: "${node.id}". This can lead to unexpected behavior.`
        );
      }
      existingIds.add(node.id);
      nodesMap.set(node.id, node);
      if (node.children) nodesToProcess.push(...node.children);
    }
  } else {
    // Production: Build map without duplicate check
    while (nodesToProcess.length > 0) {
      const node = nodesToProcess.pop();
      if (!node) continue;
      nodesMap.set(node.id, node);
      if (node.children) nodesToProcess.push(...node.children);
    }
  }
  // --- End Map Building ---

  const finalSelectedSet = new Set<string>();

  if (topLevelOnly) {
    // This requires two steps:
    // 1. Identify potential candidates: nodes from the initialSet.
    // 2. Filter out candidates that are descendants of *other* candidates in the initialSet.

    for (const id of initialSet) {
      // Check if this id is a descendant of *another* id also present in the initial set
      const ancestors = findAncestorIds(new Set([id]), data);
      let isDescendantOfSelectedAncestor = false;
      for (const ancestorId of ancestors) {
        if (initialSet.has(ancestorId)) {
          // Found an ancestor that was *also* in the initial selection
          isDescendantOfSelectedAncestor = true;
          break;
        }
      }

      // Only keep this ID if it's NOT a descendant of another initially selected node
      if (!isDescendantOfSelectedAncestor) {
        finalSelectedSet.add(id);
      }
    }
  } else {
    for (const id of initialSet) {
      finalSelectedSet.add(id); // Add the node itself
      const node = nodesMap.get(id);
      if (node) {
        const descendants = getAllDescendantIds(node);
        descendants.forEach((descId) => finalSelectedSet.add(descId)); // Add all descendants
      }
    }
  }

  return finalSelectedSet;
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  className?: string;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggleSelected: (node: TreeNode, isChecked: boolean) => void;
  onToggleExpanded: (nodeId: string) => void;
  isAncestorSelected: boolean;
}

const TreeNodeItem = React.memo(
  ({
    node,
    level,
    selectedIds,
    expandedIds,
    onToggleSelected,
    onToggleExpanded,
    isAncestorSelected,
    className,
  }: TreeNodeItemProps) => {
    const isDisabled = isAncestorSelected;
    const isSelected = selectedIds.has(node.id);
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const checkedState = React.useMemo(() => {
      if (isSelected) return true;

      if (
        hasSelectedDescendant(node, selectedIds, false) ||
        isAncestorSelected
      ) {
        return "indeterminate";
      }

      return false;
    }, [isSelected, node, selectedIds, isAncestorSelected]);

    const handleCheckedChange = React.useCallback(
      (isChecked: boolean | "indeterminate") => {
        onToggleSelected(node, !!isChecked);
      },
      [onToggleSelected, node]
    );

    const handleExpandToggle = React.useCallback(() => {
      onToggleExpanded(node.id);
    }, [onToggleExpanded, node.id]);

    return (
      <div
        role="treeitem"
        aria-level={level + 1}
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-disabled={isDisabled}
        className={cn("flex flex-col", className)}
      >
        <div className="flex items-center space-x-2 py-1">
          {/* Indentation */}
          <div
            style={{ paddingLeft: `${level * 1.5}rem` }}
            aria-hidden="true"
          />

          {/* Collapse/Expand Button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleExpandToggle}
              aria-label={
                isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`
              }
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
              aria-selected={isSelected}
              aria-disabled={isDisabled}
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
);
TreeNodeItem.displayName = "TreeNodeItem";

interface TreeSelectorProps {
  treeData: TreeNode[];
  topLevelOnly?: boolean;
  value: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

function TreeSelector({
  value,
  treeData,
  topLevelOnly = false,
  onChange,
  className,
}: TreeSelectorProps) {
  const isInitialMount = React.useRef(true);
  const prevTopLevelOnlyRef = React.useRef(topLevelOnly);
  const selectedIdsSet = React.useMemo(
    () => getSelectedIdsFromData(treeData, value, topLevelOnly),
    [treeData, value, topLevelOnly]
  );

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    // Calculate initial expanded state by finding ancestors of initially selected nodes
    if (selectedIdsSet.size > 0) {
      return findAncestorIds(selectedIdsSet, treeData);
    }
    return new Set<string>(); // Default to empty set if no initial selection
  });

  const handleOnChange = React.useCallback(
    (newSelectedIds: Set<string>) => {
      if (onChange) {
        onChange(Array.from(newSelectedIds));
      }
    },
    [onChange]
  );

  const handleToggleSelected = React.useCallback(
    (node: TreeNode, isChecked: boolean) => {
      const newSelectedIds = new Set(selectedIdsSet);
      const descendantIds = getAllDescendantIds(node);

      if (isChecked) {
        // Select the node itself
        newSelectedIds.add(node.id);

        if (topLevelOnly) {
          // Ensure no descendants are selected
          descendantIds.forEach((id) => newSelectedIds.delete(id));
        } else {
          // Select all descendants
          descendantIds.forEach((id) => newSelectedIds.add(id));
        }
      } else {
        // Unselect the node itself
        newSelectedIds.delete(node.id);

        // Also unselect all descendants
        if (!topLevelOnly) {
          // Only unselect descendants if we are *not* in topLevelOnly mode
          descendantIds.forEach((id) => newSelectedIds.delete(id));
        }
      }

      handleOnChange(newSelectedIds);
    },
    [handleOnChange, selectedIdsSet, topLevelOnly]
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

  // Sync the controlled value with the selected node IDs
  React.useEffect(() => {
    if (isInitialMount.current) {
      handleOnChange(selectedIdsSet);
      isInitialMount.current = false;
    }
  }, [selectedIdsSet, handleOnChange]);

  // Sync the controlled value when topLevelOnly changes
  React.useEffect(() => {
    if (prevTopLevelOnlyRef.current !== topLevelOnly) {
      prevTopLevelOnlyRef.current = topLevelOnly;
      const selectedIds = getSelectedIdsFromData(treeData, value, topLevelOnly);

      handleOnChange(selectedIds);
    }
  }, [treeData, topLevelOnly, value, handleOnChange]);

  return (
    <div role="tree" className={cn("w-full rounded-md border p-4", className)}>
      {treeData.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          selectedIds={selectedIdsSet}
          expandedIds={expandedIds}
          onToggleSelected={handleToggleSelected}
          onToggleExpanded={handleToggleExpanded}
          isAncestorSelected={false} // Root nodes have no selected ancestors
        />
      ))}
    </div>
  );
}

export { TreeSelector, type TreeNode };
