import React from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";

export default function MockAvatar({
  className,
  size = "medium",
}: {
  className?: string;
  size?: "large" | "medium" | "small";
}) {
  const sizeClasses = {
    large: "lg:w-16 lg:h-16 w-14 h-14",
    medium: "lg:w-12 lg:h-12 w-10 h-10",
    small: "lg:w-8 lg:h-8 w-6 h-6",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {/* Mock image cause user have only username */}
      <AvatarImage
        src={"https://cdn-icons-png.freepik.com/512/6833/6833605.png"}
      />
    </Avatar>
  );
}
