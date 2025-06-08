"use client";

import { useParams, useRouter } from "next/navigation";
import { usePost } from "@/queries";
import { useUser } from "@/queries/user.query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CommentSection } from "@/components/features/comments/CommentSection";
import MockAvatar from "@/components/common/MockAvatar";
import { formatRelativeTime } from "@/lib/date";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { data: post, isLoading, error } = usePost(postId);
  const { data: author } = useUser(post?.authorId || "");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-12">
        <p className="text-red-600 mb-4">Post not found</p>
        <Button onClick={() => router.push("/home")}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button 
        variant="ghost" 
        onClick={() => router.push("/home")}
        className="h-auto rounded-full bg-green-100 p-3 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="bg-white rounded-lg p-6">
        {/* Author info */}
        <div className="flex items-center space-x-3 mb-4">
          <MockAvatar size="small" />
          <div>
            <span className="font-medium text-gray-900">{author?.username}</span>
            <span className="text-gray-500 text-sm ml-2">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {post.category}
          </span>
        </div>

        {/* Post content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        <div className="prose max-w-none text-gray-700 mb-6">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Comments section */}
        <CommentSection postId={postId} />
      </div>
    </div>
  );
} 