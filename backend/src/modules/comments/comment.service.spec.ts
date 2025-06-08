import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dto/comment.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { LoggerService } from '../../common/logging/logger.service';
import { User } from '../../database/entities/user.entity';
import { PostCategory } from '../../database/entities/post.entity';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: jest.Mocked<Repository<Comment>>;
  let postRepository: jest.Mocked<Repository<Post>>;
  let paginationService: jest.Mocked<PaginationService>;
  let logger: jest.Mocked<LoggerService>;

  const mockComment: Comment = {
    id: 'comment-id-123',
    content: 'This is a test comment',
    postId: 'post-id-123',
    authorId: 'user-id-123',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    author: {} as User,
    post: {} as Post,
  };

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
  } as unknown as jest.Mocked<SelectQueryBuilder<Comment>>;

  beforeEach(async () => {
    const mockCommentRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockPostRepository = {
      findOne: jest.fn(),
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
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
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

    service = module.get<CommentService>(CommentService);
    commentRepository = module.get(getRepositoryToken(Comment));
    postRepository = module.get(getRepositoryToken(Post));
    paginationService = module.get(PaginationService);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new comment successfully', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'New comment',
        postId: 'post-id-123',
      };
      const authorId = 'user-id-123';

      postRepository.findOne.mockResolvedValue(mockPost);
      commentRepository.create.mockReturnValue(mockComment);
      commentRepository.save.mockResolvedValue(mockComment);

      const result = await service.create(createCommentDto, authorId);

      expect(postRepository.findOne).toHaveBeenCalledWith({
        where: { id: createCommentDto.postId },
      });
      expect(commentRepository.create).toHaveBeenCalledWith({
        ...createCommentDto,
        authorId,
      });
      expect(commentRepository.save).toHaveBeenCalledWith(mockComment);
      expect(logger.log).toHaveBeenCalledWith(
        `Creating new comment on post ${createCommentDto.postId} by user ${authorId}`,
        'CommentService'
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Comment created successfully: ${mockComment.id} on post ${createCommentDto.postId}`,
        'CommentService'
      );
      expect(result).toEqual({
        id: mockComment.id,
        content: mockComment.content,
        postId: mockComment.postId,
        authorId: mockComment.authorId,
        createdAt: mockComment.createdAt,
        updatedAt: mockComment.updatedAt,
      });
    });

    it('should throw NotFoundException when post not found', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'New comment',
        postId: 'nonexistent-post-id',
      };
      const authorId = 'user-id-123';

      postRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createCommentDto, authorId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create(createCommentDto, authorId)).rejects.toThrow(
        'Post not found'
      );

      expect(postRepository.findOne).toHaveBeenCalledWith({
        where: { id: createCommentDto.postId },
      });
      expect(commentRepository.create).not.toHaveBeenCalled();
      expect(commentRepository.save).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Post not found for comment creation: ${createCommentDto.postId}`,
        'CommentService'
      );
    });

    it('should handle database errors during comment creation', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'New comment',
        postId: 'post-id-123',
      };
      const authorId = 'user-id-123';
      const error = new Error('Database connection failed');

      postRepository.findOne.mockResolvedValue(mockPost);
      commentRepository.create.mockReturnValue(mockComment);
      commentRepository.save.mockRejectedValue(error);

      await expect(service.create(createCommentDto, authorId)).rejects.toThrow(
        'Database connection failed'
      );

      expect(postRepository.findOne).toHaveBeenCalledWith({
        where: { id: createCommentDto.postId },
      });
      expect(commentRepository.create).toHaveBeenCalledWith({
        ...createCommentDto,
        authorId,
      });
      expect(commentRepository.save).toHaveBeenCalledWith(mockComment);
    });
  });

  describe('findAll', () => {
    it('should return paginated comments', async () => {
      const queryDto = Object.assign(new CommentQueryDto(), {
        page: 1,
        limit: 10,
        postId: 'post-id-123',
        authorId: 'user-id-123',
      });

      const mockPaginatedResult = {
        items: [mockComment],
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

      expect(commentRepository.createQueryBuilder).toHaveBeenCalledWith('comment');
      expect(paginationService.paginate).toHaveBeenCalledWith(
        mockQueryBuilder,
        queryDto,
        expect.any(Function),
        {
          searchFields: ['content'],
          filters: [
            {
              field: 'postId',
              operator: 'eq',
              value: 'post-id-123',
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
        'Fetching comments with pagination',
        'CommentService'
      );
    });

    it('should handle pagination service errors', async () => {
      const queryDto = Object.assign(new CommentQueryDto(), {
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
    it('should find comment by id', async () => {
      const id = 'comment-id-123';
      commentRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne(id);

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(logger.log).toHaveBeenCalledWith(
        `Fetching comment by ID: ${id}`,
        'CommentService'
      );
      expect(result).toEqual({
        id: mockComment.id,
        content: mockComment.content,
        postId: mockComment.postId,
        authorId: mockComment.authorId,
        createdAt: mockComment.createdAt,
        updatedAt: mockComment.updatedAt,
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      const id = 'nonexistent-id';
      commentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow('Comment not found');

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(logger.warn).toHaveBeenCalledWith(
        `Comment not found: ${id}`,
        'CommentService'
      );
    });
  });

  describe('findByPostId', () => {
    it('should find comments by post id', async () => {
      const postId = 'post-id-123';
      const queryDto = Object.assign(new CommentQueryDto(), {
        page: 1,
        limit: 10,
      });

      const mockPaginatedResult = {
        items: [mockComment],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      postRepository.findOne.mockResolvedValue(mockPost);
      paginationService.paginate.mockResolvedValue(mockPaginatedResult);

      const result = await service.findByPostId(postId, queryDto);

      expect(postRepository.findOne).toHaveBeenCalledWith({
        where: { id: postId },
      });
      expect(logger.log).toHaveBeenCalledWith(
        `Fetching comments for post: ${postId}`,
        'CommentService'
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw NotFoundException when post not found', async () => {
      const postId = 'nonexistent-post-id';
      const queryDto = Object.assign(new CommentQueryDto(), {
        page: 1,
        limit: 10,
      });

      postRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPostId(postId, queryDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findByPostId(postId, queryDto)).rejects.toThrow(
        'Post not found'
      );

      expect(postRepository.findOne).toHaveBeenCalledWith({
        where: { id: postId },
      });
      expect(logger.warn).toHaveBeenCalledWith(
        `Post not found: ${postId}`,
        'CommentService'
      );
    });
  });

  describe('update', () => {
    it('should update comment successfully', async () => {
      const id = 'comment-id-123';
      const updateCommentDto: UpdateCommentDto = {
        content: 'Updated content',
      };
      const userId = 'user-id-123';
      const updatedComment = { ...mockComment, ...updateCommentDto };

      commentRepository.findOne.mockResolvedValue(mockComment);
      commentRepository.save.mockResolvedValue(updatedComment);

      const result = await service.update(id, updateCommentDto, userId);

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(commentRepository.save).toHaveBeenCalledWith({
        ...mockComment,
        ...updateCommentDto,
        updatedAt: expect.any(Date),
      });
      expect(logger.log).toHaveBeenCalledWith(
        `Updating comment: ${id} by user ${userId}`,
        'CommentService'
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Comment updated successfully: ${id}`,
        'CommentService'
      );
      expect(result).toEqual({
        id: updatedComment.id,
        content: updatedComment.content,
        postId: updatedComment.postId,
        authorId: updatedComment.authorId,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
      });
    });

    it('should throw NotFoundException when comment not found for update', async () => {
      const id = 'nonexistent-id';
      const updateCommentDto: UpdateCommentDto = {
        content: 'Updated content',
      };
      const userId = 'user-id-123';

      commentRepository.findOne.mockResolvedValue(null);

      await expect(service.update(id, updateCommentDto, userId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(id, updateCommentDto, userId)).rejects.toThrow(
        'Comment not found'
      );

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(commentRepository.save).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Comment not found for update: ${id}`,
        'CommentService'
      );
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const id = 'comment-id-123';
      const updateCommentDto: UpdateCommentDto = {
        content: 'Updated content',
      };
      const userId = 'different-user-id';

      commentRepository.findOne.mockResolvedValue(mockComment);

      await expect(service.update(id, updateCommentDto, userId)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.update(id, updateCommentDto, userId)).rejects.toThrow(
        'You can only update your own comments'
      );

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(commentRepository.save).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Unauthorized update attempt on comment ${id} by user ${userId}`,
        'CommentService'
      );
    });
  });

  describe('remove', () => {
    it('should remove comment successfully', async () => {
      const id = 'comment-id-123';
      const userId = 'user-id-123';

      commentRepository.findOne.mockResolvedValue(mockComment);
      commentRepository.remove.mockResolvedValue(mockComment);

      await service.remove(id, userId);

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(commentRepository.remove).toHaveBeenCalledWith(mockComment);
      expect(logger.log).toHaveBeenCalledWith(
        `Deleting comment: ${id} by user ${userId}`,
        'CommentService'
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Comment deleted successfully: ${id}`,
        'CommentService'
      );
    });

    it('should throw NotFoundException when comment not found for deletion', async () => {
      const id = 'nonexistent-id';
      const userId = 'user-id-123';

      commentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.remove(id, userId)).rejects.toThrow(
        'Comment not found'
      );

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(commentRepository.remove).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Comment not found for deletion: ${id}`,
        'CommentService'
      );
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const id = 'comment-id-123';
      const userId = 'different-user-id';

      commentRepository.findOne.mockResolvedValue(mockComment);

      await expect(service.remove(id, userId)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.remove(id, userId)).rejects.toThrow(
        'You can only delete your own comments'
      );

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(commentRepository.remove).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Unauthorized delete attempt on comment ${id} by user ${userId}`,
        'CommentService'
      );
    });
  });
}); 