"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

export type MainCategory = {
  id: string;
  name: string;
};

export type SubCategoryMap = Map<string, MainCategory[]>;

interface CategoryPickerProps {
  mainCategories: MainCategory[];
  subCategoryMap: SubCategoryMap;
  value?: { mainCategoryId: string; subCategoryName: string };
  onChange: (value: { mainCategoryId: string; subCategoryName: string }) => void;
  placeholder?: string;
}

export function CategoryPicker({
  mainCategories,
  subCategoryMap,
  value,
  onChange,
  placeholder = "Select a category...",
}: CategoryPickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = React.useMemo(() => {
    if (!value?.mainCategoryId || !value.subCategoryName) {
      return placeholder;
    }
    const mainCategory = mainCategories.find((c) => c.id === value.mainCategoryId);
    if (!mainCategory) {
      return placeholder;
    }
    return `${mainCategory.name} / ${value.subCategoryName}`;
  }, [value, mainCategories, placeholder]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] p-0">
        {mainCategories.map((mainCategory) => {
          const subCategories = subCategoryMap.get(mainCategory.id) || [];
          if (subCategories.length === 0) {
            return null; // Do not show main categories without any sub-categories
          }
          return (
            <DropdownMenuSub key={mainCategory.id}>
              <DropdownMenuSubTrigger>
                <span>{mainCategory.name}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {subCategories.map((subCategory) => (
                    <DropdownMenuItem
                      key={subCategory.id}
                      onSelect={() => {
                        onChange({
                          mainCategoryId: mainCategory.id,
                          subCategoryName: subCategory.name,
                        });
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.subCategoryName === subCategory.name &&
                            value?.mainCategoryId === mainCategory.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {subCategory.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}