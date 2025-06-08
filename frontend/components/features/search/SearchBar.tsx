"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Search", 
  value = "", 
  onChange,
  onSearch,
  className = ""
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch?.(internalValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        className="pl-10 h-12 text-base border-gray-300"
      />
    </div>
  );
} 