"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { EditCategoryDialog } from "./edit-category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import type { Category } from "@/app/admin/categories/page";

type CategoryListProps = {
  categories: Category[];
  onActionComplete: () => void;
};

export function CategoryList({ categories, onActionComplete }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  return (
    <>
      <div className="border rounded-lg p-4">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-center">No categories found.</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {categories.map((mainCategory) => (
              <AccordionItem value={mainCategory.id} key={mainCategory.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-4">
                    <span className="font-medium">{mainCategory.name}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingCategory(mainCategory); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeletingCategory(mainCategory); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="pl-8 space-y-2 pt-2">
                    {mainCategory.sub_categories?.map((subCategory) => (
                      <li key={subCategory.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                        <span>{subCategory.name}</span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingCategory(subCategory)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingCategory(subCategory)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    ))}
                    {(!mainCategory.sub_categories || mainCategory.sub_categories.length === 0) && (
                      <li className="text-muted-foreground text-sm pl-2">No sub-categories.</li>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <EditCategoryDialog
        category={editingCategory}
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onCategoryUpdated={onActionComplete}
        allCategories={categories}
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