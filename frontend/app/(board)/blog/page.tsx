"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useInfinitePosts } from "@/queries";
import { PostCategory, PostsResponse, PostResponse } from "@/types/post";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/features/search/PageHeader";
import { PostCard } from "@/components/features/posts/PostCard";
import { EditPostModal } from "@/components/features/posts/EditPostModal";
import { DeletePostModal } from "@/components/features/posts/DeletePostModal";
import { useDebounce, useIntersectionObserver } from "@/lib/hooks";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

// Custom hook for managing local search and category state
function useFilters() {
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<PostCategory | null>(null);
  
  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  const handleCategoryChange = useCallback((newCategory: PostCategory | null) => {
    setCategory(newCategory);
  }, []);

  return {
    searchInput,
    setSearchInput,
    category,
    search: debouncedSearch,
    handleCategoryChange
  };
}

export default function BlogPage() {
  const {
    searchInput,
    setSearchInput,
    category,
    search,
    handleCategoryChange
  } = useFilters();

  const router = useRouter();
  const { data: session } = useSession();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);

  // Memoize query parameters to prevent unnecessary re-renders
  // Include authorId to filter only current user's posts
  const queryParams = useMemo(() => ({
    category: category || undefined,
    search: search || undefined,
    authorId: session?.user?.id || undefined,
    limit: 5,
  }), [category, search, session?.user?.id]);

  // Fetch posts with infinite scrolling
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfinitePosts(queryParams);

  // Flatten all pages into a single array of posts
  const allPosts = useMemo(() => {
    if (!data || !('pages' in data)) return [];
    return (data as { pages: PostsResponse[] }).pages.flatMap((page: PostsResponse) => page.items);
  }, [data]);

  const handlePostClick = useCallback((postId: string) => {
    router.push(`/posts/${postId}`);
  }, [router]);

  const handleCommentClick = useCallback((postId: string) => {
    router.push(`/posts/${postId}#comments`);
  }, [router]);

  const handleEditClick = useCallback((postId: string) => {
    const post = allPosts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setEditModalOpen(true);
    }
  }, [allPosts]);

  const handleDeleteClick = useCallback(async (postId: string) => {
    const post = allPosts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setDeleteModalOpen(true);
    }
  }, [allPosts]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreateClick = useCallback(() => {
    router.push("/create-post");
  }, [router]);

  // Handle search input change
  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
  }, [setSearchInput]);

  // Modal handlers
  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setSelectedPost(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedPost(null);
  }, []);

  // Intersection observer for infinite scrolling
  const loadMoreRef = useIntersectionObserver({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={handleRetry} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <PageHeader
        searchValue={searchInput}
        selectedCategory={category}
        onSearchChange={setSearchInput}
        onSearch={handleSearch}
        onCategoryChange={handleCategoryChange}
        onCreateClick={handleCreateClick}
      />

      {/* Posts */}
      <div>
        {allPosts.length > 0 ? (
          <>
            {allPosts.map((post: PostResponse) => (
              <PostCard 
                key={post.id} 
                post={post}
                onPostClick={handlePostClick}
                onCommentClick={handleCommentClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                searchTerm={search || ""}
                currentUserId={session?.user?.id}
                showActions={true}
              />
            ))}
            
            {/* Load more trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage ? (
                  <div className="text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <span className="ml-2 text-gray-600">Loading more posts...</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => fetchNextPage()}
                    variant="outline"
                    className="w-32"
                  >
                    Load More
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <EmptyState hasSearch={!!(search || category)} />
        )}
      </div>

      {/* Modals */}
      {selectedPost && (
        <>
          <EditPostModal
            isOpen={editModalOpen}
            onClose={handleCloseEditModal}
            post={selectedPost}
          />
          <DeletePostModal
            isOpen={deleteModalOpen}
            onClose={handleCloseDeleteModal}
            postId={selectedPost.id}
          />
        </>
      )}
    </div>
  );
} 