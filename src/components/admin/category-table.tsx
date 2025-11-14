"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditCategoryDialog } from "./edit-category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import type { Category } from "@/app/admin/categories/page";

type HierarchicalCategory = Category & { children: Category[] };

type CategoryTableProps = {
  categories: Category[];
  onActionComplete: () => void;
};

export function CategoryTable({ categories, onActionComplete }: CategoryTableProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { hierarchicalCategories, mainCategories } = useMemo(() => {
    if (!Array.isArray(categories)) {
      return { hierarchicalCategories: [], mainCategories: [] };
    }

    const categoryMap = new Map<string, HierarchicalCategory>();
    const rootCategories: HierarchicalCategory[] = [];

    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    categories.forEach(category => {
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!;
        const child = categoryMap.get(category.id)!;
        parent.children.push(child);
      } else {
        const rootCategory = categoryMap.get(category.id)!;
        rootCategories.push(rootCategory);
      }
    });
    
    rootCategories.forEach(cat => {
        cat.children.sort((a, b) => a.name.localeCompare(b.name));
    });
    rootCategories.sort((a, b) => a.name.localeCompare(b.name));

    return {
      hierarchicalCategories: rootCategories,
      mainCategories: rootCategories.map(({ children, ...rest }) => rest),
    };
  }, [categories]);

  const tableRows = hierarchicalCategories.flatMap((category) => {
    const mainRow = (
      <TableRow key={category.id} className="bg-muted/50">
        <TableCell className="font-medium">{category.name}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeletingCategory(category)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );

    const childRows = category.children.map((child) => (
      <TableRow key={child.id}>
        <TableCell className="pl-10">{child.name}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingCategory(child)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeletingCategory(child)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));

    return [mainRow, ...childRows];
  });

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </div>

      <EditCategoryDialog
        category={editingCategory}
        mainCategories={mainCategories}
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onCategoryUpdated={onActionComplete}
      />

      <DeleteCategoryDialog
        category={deletingCategory}
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onCategoryDeleted={onActionComplete}
      />
    </>
  );
}