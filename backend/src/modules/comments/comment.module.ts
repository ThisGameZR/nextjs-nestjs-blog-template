import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { CommentController, PostCommentsController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post])],
  controllers: [CommentController, PostCommentsController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {} 