import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryDto } from '../../../common/pagination/base-query.dto';

// Base DTO with common validations
class BaseCommentDto {
  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a great post! Thanks for sharing.',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(255, { message: 'Content must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  content: string;
}

// Create DTO - extends base with all required fields
export class CreateCommentDto extends BaseCommentDto {
  @ApiProperty({
    description: 'UUID of the post this comment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Post ID must be a valid UUID' })
  postId: string;
}

// Update DTO - makes all fields optional using PartialType
export class UpdateCommentDto extends PartialType(BaseCommentDto) {
  @ApiPropertyOptional({
    description: 'Content of the comment',
    example: 'This is an updated comment with new insights.',
    minLength: 1,
    maxLength: 255,
  })
  content?: string;
}

// DTO for creating comments via nested post route (without postId)
export class CreateCommentNestedDto extends BaseCommentDto {
  // Inherits all the validation from BaseCommentDto (content field)
  // but doesn't include postId since it comes from the URL
}

// Response DTO with all fields including system-generated ones
export class CommentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the comment',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a great post! Thanks for sharing.',
  })
  content: string;

  @ApiProperty({
    description: 'UUID of the post this comment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  postId: string;

  @ApiProperty({
    description: 'UUID of the comment author',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  authorId: string;

  @ApiProperty({
    description: 'Timestamp when the comment was created',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
    type: 'string',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the comment was last updated',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
    type: 'string',
  })
  updatedAt: Date;
}

// Query DTO for filtering and pagination
export class CommentQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Filter comments by post UUID',
    example: '',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Post ID must be a valid UUID' })
  postId?: string;

  @ApiPropertyOptional({
    description: 'Filter comments by author UUID',
    example: '',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Author ID must be a valid UUID' })
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Search in comment content',
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
    return ['createdAt', 'updatedAt', 'content'];
  }
}

// Simplified DTO for list views (if needed for performance)
export class CommentSummaryDto {
  @ApiProperty({
    description: 'Unique identifier of the comment',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Content of the comment (truncated)',
    example: 'This is a great post! Thanks...',
  })
  content: string;

  @ApiProperty({
    description: 'UUID of the post this comment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  postId: string;

  @ApiProperty({
    description: 'UUID of the comment author',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  authorId: string;

  @ApiProperty({
    description: 'Timestamp when the comment was created',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;
} 