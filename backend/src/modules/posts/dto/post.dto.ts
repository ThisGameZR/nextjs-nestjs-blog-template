import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsUUID, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PostCategory } from '../../../database/entities/post.entity';
import { BaseQueryDto } from '../../../common/pagination/base-query.dto';

// Base DTO with common validations
class BasePostDto {
  @ApiProperty({
    description: 'Title of the post',
    example: 'Introduction to Machine Learning',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    description: 'Content of the post',
    example: 'This is a comprehensive guide to machine learning fundamentals...',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(255, { message: 'Content must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  content: string;

  @ApiProperty({
    description: 'Category of the post',
    example: PostCategory.TECHNOLOGY,
    enum: PostCategory,
    enumName: 'PostCategory',
  })
  @IsEnum(PostCategory, { 
    message: `Category must be one of: ${Object.values(PostCategory).join(', ')}` 
  })
  category: PostCategory;
}

// Create DTO - extends base with all required fields
export class CreatePostDto extends BasePostDto {}

// Update DTO - makes all fields optional using PartialType
export class UpdatePostDto extends PartialType(BasePostDto) {
  @ApiPropertyOptional({
    description: 'Title of the post',
    example: 'Updated Introduction to Machine Learning',
    minLength: 1,
    maxLength: 255,
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Content of the post', 
    example: 'This is an updated comprehensive guide to machine learning...',
    minLength: 1,
    maxLength: 255,
  })
  content?: string;

  @ApiPropertyOptional({
    description: 'Category of the post',
    example: PostCategory.SCIENCE,
    enum: PostCategory,
    enumName: 'PostCategory',
  })
  category?: PostCategory;
}

// Response DTO with all fields including system-generated ones
export class PostResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the post',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the post',
    example: 'Introduction to Machine Learning',
  })
  title: string;

  @ApiProperty({
    description: 'Content of the post',
    example: 'This is a comprehensive guide to machine learning...',
  })
  content: string;

  @ApiProperty({
    description: 'Category of the post',
    example: PostCategory.TECHNOLOGY,
    enum: PostCategory,
    enumName: 'PostCategory',
  })
  category: PostCategory;

  @ApiProperty({
    description: 'UUID of the post author',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  authorId: string;

  @ApiProperty({
    description: 'Timestamp when the post was created',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
    type: 'string',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the post was last updated',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
    type: 'string',
  })
  updatedAt: Date;
}

// Query DTO for filtering and pagination
export class PostQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Filter posts by category',
    example: PostCategory.TECHNOLOGY,
    enum: PostCategory,
    enumName: 'PostCategory',
  })
  @IsOptional()
  @IsEnum(PostCategory, { 
    message: `Category filter must be one of: ${Object.values(PostCategory).join(', ')}` 
  })
  category?: PostCategory;

  @ApiPropertyOptional({
    description: 'Filter posts by author UUID',
    example: '',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Author ID must be a valid UUID' })
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Search in post title and content',
    example: '',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  declare search?: string;

  // Define sortable fields for this entity
  getSortableFields(): string[] {
    return ['createdAt', 'updatedAt', 'title', 'category'];
  }
}

// Simplified DTO for list views (if needed for performance)
export class PostSummaryDto {
  @ApiProperty({
    description: 'Unique identifier of the post',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the post',
    example: 'Introduction to Machine Learning',
  })
  title: string;

  @ApiProperty({
    description: 'Category of the post',
    example: PostCategory.TECHNOLOGY,
    enum: PostCategory,
  })
  category: PostCategory;

  @ApiProperty({
    description: 'UUID of the post author',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  authorId: string;

  @ApiProperty({
    description: 'Timestamp when the post was created',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;
} 