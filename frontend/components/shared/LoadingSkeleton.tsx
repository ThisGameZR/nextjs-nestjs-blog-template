interface LoadingSkeletonProps {
  showHeader?: boolean;
  postCount?: number;
}

export function LoadingSkeleton({ 
  showHeader = true, 
  postCount = 3 
}: LoadingSkeletonProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex gap-4 mb-6">
          <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-32 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-24 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      )}
      
      {/* Post skeletons */}
      {[...Array(postCount)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-6 mb-4 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
} 