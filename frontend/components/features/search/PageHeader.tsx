"use client";

import { SearchBar } from "./SearchBar";
import { CommunityDropdown } from "./CommunityDropdown";
import { PostCategory } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  searchValue?: string;
  selectedCategory?: PostCategory | null;
  onSearchChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onCategoryChange?: (category: PostCategory | null) => void;
  onCreateClick?: () => void;
  className?: string;
}

export function PageHeader({
  searchValue = "",
  selectedCategory = null,
  onSearchChange,
  onSearch,
  onCategoryChange,
  onCreateClick,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-6 ${className}`}>
      <SearchBar 
        value={searchValue}
        onChange={onSearchChange}
        onSearch={onSearch}
        className="flex-1 w-full"
      />
      
      <div className="flex gap-4 w-full sm:w-auto">
        <CommunityDropdown 
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          className="flex-1 sm:flex-none"
        />
        
        <Button 
          className={`h-12 px-6 bg-green-600 hover:bg-green-700 flex-1 sm:flex-none ${className}`}
          onClick={onCreateClick}
        >
          Create
          <Plus className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
} 