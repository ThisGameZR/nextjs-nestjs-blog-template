import { BaseQueryParams, PaginatedResponse } from './common';

// Base comment interface
export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// Request DTOs
export interface CreateCommentRequest {
  content: string;
  postId: string;
}

export interface CreateCommentNestedRequest {
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content?: string;
}

// Response DTOs
export interface CommentResponse {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// Query parameters for comments
export interface CommentQueryParams extends BaseQueryParams {
  postId?: string;
  authorId?: string;
  search?: string;
}

// Paginated comments response
export interface CommentsResponse extends PaginatedResponse<CommentResponse> {}