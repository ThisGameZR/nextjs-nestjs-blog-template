import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorState({ 
  message = "Failed to load posts", 
  onRetry,
  retryText = "Try Again"
}: ErrorStateProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 text-center py-12">
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>{retryText}</Button>
      )}
    </div>
  );
} 