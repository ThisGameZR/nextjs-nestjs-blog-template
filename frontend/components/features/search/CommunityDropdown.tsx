"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCategory } from "@/types/post";

interface CommunityDropdownProps {
  selectedCategory?: PostCategory | null;
  onCategoryChange?: (category: PostCategory | null) => void;
  className?: string;
}

const categoryOptions = [
  { value: null, label: "All Communities" },
  { value: PostCategory.HISTORY, label: "History" },
  { value: PostCategory.SCIENCE, label: "Science" },
  { value: PostCategory.TECHNOLOGY, label: "Technology" },
  { value: PostCategory.ART, label: "Art" },
  { value: PostCategory.MUSIC, label: "Music" },
  { value: PostCategory.SPORTS, label: "Sports" },
  { value: PostCategory.OTHER, label: "Others" },
];

export function CommunityDropdown({ 
  selectedCategory = null, 
  onCategoryChange,
  className = ""
}: CommunityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = categoryOptions.find(option => option.value === selectedCategory);

  const handleOptionSelect = (category: PostCategory | null) => {
    onCategoryChange?.(category);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button 
        type="button"
        variant="outline" 
        className="h-12 px-4 border-gray-300 justify-between min-w-[140px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label || "Community"}</span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {categoryOptions.map((option) => (
            <button
              type="button"
              key={option.value || 'all'}
              onClick={() => handleOptionSelect(option.value)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{option.label}</span>
              {selectedCategory === option.value && (
                <Check className="w-4 h-4 text-green-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 