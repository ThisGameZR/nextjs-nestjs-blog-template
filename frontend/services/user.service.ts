import { UserResponse } from '@/types';
import { apiClient } from './apiClient';

export class UserService {
  /**
   * Get a specific user by ID
   * GET /users/:id
   * Public endpoint
   */
  async getUser(id: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/user/${id}`);
  }
}

export const userService = new UserService();