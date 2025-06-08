"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useCreateCommentOnPost } from "@/queries/comment.query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddCommentProps {
  postId: string;
}

export function AddComment({ postId }: AddCommentProps) {
  const [content, setContent] = useState("");
  const { data: session } = useSession();
  const createComment = useCreateCommentOnPost(postId);
  const router = useRouter();
  if (!session) {
    return (
      <div className="rounded-lg p-4">
        <Button variant="outline" onClick={() => router.push("/login?callbackUrl=/posts/" + postId)} className="border-success text-success" >
          Add Comment
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    createComment.mutate(
      { content: content.trim() },
      {
        onSuccess: () => {
          setContent("");
          toast.success("Comment added successfully!");
        },
        onError: (error) => {
          console.error("Failed to create comment:", error);
          toast.error("Failed to add comment. Please try again.");
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind..."
        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        rows={3}
        maxLength={255}
      />
      
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-gray-500">
          {content.length}/255 characters
        </span>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setContent("")}
            disabled={!content.trim() || createComment.isPending}
            className="border-green-500 text-green-600"
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={!content.trim() || createComment.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {createComment.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
} 