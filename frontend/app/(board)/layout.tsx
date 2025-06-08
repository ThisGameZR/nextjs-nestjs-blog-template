"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, useSidebar } from "@/components/layout/Sidebar";
import { useIsMobile } from "@/lib/hooks";

interface BoardLayoutProps {
  children: React.ReactNode;
}

export default function BoardLayout({ children }: BoardLayoutProps) {
  const sidebar = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar 
        onSidebarToggle={sidebar.toggle}
        isSidebarOpen={sidebar.isOpen}
      />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebar.isOpen} onToggle={sidebar.toggle} />
      
      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${
          isMobile ? '' : 'lg:ml-64'
        }`}>
          {/* Content Area */}
          <main className="min-h-[calc(100vh-4rem)] p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 