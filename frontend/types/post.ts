import { BaseQueryParams, PaginatedResponse } from './common';

// Enum that matches backend PostCategory
export enum PostCategory {
  HISTORY = 'History',
  SCIENCE = 'Science',
  TECHNOLOGY = 'Technology',
  ART = 'Art',
  MUSIC = 'Music',
  SPORTS = 'Sports',
  OTHER = 'Other',
}

// Base post interface
export interface Post {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// Request DTOs
export interface CreatePostRequest {
  title: string;
  content: string;
  category: PostCategory;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  category?: PostCategory;
}

// Response DTOs
export interface PostResponse {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// Query parameters for posts
export interface PostQueryParams extends BaseQueryParams {
  category?: PostCategory;
  authorId?: string;
  search?: string;
}

// Paginated posts response
export interface PostsResponse extends PaginatedResponse<PostResponse> {}

// Post summary for list views
export interface PostSummary {
  id: string;
  title: string;
  category: PostCategory;
  authorId: string;
  createdAt: string;
} 