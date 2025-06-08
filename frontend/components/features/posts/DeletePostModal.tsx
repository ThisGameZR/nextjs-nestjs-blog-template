"use client";

import { useDeletePost } from "@/queries";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function DeletePostModal({ isOpen, onClose, postId }: DeletePostModalProps) {
  const deletePost = useDeletePost();

  const handleDelete = () => {
    deletePost.mutate(postId, {
      onSuccess: () => {
        toast.success("Post deleted successfully!");
        onClose();
      },
      onError: (error) => {
        console.error("Failed to delete post:", error);
        toast.error(`Failed to delete post: ${error.message}`);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Please confirm if you wish to delete the post
          </h2>
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete the post?<br />
            Once deleted, it cannot be recovered.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={deletePost.isPending}
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deletePost.isPending}
            className="flex-1 px-6 bg-red-500 hover:bg-red-600 text-white"
          >
            {deletePost.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
} 