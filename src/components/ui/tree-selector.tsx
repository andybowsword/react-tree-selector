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

function getInitialSelectedIds(
  data: TreeNode[],
  initialSelectedIds?: string[],
  includeChildren?: boolean
): Set<string> {
  const initialSet = new Set(initialSelectedIds);
  const nodesToProcess = [...data];
  const nodesMap = new Map<string, TreeNode>();
  while (nodesToProcess.length > 0) {
    const node = nodesToProcess.pop();
    if (!node) continue;
    nodesMap.set(node.id, node);
    if (node.children) nodesToProcess.push(...node.children);
  }

  const finalInitialSet = new Set(initialSet);
  for (const id of initialSet) {
    const node = nodesMap.get(id);
    if (node) {
      const descendants = getAllDescendantIds(node);

      descendants.forEach((descId) =>
        includeChildren
          ? finalInitialSet.add(descId)
          : finalInitialSet.delete(descId)
      );
    }
  }

  return finalInitialSet;
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

interface TreeSelectorProps {
  data: TreeNode[];
  includeChildren?: boolean;
  initialSelectedIds?: string[];
  onChange?: (selectedIds: string[]) => void;
  className?: string;
}

function TreeSelector({
  data,
  includeChildren = true,
  initialSelectedIds = [],
  onChange,
  className,
}: TreeSelectorProps) {
  const [selectedIds, setSelectedIds] = React.useState(() => {
    return getInitialSelectedIds(data, initialSelectedIds, includeChildren);
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
      let finalSelectedIds: Set<string> | null = null; // To store the result for onChange

      setSelectedIds((prevSelectedIds) => {
        const newSelectedIds = new Set(prevSelectedIds);
        const descendantIds = getAllDescendantIds(node);

        if (isChecked) {
          // Select the node itself
          newSelectedIds.add(node.id);

          if (includeChildren) {
            // Also select all descendants
            descendantIds.forEach((id) => newSelectedIds.add(id));
          } else {
            // Ensure no descendants are selected (original behavior)
            descendantIds.forEach((id) => newSelectedIds.delete(id));
            // Also, check if any ancestor is now selected and remove this node if so
            // This case is less likely due to the disabled state, but good for robustness
            const ancestors = findAncestorIds(new Set([node.id]), data);
            let ancestorSelected = false;
            for (const ancestorId of ancestors) {
              if (newSelectedIds.has(ancestorId)) {
                ancestorSelected = true;
                break;
              }
            }
            if (ancestorSelected) {
              newSelectedIds.delete(node.id);
            }
          }
        } else {
          // Unselect the node itself
          newSelectedIds.delete(node.id);

          if (includeChildren) {
            // Also unselect all descendants (they were selected as a group)
            descendantIds.forEach((id) => newSelectedIds.delete(id));
          }
          // If includeChildren is false, we only unselect the parent.
          // Children might still be selected individually.
        }

        finalSelectedIds = newSelectedIds; // Store the result
        return newSelectedIds;
      });

      // Trigger onChange callback AFTER state update completes
      // Use the stored finalSelectedIds which reflects the change
      if (onChange && finalSelectedIds !== null) {
        onChange(Array.from(finalSelectedIds));
      }
    },
    [data, includeChildren, onChange]
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

  React.useEffect(() => {
    let updatedSelectedIds: Set<string> | null = null;

    setSelectedIds(() => {
      const finalInitialSet = getInitialSelectedIds(
        data,
        initialSelectedIds,
        includeChildren
      );

      updatedSelectedIds = finalInitialSet;

      return finalInitialSet;
    });

    if (updatedSelectedIds) {
      onChange?.(Array.from(updatedSelectedIds));
    }
  }, [data, includeChildren, initialSelectedIds, onChange]);

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

export { TreeSelector, type TreeNode };
