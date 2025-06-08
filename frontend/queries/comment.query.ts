import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { commentService } from '@/services/comment.service';
import { 
  CommentResponse, 
  CommentsResponse, 
  CreateCommentRequest, 
  CreateCommentNestedRequest,
  UpdateCommentRequest, 
  CommentQueryParams 
} from '@/types/comment';

// Simple query keys
export const commentKeys = {
  all: ['comments'] as const,
  list: (params?: CommentQueryParams) => ['comments', 'list', params] as const,
  postComments: (postId: string, params?: CommentQueryParams) => 
    ['comments', 'post', postId, params] as const,
  detail: (id: string) => ['comments', 'detail', id] as const,
};

// Query Hooks
export function useComments(params?: CommentQueryParams) {
  return useQuery({
    queryKey: commentKeys.list(params),
    queryFn: () => commentService.getComments(params),
  });
}

export function usePostComments(postId: string, params?: CommentQueryParams) {
  return useQuery({
    queryKey: commentKeys.postComments(postId, params),
    queryFn: () => commentService.getPostComments(postId, params),
    enabled: !!postId,
  });
}

export function useComment(id: string) {
  return useQuery({
    queryKey: commentKeys.detail(id),
    queryFn: () => commentService.getComment(id),
    enabled: !!id,
  });
}

// Mutation Hooks
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: commentService.createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useCreateCommentOnPost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentNestedRequest) => commentService.createCommentOnPost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentRequest }) => 
      commentService.updateComment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; postId: string }) => commentService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
} 