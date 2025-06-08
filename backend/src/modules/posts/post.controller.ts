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
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, PostResponseDto, PostQueryDto } from './dto/post.dto';
import { PaginatedResponseDto } from '../../common/pagination/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Posts')
@ApiBearerAuth('JWT-auth')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new post',
    description: 'Create a new post. Requires authentication. The authenticated user becomes the author of the post.'
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required' 
  })
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('id') userId: string,
  ): Promise<PostResponseDto> {
    return this.postService.create(createPostDto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get all posts with pagination and filtering',
    description: 'Retrieve posts with optional search, category filtering, author filtering, and pagination. No authentication required.'
  })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: PaginatedResponseDto<PostResponseDto>,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid query parameters' 
  })
  async findAll(@Query() queryDto: PostQueryDto): Promise<PaginatedResponseDto<PostResponseDto>> {
    return this.postService.findAll(queryDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ 
    summary: 'Get a post by ID',
    description: 'Retrieve a specific post by its unique identifier. No authentication required.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Post unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Post not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid UUID format' 
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PostResponseDto> {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update a post (owner only)',
    description: 'Update an existing post. Only the author of the post can update it. Requires authentication.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Post unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
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
    description: 'Forbidden - Only the post author can update this post' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Post not found' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser('id') userId: string,
  ): Promise<PostResponseDto> {
    return this.postService.update(id, updatePostDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete a post (owner only)',
    description: 'Delete an existing post. Only the author of the post can delete it. Requires authentication.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Post unique identifier (UUID)', 
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Post deleted successfully' 
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
    description: 'Forbidden - Only the post author can delete this post' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Post not found' 
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string): Promise<void> {
    return this.postService.remove(id, userId);
  }
} 