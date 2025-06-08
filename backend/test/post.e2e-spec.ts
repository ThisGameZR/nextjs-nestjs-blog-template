import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { getApp } from './setup';
import { cleanTestData } from './test-utils';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from '../src/modules/posts/dto/post.dto';
import { PostCategory } from '../src/database/entities/post.entity';
import { createAuthTestUtils, AuthTestUtils } from './auth-test.utils';

describe('Post Module (e2e)', () => {
  let app: any;
  let userToken: string;
  let userId: string;
  let anotherUserToken: string;
  let anotherUserId: string;
  let createdPostId: string;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    // Clean test data before each test to ensure test isolation
    await cleanTestData();
    
    const authUtils = createAuthTestUtils(app);
    
    // Create authenticated users for testing
    const user1 = await authUtils.createAuthenticatedUser('postuser1');
    const user2 = await authUtils.createAuthenticatedUser('postuser2');
    
    userToken = user1.token;
    userId = user1.userId;
    anotherUserToken = user2.token;
    anotherUserId = user2.userId;
  });

  describe('/posts (POST)', () => {
    describe('Success Cases', () => {
      it('should create a new post with valid data', async () => {
        const createPostDto: CreatePostDto = {
          title: 'Introduction to Machine Learning',
          content: 'This is a comprehensive guide to machine learning fundamentals and applications.',
          category: PostCategory.TECHNOLOGY,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Created successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('title', createPostDto.title);
        expect(response.body.data).toHaveProperty('content', createPostDto.content);
        expect(response.body.data).toHaveProperty('category', createPostDto.category);
        expect(response.body.data).toHaveProperty('authorId', userId);
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');

        // Store created post ID for other tests
        createdPostId = response.body.data.id;
      });

      it('should create post with all different categories', async () => {
        const categories = Object.values(PostCategory);
        
        for (const category of categories) {
          const createPostDto: CreatePostDto = {
            title: `Test Post for ${category}`,
            content: `This is a test post for the ${category} category.`,
            category,
          };

          const response = await request(app.getHttpServer())
            .post('/api/v1/posts')
            .set('Authorization', `Bearer ${userToken}`)
            .send(createPostDto)
            .expect(HttpStatus.CREATED);

          expect(response.body.data).toHaveProperty('category', category);
        }
      });

      it('should trim whitespace from title and content', async () => {
        const createPostDto = {
          title: '  Whitespace Test  ',
          content: '  This content has whitespace  ',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        expect(response.body.data).toHaveProperty('title', 'Whitespace Test');
        expect(response.body.data).toHaveProperty('content', 'This content has whitespace');
      });
    });

    describe('Validation Error Cases', () => {
      it('should return validation error when title is missing', async () => {
        const createPostDto = {
          content: 'This post has no title.',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Title cannot be empty'),
          ])
        );
      });

      it('should return validation error when content is missing', async () => {
        const createPostDto = {
          title: 'Post with no content',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Content cannot be empty'),
          ])
        );
      });

      it('should return validation error when category is missing', async () => {
        const createPostDto = {
          title: 'Post with no category',
          content: 'This post has no category.',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Category must be one of'),
          ])
        );
      });

      it('should return validation error when category is invalid', async () => {
        const createPostDto = {
          title: 'Post with invalid category',
          content: 'This post has an invalid category.',
          category: 'InvalidCategory' as any,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Category must be one of'),
          ])
        );
      });

      it('should return validation error when title exceeds max length', async () => {
        const createPostDto = {
          title: 'A'.repeat(256), // 256 characters, exceeds 255 limit
          content: 'Valid content',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Title must not exceed 255 characters'),
          ])
        );
      });

      it('should return validation error when content exceeds max length', async () => {
        const createPostDto = {
          title: 'Valid title',
          content: 'A'.repeat(256), // 256 characters, exceeds 255 limit
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Content must not exceed 255 characters'),
          ])
        );
      });

      it('should return validation error when title is empty string', async () => {
        const createPostDto = {
          title: '',
          content: 'Valid content',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Title cannot be empty'),
          ])
        );
      });

      it('should return validation error when content is empty string', async () => {
        const createPostDto = {
          title: 'Valid title',
          content: '',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Content cannot be empty'),
          ])
        );
      });
    });

    describe('Authentication Error Cases', () => {
      it('should return 401 when no token provided', async () => {
        const createPostDto: CreatePostDto = {
          title: 'Unauthorized Post',
          content: 'This should not be created.',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .send(createPostDto)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });

      it('should return 401 when invalid token provided', async () => {
        const createPostDto: CreatePostDto = {
          title: 'Unauthorized Post',
          content: 'This should not be created.',
          category: PostCategory.OTHER,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', 'Bearer invalid-token')
          .send(createPostDto)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });
    });
  });

  describe('/posts (GET)', () => {
    beforeEach(async () => {
      // Create some test posts for pagination testing (runs after auth setup in main beforeEach)
      const testPosts = [
        { title: 'Science Post 1', content: 'Content about science', category: PostCategory.SCIENCE },
        { title: 'Tech Post 1', content: 'Content about technology', category: PostCategory.TECHNOLOGY },
        { title: 'Art Post 1', content: 'Content about art', category: PostCategory.ART },
      ];

      for (const post of testPosts) {
        await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(post);
      }
    });

    describe('Success Cases', () => {
      it('should get all posts without authentication (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/posts')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.items.length).toBeGreaterThan(0);

        // Check first post structure
        const firstPost = response.body.data.items[0];
        expect(firstPost).toHaveProperty('id');
        expect(firstPost).toHaveProperty('title');
        expect(firstPost).toHaveProperty('content');
        expect(firstPost).toHaveProperty('category');
        expect(firstPost).toHaveProperty('authorId');
        expect(firstPost).toHaveProperty('createdAt');
        expect(firstPost).toHaveProperty('updatedAt');
      });

      it('should support pagination with limit and page', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/posts?limit=2&page=1')
          .expect(HttpStatus.OK);

        expect(response.body.data.items).toHaveLength(2);
        expect(response.body.data.pagination).toHaveProperty('limit', 2);
        expect(response.body.data.pagination).toHaveProperty('page', 1);
        expect(response.body.data.pagination).toHaveProperty('total');
        expect(response.body.data.pagination).toHaveProperty('totalPages');
        expect(response.body.data.pagination).toHaveProperty('hasNextPage');
        expect(response.body.data.pagination).toHaveProperty('hasPrevPage');
      });

      it('should support filtering by category', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/posts?category=${PostCategory.TECHNOLOGY}`)
          .expect(HttpStatus.OK);

        expect(response.body.data.items.every((post: any) => post.category === PostCategory.TECHNOLOGY)).toBe(true);
      });

      it('should support filtering by author', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/posts?authorId=${userId}`)
          .expect(HttpStatus.OK);

        expect(response.body.data.items.every((post: any) => post.authorId === userId)).toBe(true);
      });

      it('should support search functionality', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/posts?search=science')
          .expect(HttpStatus.OK);

        const posts = response.body.data.items;
        expect(posts.some((post: any) => 
          post.title.toLowerCase().includes('science') || 
          post.content.toLowerCase().includes('science')
        )).toBe(true);
      });

      it('should support sorting by different fields', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/posts?sortBy=title&sortOrder=asc')
          .expect(HttpStatus.OK);

        const posts = response.body.data.items;
        expect(posts.length).toBeGreaterThan(1);
        
        // Check if sorted by title ascending
        for (let i = 1; i < posts.length; i++) {
          expect(posts[i-1].title.localeCompare(posts[i].title)).toBeLessThanOrEqual(0);
        }
      });
    });

    describe('Validation Error Cases', () => {
      it('should return validation error for invalid category filter', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/posts?category=InvalidCategory')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Category filter must be one of'),
          ])
        );
      });

      it('should return validation error for invalid authorId format', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/posts?authorId=invalid-uuid')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Author ID must be a valid UUID'),
          ])
        );
      });

      it('should return validation error for search query too long', async () => {
        const longSearch = 'A'.repeat(101); // 101 characters, exceeds 100 limit
        const response = await request(app.getHttpServer())
          .get(`/api/v1/posts?search=${longSearch}`)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Search query must not exceed 100 characters'),
          ])
        );
      });
    });
  });

  describe('/posts/:id (GET)', () => {
    describe('Success Cases', () => {
      it('should get a specific post by ID without authentication (public endpoint)', async () => {
        // Create a test post first
        const createPostDto: CreatePostDto = {
          title: 'Test Post for GET by ID',
          content: 'This is a test post for GET by ID endpoint.',
          category: PostCategory.TECHNOLOGY,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        const postId = createResponse.body.data.id;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/posts/${postId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', postId);
        expect(response.body.data).toHaveProperty('title', createPostDto.title);
        expect(response.body.data).toHaveProperty('content', createPostDto.content);
        expect(response.body.data).toHaveProperty('category', createPostDto.category);
        expect(response.body.data).toHaveProperty('authorId');
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');
      });
    });

    describe('Error Cases', () => {
      it('should return 404 when post does not exist', async () => {
        const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
        const response = await request(app.getHttpServer())
          .get(`/api/v1/posts/${nonExistentId}`)
          .expect(HttpStatus.NOT_FOUND);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Post not found');
      });

      it('should return 400 when ID is not a valid UUID', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/posts/invalid-uuid')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed (uuid is expected)');
      });
    });
  });

  describe('/posts/:id (PATCH)', () => {
    describe('Success Cases', () => {
      it('should update own post with valid data', async () => {
        // Create a test post first
        const createPostDto: CreatePostDto = {
          title: 'Original Machine Learning Guide',
          content: 'This is the original guide to machine learning.',
          category: PostCategory.TECHNOLOGY,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        const postId = createResponse.body.data.id;

        const updatePostDto: UpdatePostDto = {
          title: 'Updated Machine Learning Guide',
          content: 'This is an updated and improved guide to machine learning.',
          category: PostCategory.SCIENCE,
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updatePostDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', postId);
        expect(response.body.data).toHaveProperty('title', updatePostDto.title);
        expect(response.body.data).toHaveProperty('content', updatePostDto.content);
        expect(response.body.data).toHaveProperty('category', updatePostDto.category);
        expect(response.body.data).toHaveProperty('authorId', userId);
      });

      it('should update post with partial data', async () => {
        // Create a test post first
        const createPostDto: CreatePostDto = {
          title: 'Original Title',
          content: 'Original content for partial update test.',
          category: PostCategory.TECHNOLOGY,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        const postId = createResponse.body.data.id;

        const updatePostDto: UpdatePostDto = {
          title: 'Partially Updated Title',
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updatePostDto)
          .expect(HttpStatus.OK);

        expect(response.body.data).toHaveProperty('title', updatePostDto.title);
        // the rest should be the same as original
        expect(response.body.data).toHaveProperty('content', createPostDto.content);
        expect(response.body.data).toHaveProperty('category', createPostDto.category);
        expect(response.body.data).toHaveProperty('authorId', userId);
      });
    });

    describe('Error Cases', () => {
      it('should return 403 when trying to update another user\'s post', async () => {
        // Create a post with the first user
        const createPostDto: CreatePostDto = {
          title: 'Post by first user',
          content: 'This post belongs to the first user.',
          category: PostCategory.OTHER,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        const firstUserPostId = createResponse.body.data.id;

        const updatePostDto: UpdatePostDto = {
          title: 'Unauthorized Update',
        };

        // Try to update it with the second user's token
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/posts/${firstUserPostId}`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send(updatePostDto)
          .expect(HttpStatus.FORBIDDEN);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'You can only update your own posts');
      });

      it('should return 404 when post does not exist', async () => {
        const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
        const updatePostDto: UpdatePostDto = {
          title: 'Non-existent Post Update',
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/posts/${nonExistentId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updatePostDto)
          .expect(HttpStatus.NOT_FOUND);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Post not found');
      });

      it('should return 401 when no authentication provided', async () => {
        // Create a test post first
        const createPostDto: CreatePostDto = {
          title: 'Test Post for 401',
          content: 'This post is for testing 401 error.',
          category: PostCategory.OTHER,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        const postId = createResponse.body.data.id;

        const updatePostDto: UpdatePostDto = {
          title: 'Unauthorized Update',
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/posts/${postId}`)
          .send(updatePostDto)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });

      it('should return validation error for invalid update data', async () => {
        // Create a test post first
        const createPostDto: CreatePostDto = {
          title: 'Test Post for Validation',
          content: 'This post is for testing validation errors.',
          category: PostCategory.OTHER,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        const postId = createResponse.body.data.id;

        const updatePostDto = {
          title: '', // Empty title
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updatePostDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Title cannot be empty'),
          ])
        );
      });
    });
  });

  describe('/posts/:id (DELETE)', () => {
    let postToDelete: string;

    beforeEach(async () => {
      // Create a post specifically for deletion testing (runs after auth setup in main beforeEach)
      const createPostDto: CreatePostDto = {
        title: 'Post to be deleted',
        content: 'This post will be deleted in tests.',
        category: PostCategory.OTHER,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPostDto)
        .expect(HttpStatus.CREATED);

      postToDelete = response.body.data.id;
    });

    describe('Success Cases', () => {
      it('should delete own post successfully', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/posts/${postToDelete}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.NO_CONTENT);

        expect(response.body).toEqual({});

        // Verify post is actually deleted
        await request(app.getHttpServer())
          .get(`/api/v1/posts/${postToDelete}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('Error Cases', () => {
      it('should return 403 when trying to delete another user\'s post', async () => {
        // Create a post with the first user
        const createPostDto: CreatePostDto = {
          title: 'Post by first user',
          content: 'This post belongs to the first user.',
          category: PostCategory.OTHER,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createPostDto)
          .expect(HttpStatus.CREATED);

        const firstUserPostId = createResponse.body.data.id;

        // Try to delete it with the second user's token
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/posts/${firstUserPostId}`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .expect(HttpStatus.FORBIDDEN);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'You can only delete your own posts');
      });

      it('should return 404 when post does not exist', async () => {
        const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/posts/${nonExistentId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.NOT_FOUND);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Post not found');
      });

      it('should return 401 when no authentication provided', async () => {
        // Use the post created in beforeEach for this test
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/posts/${postToDelete}`)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or expired token');
      });

      it('should return 400 when ID is not a valid UUID', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/v1/posts/invalid-uuid')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed (uuid is expected)');
      });
    });
  });
}); 