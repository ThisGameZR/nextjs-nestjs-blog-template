"use client";

import React from "react";
import { MessageCircle, Edit, Trash2 } from "lucide-react";
import { PostResponse } from "@/types/post";
import { useUser } from "@/queries/user.query";
import { usePostComments } from "@/queries/comment.query";
import MockAvatar from "@/components/shared/MockAvatar";
import { TextHighlight } from "@/components/shared/TextHighlight";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  post: PostResponse;
  onCommentClick?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onEditClick?: (postId: string) => void;
  onDeleteClick?: (postId: string) => void;
  searchTerm?: string;
  showActions?: boolean;
  currentUserId?: string;
}

export function PostCard({ 
  post, 
  onCommentClick, 
  onPostClick, 
  onEditClick,
  onDeleteClick,
  searchTerm = "",
  showActions = false,
  currentUserId
}: PostCardProps) {
  const { data: user } = useUser(post.authorId);
  const { data: commentsData } = usePostComments(post.id, { limit: 1 });

  const handlePostClick = () => {
    onPostClick?.(post.id);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommentClick?.(post.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.(post.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick?.(post.id);
  };

  const commentCount = commentsData?.pagination?.total || 0;
  const isOwner = showActions && currentUserId == post.authorId;

  return (
    <div 
      className="bg-white rounded-lg p-6 mb-4 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={handlePostClick}
    >
      {/* User info and actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <MockAvatar size="small" />
          <span className="font-medium text-gray-900">{user?.username}</span>
        </div>
        
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
              onClick={handleEditClick}
              title="Edit post"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
              onClick={handleDeleteClick}
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Category */}
      <div className="mb-3">
        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {post.category}
        </span>
      </div>

      {/* Post content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          <TextHighlight text={post.title} searchTerm={searchTerm} />
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3">
          <TextHighlight text={post.content} searchTerm={searchTerm} />
        </p>
      </div>

      {/* Comments */}
      <div 
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors w-fit"
        onClick={handleCommentClick}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        <span className="text-sm">
          {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>
    </div>
  );
} 