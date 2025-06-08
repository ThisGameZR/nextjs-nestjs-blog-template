import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto, CommentQueryDto, CreateCommentNestedDto } from './dto/comment.dto';
import { PaginatedResponseDto } from '../../common/pagination/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Comments')
@ApiBearerAuth('JWT-auth')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new comment',
    description: 'Create a new comment on a post. Requires authentication. The authenticated user becomes the author of the comment.'
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Post not found' 
  })
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto> {
    return this.commentService.create(createCommentDto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get all comments with pagination and filtering',
    description: 'Retrieve comments with optional search, post filtering, author filtering, and pagination. No authentication required.'
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: PaginatedResponseDto<CommentResponseDto>,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid query parameters' 
  })
  async findAll(@Query() queryDto: CommentQueryDto): Promise<PaginatedResponseDto<CommentResponseDto>> {
    return this.commentService.findAll(queryDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ 
    summary: 'Get a comment by ID',
    description: 'Retrieve a specific comment by its unique identifier. No authentication required.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Comment unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Comment retrieved successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Comment not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid UUID format' 
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CommentResponseDto> {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update a comment (owner only)',
    description: 'Update an existing comment. Only the author of the comment can update it. Requires authentication.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Comment unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data or UUID format' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Only the comment author can update this comment' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Comment not found' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto> {
    return this.commentService.update(id, updateCommentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete a comment (owner only)',
    description: 'Delete an existing comment. Only the author of the comment can delete it. Requires authentication.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Comment unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Comment deleted successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid UUID format' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Only the comment author can delete this comment' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Comment not found' 
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string): Promise<void> {
    return this.commentService.remove(id, userId);
  }
}

// Additional controller for post-specific comment endpoints
@ApiTags('Posts')
@Controller('posts/:postId/comments')
export class PostCommentsController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get all comments for a specific post',
    description: 'Retrieve all comments for a specific post with pagination and filtering. No authentication required.'
  })
  @ApiParam({ 
    name: 'postId', 
    description: 'Post unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: PaginatedResponseDto<CommentResponseDto>,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid query parameters or UUID format' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Post not found' 
  })
  async findCommentsByPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() queryDto: CommentQueryDto
  ): Promise<PaginatedResponseDto<CommentResponseDto>> {
    return this.commentService.findByPostId(postId, queryDto);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new comment on a specific post',
    description: 'Create a new comment on a specific post. Requires authentication. The postId is taken from the URL.'
  })
  @ApiParam({ 
    name: 'postId', 
    description: 'Post unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data or UUID format' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Post not found' 
  })
  async createCommentOnPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createCommentDto: CreateCommentNestedDto,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto> {
    const fullCreateDto: CreateCommentDto = {
      ...createCommentDto,
      postId,
    };
    return this.commentService.create(fullCreateDto, userId);
  }
} 