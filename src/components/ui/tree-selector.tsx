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

// Recursively searches for ancestors of a set of target IDs in a tree.
function findAncestorIds(
  targetIds: Set<string>,
  nodes: TreeNode[]
): Set<string> {
  const ancestorIds = new Set<string>();

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

function getSelectedIdsFromData(
  data: TreeNode[],
  selectedIds: string[] = [],
  topLevelOnly: boolean
): Set<string> {
  const initialSet = new Set(selectedIds);
  if (initialSet.size === 0) {
    return initialSet;
  }

  const nodesToProcess = [...data];
  const nodesMap = new Map<string, TreeNode>();

  while (nodesToProcess.length > 0) {
    const node = nodesToProcess.pop();

    if (!node) continue;

    nodesMap.set(node.id, node);
    if (node.children) {
      nodesToProcess.push(...node.children);
    }
  }

  const finalSelectedSet = new Set<string>();

  if (topLevelOnly) {
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
      finalSelectedSet.add(id);
      const node = nodesMap.get(id);
      if (node) {
        const descendants = getAllDescendantIds(node);
        descendants.forEach((descId) => finalSelectedSet.add(descId));
      }
    }
  }

  return finalSelectedSet;
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  className?: string;
  includeChildren?: boolean;
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
    includeChildren,
    onToggleSelected,
    onToggleExpanded,
    isAncestorSelected,
    className,
  }: TreeNodeItemProps) => {
    const isSelected = selectedIds.has(node.id);
    const isExpanded = expandedIds.has(node.id);
    const isDisabled = isAncestorSelected && includeChildren;
    const hasChildren = node.children && node.children.length > 0;

    const checkedState = React.useMemo(() => {
      if (isSelected) return true;

      if (isAncestorSelected && !includeChildren) return false;

      if (
        hasSelectedDescendant(node, selectedIds, false) ||
        isAncestorSelected
      ) {
        return "indeterminate";
      }

      return false;
    }, [isSelected, node, selectedIds, includeChildren, isAncestorSelected]);

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
                includeChildren={includeChildren}
                onToggleSelected={onToggleSelected}
                onToggleExpanded={onToggleExpanded}
                isAncestorSelected={isSelected || isAncestorSelected} // Pass down if current node is selected OR if an ancestor was already selected
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
  includeChildren?: boolean;
  value: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

function TreeSelector({
  value,
  treeData,
  includeChildren = false,
  onChange,
  className,
}: TreeSelectorProps) {
  const prevIncludeChildrenRef = React.useRef(includeChildren);
  const selectedIdsSet = React.useMemo(() => new Set<string>(value), [value]);

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    if (selectedIdsSet.size > 0) {
      return findAncestorIds(selectedIdsSet, treeData);
    }
    return new Set<string>();
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
      const newSelectedIds = new Set<string>(selectedIdsSet);
      const descendantIds = getAllDescendantIds(node);

      if (isChecked) {
        // Select the node itself

        newSelectedIds.add(node.id);

        if (includeChildren) {
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
        if (!includeChildren) {
          // Only unselect descendants if we are *not* in topLevelOnly mode
          descendantIds.forEach((id) => newSelectedIds.delete(id));
        }
      }

      handleOnChange(newSelectedIds);
    },
    [handleOnChange, selectedIdsSet, includeChildren]
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

  // Sync the controlled value when includeChildren changes
  React.useEffect(() => {
    if (prevIncludeChildrenRef.current !== includeChildren) {
      prevIncludeChildrenRef.current = includeChildren;
      const selectedIds = getSelectedIdsFromData(
        treeData,
        value,
        includeChildren
      );

      handleOnChange(selectedIds);
    }
  }, [value, treeData, includeChildren, handleOnChange]);

  return (
    <div role="tree" className={cn("w-full rounded-md border p-4", className)}>
      {treeData.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          includeChildren={includeChildren}
          expandedIds={expandedIds}
          selectedIds={selectedIdsSet}
          onToggleSelected={handleToggleSelected}
          onToggleExpanded={handleToggleExpanded}
          isAncestorSelected={false} // Root nodes have no selected ancestors
        />
      ))}
    </div>
  );
}

export { TreeSelector, type TreeNode };
