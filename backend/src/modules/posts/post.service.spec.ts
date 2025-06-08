import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostService } from './post.service';
import { Post, PostCategory } from '../../database/entities/post.entity';
import { User } from '../../database/entities/user.entity';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dto/post.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { LoggerService } from '../../common/logging/logger.service';

describe('PostService', () => {
  let service: PostService;
  let repository: jest.Mocked<Repository<Post>>;
  let paginationService: jest.Mocked<PaginationService>;
  let logger: jest.Mocked<LoggerService>;

  const mockPost: Post = {
    id: 'post-id-123',
    title: 'Test Post',
    content: 'This is a test post content',
    category: PostCategory.TECHNOLOGY,
    authorId: 'user-id-123',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    author: {} as User,
    comments: [],
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  } as unknown as jest.Mocked<SelectQueryBuilder<Post>>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockPaginationService = {
      paginate: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepository,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    repository = module.get(getRepositoryToken(Post));
    paginationService = module.get(PaginationService);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post successfully', async () => {
      const createPostDto: CreatePostDto = {
        title: 'New Post',
        content: 'New content',
        category: PostCategory.SCIENCE,
      };
      const authorId = 'user-id-123';

      repository.create.mockReturnValue(mockPost);
      repository.save.mockResolvedValue(mockPost);

      const result = await service.create(createPostDto, authorId);

      expect(repository.create).toHaveBeenCalledWith({
        ...createPostDto,
        authorId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockPost);
      expect(logger.log).toHaveBeenCalledWith(
        `Creating new post: ${createPostDto.title} by user ${authorId}`,
        'PostService'
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Post created successfully: ${mockPost.title} (ID: ${mockPost.id})`,
        'PostService'
      );
      expect(result).toEqual({
        id: mockPost.id,
        title: mockPost.title,
        content: mockPost.content,
        category: mockPost.category,
        authorId: mockPost.authorId,
        createdAt: mockPost.createdAt,
        updatedAt: mockPost.updatedAt,
      });
    });

    it('should handle database errors during post creation', async () => {
      const createPostDto: CreatePostDto = {
        title: 'New Post',
        content: 'New content',
        category: PostCategory.SCIENCE,
      };
      const authorId = 'user-id-123';
      const error = new Error('Database connection failed');

      repository.create.mockReturnValue(mockPost);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createPostDto, authorId)).rejects.toThrow(
        'Database connection failed'
      );

      expect(repository.create).toHaveBeenCalledWith({
        ...createPostDto,
        authorId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const queryDto = Object.assign(new PostQueryDto(), {
        page: 1,
        limit: 10,
        category: PostCategory.TECHNOLOGY,
        authorId: 'user-id-123',
      });

      const mockPaginatedResult = {
        items: [mockPost],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      paginationService.paginate.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll(queryDto);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('post');
      expect(paginationService.paginate).toHaveBeenCalledWith(
        mockQueryBuilder,
        queryDto,
        expect.any(Function),
        {
          searchFields: ['title', 'content'],
          filters: [
            {
              field: 'category',
              operator: 'eq',
              value: PostCategory.TECHNOLOGY,
            },
            {
              field: 'authorId',
              operator: 'eq',
              value: 'user-id-123',
            },
          ],
          defaultSortField: 'createdAt',
        }
      );
      expect(result).toEqual(mockPaginatedResult);
      expect(logger.log).toHaveBeenCalledWith(
        'Fetching posts with pagination',
        'PostService'
      );
    });

    it('should handle pagination service errors', async () => {
      const queryDto = Object.assign(new PostQueryDto(), {
        page: 1,
        limit: 10,
      });
      const error = new Error('Pagination failed');

      paginationService.paginate.mockRejectedValue(error);

      await expect(service.findAll(queryDto)).rejects.toThrow(
        'Pagination failed'
      );
    });
  });

  describe('findOne', () => {
    it('should find post by id', async () => {
      const id = 'post-id-123';
      repository.findOne.mockResolvedValue(mockPost);

      const result = await service.findOne(id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(logger.log).toHaveBeenCalledWith(
        `Fetching post by ID: ${id}`,
        'PostService'
      );
      expect(result).toEqual({
        id: mockPost.id,
        title: mockPost.title,
        content: mockPost.content,
        category: mockPost.category,
        authorId: mockPost.authorId,
        createdAt: mockPost.createdAt,
        updatedAt: mockPost.updatedAt,
      });
    });

    it('should throw NotFoundException when post not found', async () => {
      const id = 'nonexistent-id';
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow('Post not found');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(logger.warn).toHaveBeenCalledWith(
        `Post not found: ${id}`,
        'PostService'
      );
    });
  });

  describe('update', () => {
    it('should update post successfully', async () => {
      const id = 'post-id-123';
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated content',
      };
      const userId = 'user-id-123';
      const updatedPost = { ...mockPost, ...updatePostDto };

      repository.findOne.mockResolvedValue(mockPost);
      repository.save.mockResolvedValue(updatedPost);

      const result = await service.update(id, updatePostDto, userId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockPost,
        ...updatePostDto,
        updatedAt: expect.any(Date),
      });
      expect(logger.log).toHaveBeenCalledWith(
        `Updating post: ${id} by user ${userId}`,
        'PostService'
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Post updated successfully: ${id}`,
        'PostService'
      );
      expect(result).toEqual({
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        category: updatedPost.category,
        authorId: updatedPost.authorId,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
      });
    });

    it('should throw NotFoundException when post not found for update', async () => {
      const id = 'nonexistent-id';
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
      };
      const userId = 'user-id-123';

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(id, updatePostDto, userId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(id, updatePostDto, userId)).rejects.toThrow(
        'Post not found'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(repository.save).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Post not found for update: ${id}`,
        'PostService'
      );
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const id = 'post-id-123';
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
      };
      const userId = 'different-user-id';

      repository.findOne.mockResolvedValue(mockPost);

      await expect(service.update(id, updatePostDto, userId)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.update(id, updatePostDto, userId)).rejects.toThrow(
        'You can only update your own posts'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(repository.save).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Unauthorized update attempt on post ${id} by user ${userId}`,
        'PostService'
      );
    });
  });

  describe('remove', () => {
    it('should remove post successfully', async () => {
      const id = 'post-id-123';
      const userId = 'user-id-123';

      repository.findOne.mockResolvedValue(mockPost);
      repository.remove.mockResolvedValue(mockPost);

      await service.remove(id, userId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockPost);
      expect(logger.log).toHaveBeenCalledWith(
        `Deleting post: ${id} by user ${userId}`,
        'PostService'
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Post deleted successfully: ${id}`,
        'PostService'
      );
    });

    it('should throw NotFoundException when post not found for deletion', async () => {
      const id = 'nonexistent-id';
      const userId = 'user-id-123';

      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.remove(id, userId)).rejects.toThrow(
        'Post not found'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(repository.remove).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Post not found for deletion: ${id}`,
        'PostService'
      );
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const id = 'post-id-123';
      const userId = 'different-user-id';

      repository.findOne.mockResolvedValue(mockPost);

      await expect(service.remove(id, userId)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.remove(id, userId)).rejects.toThrow(
        'You can only delete your own posts'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(repository.remove).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Unauthorized delete attempt on post ${id} by user ${userId}`,
        'PostService'
      );
    });
  });
}); 