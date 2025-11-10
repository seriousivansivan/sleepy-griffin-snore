"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"
import { ScrollArea } from "./scroll-area"

type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 h-full w-10"
              onClick={() => setOpen((prev) => !prev)}
            >
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
      </div>
      <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <ScrollArea className="h-48">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}