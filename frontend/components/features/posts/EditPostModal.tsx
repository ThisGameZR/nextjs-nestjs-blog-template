"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useUpdatePost } from "@/queries";
import { PostCategory, PostResponse } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommunityDropdown } from "@/components/features/search/CommunityDropdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  content: z.string().min(1, "Content is required").max(255, "Content must not exceed 255 characters").trim(),
  category: z.nativeEnum(PostCategory, {
    required_error: "Please select a community",
    invalid_type_error: "Please select a valid community"
  })
});

type UpdatePostFormData = z.infer<typeof updatePostSchema>;

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostResponse;
}

export function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<UpdatePostFormData>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      title: "",
      content: "",
      category: undefined
    },
    mode: "onChange"
  });

  const category = watch("category");

  const updatePost = useUpdatePost();

  // Set form values when post data is available
  useEffect(() => {
    if (post && isOpen) {
      setValue("title", post.title);
      setValue("content", post.content);
      setValue("category", post.category);
    }
  }, [post, isOpen, setValue]);

  const onSubmit = (data: UpdatePostFormData) => {
    updatePost.mutate(
      { 
        id: post.id, 
        data: {
          title: data.title,
          content: data.content,
          category: data.category
        }
      },
      {
        onSuccess: () => {
          toast.success("Post updated successfully!");
          reset();
          onClose();
        },
        onError: (error) => {
          console.error("Failed to update post:", error);
          toast.error(`Failed to update post: ${error.message}`);
        }
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-medium text-gray-900">Edit Post</h2>
          <button 
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Community Dropdown */}
          <div>
            <CommunityDropdown
              selectedCategory={category}
              onCategoryChange={(value) => setValue("category", value!, { shouldValidate: true })}
              className={cn("w-full", errors.category ? "border-red-500 text-red-500" : "border-success text-success")}
            />
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <Input
              type="text"
              placeholder="Title"
              {...register("title")}
              className="w-full border-gray-300"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Content Textarea */}
          <div>
            <textarea
              placeholder="What's on your mind..."
              {...register("content")}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-6 border-success text-success"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={updatePost.isPending || !isValid}
              className="px-6 bg-success hover:bg-success/90 text-white"
            >
              {updatePost.isPending ? "Updating..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 