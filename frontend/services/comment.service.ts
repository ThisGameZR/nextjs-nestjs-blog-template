import { apiClient } from './apiClient';
import { 
  CommentResponse, 
  CommentsResponse, 
  CreateCommentRequest, 
  CreateCommentNestedRequest,
  UpdateCommentRequest, 
  CommentQueryParams 
} from '@/types/comment';

export class CommentService {
  /**
   * Create a new comment
   * POST /comments
   * Requires authentication
   */
  async createComment(commentData: CreateCommentRequest): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>('/comments', commentData);
  }

  /**
   * Create a comment on a specific post
   * POST /posts/:postId/comments
   * Requires authentication
   */
  async createCommentOnPost(postId: string, commentData: CreateCommentNestedRequest): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(`/posts/${postId}/comments`, commentData);
  }

  /**
   * Get all comments with pagination and filtering
   * GET /comments
   * Public endpoint
   */
  async getComments(params?: CommentQueryParams): Promise<CommentsResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    
    const url = `/comments${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<CommentsResponse>(url);
  }

  /**
   * Get all comments for a specific post
   * GET /posts/:postId/comments
   * Public endpoint
   */
  async getPostComments(postId: string, params?: CommentQueryParams): Promise<CommentsResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    
    const url = `/posts/${postId}/comments${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<CommentsResponse>(url);
  }

  /**
   * Get a specific comment by ID
   * GET /comments/:id
   * Public endpoint
   */
  async getComment(id: string): Promise<CommentResponse> {
    return apiClient.get<CommentResponse>(`/comments/${id}`);
  }

  /**
   * Update a comment (owner only)
   * PATCH /comments/:id
   * Requires authentication
   */
  async updateComment(id: string, commentData: UpdateCommentRequest): Promise<CommentResponse> {
    return apiClient.patch<CommentResponse>(`/comments/${id}`, commentData);
  }

  /**
   * Delete a comment (owner only)
   * DELETE /comments/:id
   * Requires authentication
   */
  async deleteComment(id: string): Promise<void> {
    return apiClient.delete<void>(`/comments/${id}`);
  }
}

export const commentService = new CommentService(); 