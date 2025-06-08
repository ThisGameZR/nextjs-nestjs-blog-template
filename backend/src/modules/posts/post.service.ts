import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../database/entities/post.entity';
import { CreatePostDto, UpdatePostDto, PostResponseDto, PostQueryDto } from './dto/post.dto';
import { PaginatedResponseDto, FilterCondition } from '../../common/pagination/pagination.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { LoggerService } from '../../common/logging/logger.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private readonly paginationService: PaginationService,
    private readonly logger: LoggerService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<PostResponseDto> {
    this.logger.log(`Creating new post: ${createPostDto.title} by user ${authorId}`, 'PostService');

    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
    });

    const savedPost = await this.postRepository.save(post);
    this.logger.log(`Post created successfully: ${savedPost.title} (ID: ${savedPost.id})`, 'PostService');
    
    return this.toResponseDto(savedPost);
  }

  async findAll(queryDto: PostQueryDto): Promise<PaginatedResponseDto<PostResponseDto>> {
    this.logger.log('Fetching posts with pagination', 'PostService');

    const { category, authorId } = queryDto;
    const queryBuilder = this.postRepository.createQueryBuilder('post');

    // Prepare filters
    const filters: FilterCondition[] = [];
    
    if (category) {
      filters.push({
        field: 'category',
        operator: 'eq',
        value: category,
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
      (post: Post) => this.toResponseDto(post),
      {
        searchFields: ['title', 'content'],
        filters,
        defaultSortField: 'createdAt',
      }
    );

    this.logger.log(
      `Fetched ${result.items.length} posts (page ${result.pagination.page}/${result.pagination.totalPages})`,
      'PostService'
    );

    return result;
  }

  async findOne(id: string): Promise<PostResponseDto> {
    this.logger.log(`Fetching post by ID: ${id}`, 'PostService');

    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      this.logger.warn(`Post not found: ${id}`, 'PostService');
      throw new NotFoundException('Post not found');
    }

    return this.toResponseDto(post);
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string): Promise<PostResponseDto> {
    this.logger.log(`Updating post: ${id} by user ${userId}`, 'PostService');

    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      this.logger.warn(`Post not found for update: ${id}`, 'PostService');
      throw new NotFoundException('Post not found');
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      this.logger.warn(`Unauthorized update attempt on post ${id} by user ${userId}`, 'PostService');
      throw new ForbiddenException('You can only update your own posts');
    }
    const updatedPost = await this.postRepository.save({
      ...post,
      title: updatePostDto.title ? updatePostDto.title : post.title,
      content: updatePostDto.content ? updatePostDto.content : post.content,
      category: updatePostDto.category ? updatePostDto.category : post.category,
      updatedAt: new Date(),
    });

    this.logger.log(`Post updated successfully: ${id}`, 'PostService');
    return this.toResponseDto(updatedPost);
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting post: ${id} by user ${userId}`, 'PostService');

    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      this.logger.warn(`Post not found for deletion: ${id}`, 'PostService');
      throw new NotFoundException('Post not found');
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      this.logger.warn(`Unauthorized delete attempt on post ${id} by user ${userId}`, 'PostService');
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepository.remove(post);
    this.logger.log(`Post deleted successfully: ${id}`, 'PostService');
  }

  private toResponseDto(post: Post): PostResponseDto {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
} 