interface EmptyStateProps {
  title?: string;
  description?: string;
  hasSearch?: boolean;
  isUserPosts?: boolean;
}

export function EmptyState({ 
  title,
  description,
  hasSearch = false,
  isUserPosts = false
}: EmptyStateProps) {
  const getTitle = () => {
    if (title) return title;
    return "No posts found";
  };

  const getDescription = () => {
    if (description) return description;
    
    if (hasSearch) {
      return "Try a different search term or category.";
    }
    
    if (isUserPosts) {
      return "You haven't created any posts yet. Create your first post!";
    }
    
    return "Be the first to create a post!";
  };

  return (
    <div className="text-center py-12 bg-white rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{getTitle()}</h3>
      <p className="text-gray-600 mb-4">{getDescription()}</p>
    </div>
  );
} 