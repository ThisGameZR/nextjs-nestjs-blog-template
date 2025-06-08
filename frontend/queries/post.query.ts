import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery
} from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { 
  PostResponse, 
  PostsResponse, 
  CreatePostRequest, 
  UpdatePostRequest, 
  PostQueryParams 
} from '@/types/post';

export const postKeys = {
  all: ['posts'] as const,
  list: (params?: PostQueryParams) => ['posts', 'list', params] as const,
  infinite: (params?: Omit<PostQueryParams, 'page'>) => ['posts', 'infinite', params] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
};

export function usePosts(params?: PostQueryParams) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postService.getPosts(params),
  });
}

export function useInfinitePosts(params?: Omit<PostQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: postKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) => postService.getPosts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postService.getPost(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) => 
      postService.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
} 