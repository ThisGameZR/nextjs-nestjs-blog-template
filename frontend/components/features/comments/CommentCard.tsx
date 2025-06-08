"use client";

import React from "react";
import { CommentResponse } from "@/types/comment";
import { useUser } from "@/queries/user.query";
import { formatRelativeTime } from "@/lib/date";
import MockAvatar from "@/components/shared/MockAvatar";

interface CommentCardProps {
  comment: CommentResponse;
}

export function CommentCard({ comment }: CommentCardProps) {
  const { data: user } = useUser(comment.authorId);

  return (
    <div className="flex items-start space-x-3 py-4">
      <MockAvatar size="small" />
      
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-gray-900 text-sm">
            {user?.username || 'Loading...'}
          </span>
          <span className="text-gray-500 text-xs">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        
        <p className="text-gray-700 text-sm leading-relaxed">
          {comment.content}
        </p>
      </div>
    </div>
  );
} 