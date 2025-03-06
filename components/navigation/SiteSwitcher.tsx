// components/SiteSwitcher.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SiteSwitcher() {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" onClick={toggleDropdown}>
          <span className="text-sm font-semibold">Site</span>
        <ChevronDown className="w-4 h-4" />
      </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="outline" className="flex items-center gap-2">
            <span className="text-sm font-semibold">Site 1</span>
          
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

