"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryTable } from "@/components/admin/category-table";
import { EditCategoryDialog } from "@/components/admin/edit-category-dialog";
import { toast } from "sonner";

export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
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
    } else {
      setCategories(data as Category[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

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
        <CategoryTable categories={categories} onActionComplete={fetchCategories} />
      )}

      <EditCategoryDialog
        mainCategories={mainCategories}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onCategoryUpdated={() => {
          setIsAddDialogOpen(false);
          fetchCategories();
        }}
      />
    </div>
  );
}