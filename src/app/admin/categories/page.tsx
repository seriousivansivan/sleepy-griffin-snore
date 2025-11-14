"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CategoryList } from "@/components/admin/category-list";
import { EditCategoryDialog } from "@/components/admin/edit-category-dialog";

export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  sub_categories?: Category[]; // For nesting
};

export default function CategoryManagementPage() {
  const { supabase } = useSupabaseAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("voucher_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch categories.");
      console.error(error);
      setCategories([]);
    } else {
      // Process into a nested structure
      const categoryMap = new Map<string, Category>();
      const mainCategories: Category[] = [];

      data.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, sub_categories: [] });
      });

      data.forEach(cat => {
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          categoryMap.get(cat.parent_id)!.sub_categories!.push(categoryMap.get(cat.id)!);
        } else {
          mainCategories.push(categoryMap.get(cat.id)!);
        }
      });
      
      setCategories(mainCategories);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Category Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add New Category</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <CategoryList categories={categories} onActionComplete={fetchCategories} />
      )}

      <EditCategoryDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onCategoryUpdated={() => {
          setIsAddDialogOpen(false);
          fetchCategories();
        }}
        allCategories={categories}
      />
    </div>
  );
}