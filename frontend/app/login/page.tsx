"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";
import { useIsMobile } from "@/lib/hooks";
import Image from "next/image";
import notebook_mobile from "@/public/notebook_mobile.png";
import notebook_desktop from "@/public/notebook_desktop.png";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-green-500 flex flex-col lg:flex-row">
      {/* Mobile/Desktop - Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Login Form */}
          <div className="rounded-lg p-6 lg:p-8">
            <h2 className="text-white lg:text-2xl text-xl font-medium mb-6">
              Sign in
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-red-200 text-sm text-center">
                  {error === "CredentialsSignin" 
                    ? "Invalid username. Please try again." 
                    : "An error occurred. Please try again."}
                </p>
              </div>
            )}

            <Suspense fallback={<div className="text-white">Loading form...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Desktop Right Side - Additional Branding */}
      <div className="hidden lg:flex w-1/3 bg-[#2B5F44] items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="mb-6">
            {isMobile ? (
              <Image src={notebook_mobile} alt="a Board" className="w-full h-full object-cover" />
            ) : (
              <Image src={notebook_desktop} alt="a Board" className="w-full h-full object-cover" />
            )}
          </div>
          <h1 className="lg:text-4xl text-3xl font-light italic mb-4">a Board</h1>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#243831] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
