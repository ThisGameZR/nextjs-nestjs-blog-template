import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto, CommentQueryDto } from './dto/comment.dto';
import { PaginatedResponseDto, FilterCondition } from '../../common/pagination/pagination.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { LoggerService } from '../../common/logging/logger.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private readonly paginationService: PaginationService,
    private readonly logger: LoggerService,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: string): Promise<CommentResponseDto> {
    this.logger.log(`Creating new comment on post ${createCommentDto.postId} by user ${authorId}`, 'CommentService');

    // Verify that the post exists
    const post = await this.postRepository.findOne({
      where: { id: createCommentDto.postId },
    });

    if (!post) {
      this.logger.warn(`Post not found for comment creation: ${createCommentDto.postId}`, 'CommentService');
      throw new NotFoundException('Post not found');
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      authorId,
    });

    const savedComment = await this.commentRepository.save(comment);
    this.logger.log(`Comment created successfully: ${savedComment.id} on post ${createCommentDto.postId}`, 'CommentService');
    
    return this.toResponseDto(savedComment);
  }

  async findAll(queryDto: CommentQueryDto): Promise<PaginatedResponseDto<CommentResponseDto>> {
    this.logger.log('Fetching comments with pagination', 'CommentService');

    const { postId, authorId } = queryDto;
    const queryBuilder = this.commentRepository.createQueryBuilder('comment');

    // Prepare filters
    const filters: FilterCondition[] = [];
    
    if (postId) {
      filters.push({
        field: 'postId',
        operator: 'eq',
        value: postId,
      });
    }

    if (authorId) {
      filters.push({
        field: 'authorId',
        operator: 'eq',
        value: authorId,
      });
    }

    // Use pagination service with search fields and filters
    const result = await this.paginationService.paginate(
      queryBuilder,
      queryDto,
      (comment: Comment) => this.toResponseDto(comment),
      {
        searchFields: ['content'],
        filters,
        defaultSortField: 'createdAt',
      }
    );

    this.logger.log(
      `Fetched ${result.items.length} comments (page ${result.pagination.page}/${result.pagination.totalPages})`,
      'CommentService'
    );

    return result;
  }

  async findOne(id: string): Promise<CommentResponseDto> {
    this.logger.log(`Fetching comment by ID: ${id}`, 'CommentService');

    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      this.logger.warn(`Comment not found: ${id}`, 'CommentService');
      throw new NotFoundException('Comment not found');
    }

    return this.toResponseDto(comment);
  }

  async findByPostId(postId: string, queryDto: CommentQueryDto): Promise<PaginatedResponseDto<CommentResponseDto>> {
    this.logger.log(`Fetching comments for post: ${postId}`, 'CommentService');

    // Verify that the post exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      this.logger.warn(`Post not found: ${postId}`, 'CommentService');
      throw new NotFoundException('Post not found');
    }

    // Set postId filter and fetch comments
    const modifiedQuery = Object.assign(new CommentQueryDto(), queryDto, { postId });
    return this.findAll(modifiedQuery);
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<CommentResponseDto> {
    this.logger.log(`Updating comment: ${id} by user ${userId}`, 'CommentService');

    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      this.logger.warn(`Comment not found for update: ${id}`, 'CommentService');
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the author
    if (comment.authorId !== userId) {
      this.logger.warn(`Unauthorized update attempt on comment ${id} by user ${userId}`, 'CommentService');
      throw new ForbiddenException('You can only update your own comments');
    }

    const updatedComment = await this.commentRepository.save({
      ...comment,
      content: updateCommentDto.content ? updateCommentDto.content : comment.content,
      updatedAt: new Date(),
    });

    this.logger.log(`Comment updated successfully: ${id}`, 'CommentService');
    return this.toResponseDto(updatedComment);
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting comment: ${id} by user ${userId}`, 'CommentService');

    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      this.logger.warn(`Comment not found for deletion: ${id}`, 'CommentService');
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the author
    if (comment.authorId !== userId) {
      this.logger.warn(`Unauthorized delete attempt on comment ${id} by user ${userId}`, 'CommentService');
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
    this.logger.log(`Comment deleted successfully: ${id}`, 'CommentService');
  }

  private toResponseDto(comment: Comment): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
} 