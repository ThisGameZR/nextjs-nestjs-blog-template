import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { getApp } from './setup';
import { cleanTestData } from './test-utils';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from '../src/modules/comments/dto/comment.dto';
import { CreatePostDto } from '../src/modules/posts/dto/post.dto';
import { PostCategory } from '../src/database/entities/post.entity';
import { createAuthTestUtils, AuthTestUtils } from './auth-test.utils';

describe('Comment Module (e2e)', () => {
  let app: any;
  let userToken: string;
  let userId: string;
  let anotherUserToken: string;
  let anotherUserId: string;
  let testPostId: string;
  let anotherPostId: string;
  let createdCommentId: string;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    // Clean test data before each test to ensure test isolation
    await cleanTestData();
    
    const authUtils = createAuthTestUtils(app);
    
    // Create authenticated users for testing
    const user1 = await authUtils.createAuthenticatedUser('commentuser1');
    const user2 = await authUtils.createAuthenticatedUser('commentuser2');
    
    userToken = user1.token;
    userId = user1.userId;
    anotherUserToken = user2.token;
    anotherUserId = user2.userId;

    // Create test posts for comment testing
    const createPostDto1: CreatePostDto = {
      title: 'Test Post for Comments',
      content: 'This post will receive comments in our tests.',
      category: PostCategory.TECHNOLOGY,
    };

    const createPostDto2: CreatePostDto = {
      title: 'Another Test Post',
      content: 'This is another post for testing purposes.',
      category: PostCategory.SCIENCE,
    };

    const postResponse1 = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(createPostDto1);

    const postResponse2 = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .send(createPostDto2);

    testPostId = postResponse1.body.data.id;
    anotherPostId = postResponse2.body.data.id;
  });

  describe('/comments (POST)', () => {
    describe('Success Cases', () => {
      it('should create a new comment with valid data', async () => {
        const createCommentDto: CreateCommentDto = {
          content: 'This is a great post! Thanks for sharing your insights about technology.',
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Created successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('content', createCommentDto.content);
        expect(response.body.data).toHaveProperty('postId', createCommentDto.postId);
        expect(response.body.data).toHaveProperty('authorId', userId);
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');

        // Store created comment ID for other tests
        createdCommentId = response.body.data.id;
      });

      it('should trim whitespace from content', async () => {
        const createCommentDto = {
          content: '  This comment has whitespace  ',
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        expect(response.body.data).toHaveProperty('content', 'This comment has whitespace');
      });

      it('should allow different users to comment on the same post', async () => {
        const createCommentDto: CreateCommentDto = {
          content: 'Another user\'s perspective on this interesting topic.',
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        expect(response.body.data).toHaveProperty('content', createCommentDto.content);
        expect(response.body.data).toHaveProperty('authorId', anotherUserId);
        expect(response.body.data).toHaveProperty('postId', testPostId);
      });
    });

    describe('Validation Error Cases', () => {
      it('should return validation error when content is missing', async () => {
        const createCommentDto = {
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Content cannot be empty')
        )).toBe(true);
      });

      it('should return validation error when postId is missing', async () => {
        const createCommentDto = {
          content: 'Comment without post ID',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Post ID must be a valid UUID')
        )).toBe(true);
      });

      it('should return validation error when postId is invalid UUID', async () => {
        const createCommentDto = {
          content: 'Comment with invalid post ID',
          postId: 'invalid-uuid',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Post ID must be a valid UUID')
        )).toBe(true);
      });

      it('should return validation error when content exceeds max length', async () => {
        const createCommentDto = {
          content: 'A'.repeat(256), // 256 characters, exceeds 255 limit
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Content must not exceed 255 characters')
        )).toBe(true);
      });

      it('should return validation error when content is empty string', async () => {
        const createCommentDto = {
          content: '',
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Content cannot be empty')
        )).toBe(true);
      });
    });

    describe('Business Logic Error Cases', () => {
      it('should return 400 when trying to comment with invalid UUID', async () => {
        const invalidPostId = '123e4567-e89b-12d3-a456-426614174000';
        const createCommentDto: CreateCommentDto = {
          content: 'Comment with invalid post ID',
          postId: invalidPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Post ID must be a valid UUID')
        )).toBe(true);
      });
    });

    describe('Authentication Error Cases', () => {
      it('should return 401 when no token provided', async () => {
        const createCommentDto: CreateCommentDto = {
          content: 'Unauthorized comment',
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .send(createCommentDto)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });

      it('should return 401 when invalid token provided', async () => {
        const createCommentDto: CreateCommentDto = {
          content: 'Unauthorized comment',
          postId: testPostId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', 'Bearer invalid-token')
          .send(createCommentDto)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });
    });
  });

  describe('/comments (GET)', () => {
    beforeEach(async () => {
      // Create some test comments for pagination testing (runs after auth setup in main beforeEach)
      const testComments = [
        { content: 'First comment on test post', postId: testPostId },
        { content: 'Second comment on test post', postId: testPostId },
        { content: 'Comment on another post', postId: anotherPostId },
      ];

      for (const comment of testComments) {
        await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(comment);
      }
    });

    describe('Success Cases', () => {
      it('should get all comments without authentication (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/comments')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.items.length).toBeGreaterThan(0);

        // Check first comment structure
        const firstComment = response.body.data.items[0];
        expect(firstComment).toHaveProperty('id');
        expect(firstComment).toHaveProperty('content');
        expect(firstComment).toHaveProperty('postId');
        expect(firstComment).toHaveProperty('authorId');
        expect(firstComment).toHaveProperty('createdAt');
        expect(firstComment).toHaveProperty('updatedAt');
      });

      it('should support pagination with limit and page', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/comments?limit=2&page=1')
          .expect(HttpStatus.OK);

        expect(response.body.data.items).toHaveLength(2);
        expect(response.body.data.pagination).toHaveProperty('limit', 2);
        expect(response.body.data.pagination).toHaveProperty('page', 1);
        expect(response.body.data.pagination).toHaveProperty('total');
      });

      it('should support filtering by postId', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/comments?postId=${testPostId}`)
          .expect(HttpStatus.OK);

        expect(response.body.data.items.every((comment: any) => comment.postId === testPostId)).toBe(true);
      });

      it('should support filtering by authorId', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/comments?authorId=${userId}`)
          .expect(HttpStatus.OK);

        expect(response.body.data.items.every((comment: any) => comment.authorId === userId)).toBe(true);
      });

      it('should support search functionality', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/comments?search=first')
          .expect(HttpStatus.OK);

        const comments = response.body.data.items;
        expect(comments.some((comment: any) => 
          comment.content.toLowerCase().includes('first')
        )).toBe(true);
      });

      it('should support sorting by different fields', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/comments?sortBy=createdAt&sortOrder=desc')
          .expect(HttpStatus.OK);

        const comments = response.body.data.items;
        expect(comments.length).toBeGreaterThan(1);
        
        // Check if sorted by createdAt descending
        for (let i = 1; i < comments.length; i++) {
          expect(new Date(comments[i-1].createdAt).getTime()).toBeGreaterThanOrEqual(
            new Date(comments[i].createdAt).getTime()
          );
        }
      });
    });

    describe('Validation Error Cases', () => {
      it('should return validation error for invalid postId filter', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/comments?postId=invalid-uuid')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Post ID must be a valid UUID')
        )).toBe(true);
      });

      it('should return validation error for invalid authorId filter', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/comments?authorId=invalid-uuid')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Author ID must be a valid UUID')
        )).toBe(true);
      });

      it('should return validation error for search query too long', async () => {
        const longSearch = 'A'.repeat(101); // 101 characters, exceeds 100 limit
        const response = await request(app.getHttpServer())
          .get(`/api/v1/comments?search=${longSearch}`)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Search query must not exceed 100 characters')
        )).toBe(true);
      });
    });
  });

  describe('/comments/:id (GET)', () => {
    describe('Success Cases', () => {
      it('should get a specific comment by ID without authentication (public endpoint)', async () => {
        // Create a test comment first
        const createCommentDto: CreateCommentDto = {
          content: 'Test comment for GET by ID',
          postId: testPostId,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        const commentId = createResponse.body.data.id;
        
        const response = await request(app.getHttpServer())
          .get(`/api/v1/comments/${commentId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', commentId);
        expect(response.body.data).toHaveProperty('content', createCommentDto.content);
        expect(response.body.data).toHaveProperty('postId', createCommentDto.postId);
        expect(response.body.data).toHaveProperty('authorId', userId);
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');
      });
    });

    describe('Error Cases', () => {
      it('should return 404 when comment does not exist', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Valid UUID v4 format
        const response = await request(app.getHttpServer())
          .get(`/api/v1/comments/${nonExistentId}`)
          .expect(HttpStatus.NOT_FOUND);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Comment not found');
      });

      it('should return 400 when ID is not a valid UUID', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/comments/invalid-uuid')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed (uuid is expected)');
      });
    });
  });

  describe('/comments/:id (PATCH)', () => {
    describe('Success Cases', () => {
      it('should update own comment with valid data', async () => {
        // Create a test comment first
        const createCommentDto: CreateCommentDto = {
          content: 'Original comment content',
          postId: testPostId,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        const commentId = createResponse.body.data.id;
        
        const updateCommentDto: UpdateCommentDto = {
          content: 'This is an updated comment with more detailed insights about the post.',
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/comments/${commentId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateCommentDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', commentId);
        expect(response.body.data).toHaveProperty('content', updateCommentDto.content);
        expect(response.body.data).toHaveProperty('authorId', userId);
      });
    });

    describe('Error Cases', () => {
      it('should return 403 when trying to update another user\'s comment', async () => {
        // Create a comment with the first user
        const createCommentDto: CreateCommentDto = {
          content: 'Comment by first user',
          postId: testPostId,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        const firstUserCommentId = createResponse.body.data.id;
        
        const updateCommentDto: UpdateCommentDto = {
          content: 'Unauthorized update attempt',
        };

        // Try to update it with the second user's token
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/comments/${firstUserCommentId}`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send(updateCommentDto)
          .expect(HttpStatus.FORBIDDEN);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'You can only update your own comments');
      });

      it('should return 404 when comment does not exist', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Valid UUID v4 format
        const updateCommentDto: UpdateCommentDto = {
          content: 'Non-existent comment update',
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/comments/${nonExistentId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateCommentDto)
          .expect(HttpStatus.NOT_FOUND);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Comment not found');
      });

      it('should return 401 when no authentication provided', async () => {
        // Create a test comment first
        const createCommentDto: CreateCommentDto = {
          content: 'Test comment for 401',
          postId: testPostId,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        const commentId = createResponse.body.data.id;

        const updateCommentDto: UpdateCommentDto = {
          content: 'Unauthorized update',
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/comments/${commentId}`)
          .send(updateCommentDto)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });

      it('should return validation error for invalid update data', async () => {
        // Create a test comment first
        const createCommentDto: CreateCommentDto = {
          content: 'Test comment for validation',
          postId: testPostId,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        const commentId = createResponse.body.data.id;

        const updateCommentDto = {
          content: '', // Empty content
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/comments/${commentId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateCommentDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors.some((error: string) => 
          error.includes('Content cannot be empty')
        )).toBe(true);
      });
    });
  });

  describe('/comments/:id (DELETE)', () => {
    let commentToDelete: string;

    beforeEach(async () => {
      // Create a comment specifically for deletion testing (runs after auth setup in main beforeEach)
      const createCommentDto: CreateCommentDto = {
        content: 'Comment to be deleted in tests',
        postId: testPostId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createCommentDto)
        .expect(HttpStatus.CREATED);

      commentToDelete = response.body.data.id;
    });

    describe('Success Cases', () => {
      it('should delete own comment successfully', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/comments/${commentToDelete}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.NO_CONTENT);

        expect(response.body).toEqual({});

        // Verify comment is actually deleted
        await request(app.getHttpServer())
          .get(`/api/v1/comments/${commentToDelete}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('Error Cases', () => {
      it('should return 403 when trying to delete another user\'s comment', async () => {
        // Create a comment with the first user
        const createCommentDto: CreateCommentDto = {
          content: 'Comment by first user',
          postId: testPostId,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createCommentDto)
          .expect(HttpStatus.CREATED);

        const firstUserCommentId = createResponse.body.data.id;
        
        // Try to delete it with the second user's token
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/comments/${firstUserCommentId}`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .expect(HttpStatus.FORBIDDEN);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'You can only delete your own comments');
      });

      it('should return 404 when comment does not exist', async () => {
        const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/comments/${nonExistentId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.NOT_FOUND);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Comment not found');
      });

      it('should return 401 when no authentication provided', async () => {
        // Use the comment created in beforeEach for this test
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/comments/${commentToDelete}`)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });

      it('should return 400 when ID is not a valid UUID', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/v1/comments/invalid-uuid')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed (uuid is expected)');
      });
    });
  });

  describe('/posts/:postId/comments (Nested Routes)', () => {
    beforeEach(async () => {
      // Create some test comments for nested route testing (runs after auth setup in main beforeEach)
      const testComments = [
        { content: 'First comment on test post for nested routes', postId: testPostId },
        { content: 'Second comment on test post for nested routes', postId: testPostId },
      ];

      for (const comment of testComments) {
        await request(app.getHttpServer())
          .post('/api/v1/comments')
          .set('Authorization', `Bearer ${userToken}`)
          .send(comment);
      }
    });

    describe('GET /posts/:postId/comments', () => {
      describe('Success Cases', () => {
        it('should get all comments for a specific post without authentication (public endpoint)', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/posts/${testPostId}/comments`)
            .expect(HttpStatus.OK);

          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('message', 'Success');
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('items');
          expect(response.body.data).toHaveProperty('pagination');
          expect(Array.isArray(response.body.data.items)).toBe(true);

          // All comments should belong to the specified post
          expect(response.body.data.items.every((comment: any) => comment.postId === testPostId)).toBe(true);
        });

        it('should support pagination for post comments', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/posts/${testPostId}/comments?limit=1&page=1`)
            .expect(HttpStatus.OK);

          expect(response.body.data.items).toHaveLength(1);
          expect(response.body.data.pagination).toHaveProperty('limit', 1);
          expect(response.body.data.pagination).toHaveProperty('page', 1);
        });
      });

      describe('Error Cases', () => {
        it('should return 404 when post does not exist', async () => {
          const nonExistentPostId = '123e4567-e89b-12d3-a456-426614174000';
          const response = await request(app.getHttpServer())
            .get(`/api/v1/posts/${nonExistentPostId}/comments`)
            .expect(HttpStatus.NOT_FOUND);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('message', 'Post not found');
        });

        it('should return 400 when postId is not a valid UUID', async () => {
          const response = await request(app.getHttpServer())
            .get('/api/v1/posts/invalid-uuid/comments')
            .expect(HttpStatus.BAD_REQUEST);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('message', 'Validation failed (uuid is expected)');
        });
      });
    });

    describe('POST /posts/:postId/comments', () => {
      describe('Success Cases', () => {
        it('should create a comment on a specific post using nested route', async () => {
          const createCommentDto = {
            content: 'This comment is created using the nested route endpoint.',
          };

          const response = await request(app.getHttpServer())
            .post(`/api/v1/posts/${testPostId}/comments`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(createCommentDto)
            .expect(HttpStatus.CREATED);

          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('message', 'Created successfully');
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('content', createCommentDto.content);
          expect(response.body.data).toHaveProperty('postId', testPostId);
          expect(response.body.data).toHaveProperty('authorId', userId);
        });
      });

      describe('Error Cases', () => {
        it('should return 404 when trying to comment on non-existent post using nested route', async () => {
          const nonExistentPostId = '123e4567-e89b-12d3-a456-426614174000';
          const createCommentDto = {
            content: 'Comment on non-existent post via nested route',
          };

          const response = await request(app.getHttpServer())
            .post(`/api/v1/posts/${nonExistentPostId}/comments`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(createCommentDto)
            .expect(HttpStatus.NOT_FOUND);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('message', 'Post not found');
        });

        it('should return 401 when no authentication provided for nested route', async () => {
          const createCommentDto = {
            content: 'Unauthorized comment via nested route',
          };

          const response = await request(app.getHttpServer())
            .post(`/api/v1/posts/${testPostId}/comments`)
            .send(createCommentDto)
            .expect(HttpStatus.UNAUTHORIZED);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('message', 'Invalid or expired token');
        });

        it('should return validation error for invalid content in nested route', async () => {
          const createCommentDto = {
            content: '', // Empty content
          };

          const response = await request(app.getHttpServer())
            .post(`/api/v1/posts/${testPostId}/comments`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(createCommentDto)
            .expect(HttpStatus.BAD_REQUEST);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('message', 'Validation failed');
          expect(Array.isArray(response.body.validationErrors)).toBe(true);
          expect(response.body.validationErrors.some((error: string) => 
            error.includes('Content cannot be empty')
          )).toBe(true);
        });
      });
    });
  });
}); 