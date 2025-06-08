"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, User, LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/lib/hooks";
import MockAvatar from "../common/MockAvatar";

interface NavbarProps {
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

export function Navbar({ onSidebarToggle, isSidebarOpen }: NavbarProps) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <nav className="bg-green-500 border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/home" className="flex items-center space-x-2">
              <span className="text-xl font-light italic text-white">
                a Board
              </span>
            </Link>
          </div>

          {/* Right side content */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            {status === "loading" ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex gap-2 items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-md font-medium text-white">
                    {session.user?.username}
                  </span>
                  <MockAvatar size="small" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.username}
                      </p>
                      <p className="text-xs text-gray-500">Signed in</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-success hover:bg-success/90 text-white">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Sidebar Toggle */}
            {isMobile && onSidebarToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSidebarToggle}
                className="text-white hover:bg-green-600 lg:hidden"
              >
                {isSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
