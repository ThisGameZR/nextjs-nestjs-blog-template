import { apiClient } from './apiClient';
import { 
  PostResponse, 
  PostsResponse, 
  CreatePostRequest, 
  UpdatePostRequest, 
  PostQueryParams 
} from '@/types/post';

export class PostService {
  /**
   * Create a new post
   * POST /posts
   * Requires authentication
   */
  async createPost(postData: CreatePostRequest): Promise<PostResponse> {
    return apiClient.post<PostResponse>('/posts', postData);
  }

  /**
   * Get all posts with pagination and filtering
   * GET /posts
   * Public endpoint
   */
  async getPosts(params?: PostQueryParams): Promise<PostsResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    
    const url = `/posts${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<PostsResponse>(url);
  }

  /**
   * Get a specific post by ID
   * GET /posts/:id
   * Public endpoint
   */
  async getPost(id: string): Promise<PostResponse> {
    return apiClient.get<PostResponse>(`/posts/${id}`);
  }

  /**
   * Update a post (owner only)
   * PATCH /posts/:id
   * Requires authentication
   */
  async updatePost(id: string, postData: UpdatePostRequest): Promise<PostResponse> {
    return apiClient.patch<PostResponse>(`/posts/${id}`, postData);
  }

  /**
   * Delete a post (owner only)
   * DELETE /posts/:id
   * Requires authentication
   */
  async deletePost(id: string): Promise<void> {
    return apiClient.delete<void>(`/posts/${id}`);
  }
}

export const postService = new PostService(); 