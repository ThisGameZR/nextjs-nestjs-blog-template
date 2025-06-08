"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks";
import { Home, Edit, ChevronLeft } from "lucide-react";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
  },
  {
    label: "Our Blog",
    href: "/blog",
    icon: Edit,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const sidebar = document.getElementById("sidebar");

        if (sidebar && !sidebar.contains(event.target as Node)) {
          onToggle();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobile, isOpen, onToggle]);

  const isActive = (href: string) => {
    if (href === "/home") {
      return pathname === "/" || pathname === "/home";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "h-screen bg-grey-100 border-l border-gray-200 transition-transform duration-300 ease-in-out",
          // Mobile: fixed and slide in/out from right
          isMobile && "fixed top-0 right-0 z-50",
          isMobile && !isOpen && "translate-x-full",
          isMobile && isOpen && "translate-x-0",
          // Desktop: fixed positioning on left, always visible
          !isMobile &&
            "fixed top-0 left-0 z-30 translate-x-0 border-r border-l-0",
          // Width
          "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/home" className="flex items-center space-x-2">
              <span className="text-xl font-light italic text-gray-800">
                a Board
              </span>
            </Link>
            {isMobile && <ChevronLeft className="h-5 w-5 text-gray-400" />}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (isMobile) {
                          onToggle();
                        }
                      }}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 text-green-500 relative top-[-1px]",
                          active && "font-bold"
                        )}
                      />
                      <span
                        className={cn("text-green-500", active && "font-bold")}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}

// Hook to manage sidebar state
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}
