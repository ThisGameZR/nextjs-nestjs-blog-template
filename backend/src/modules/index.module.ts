import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { PostModule } from './posts/post.module';
import { CommentModule } from './comments/comment.module';

@Module({
  imports: [AuthModule, UserModule, PostModule, CommentModule],
  exports: [AuthModule, UserModule, PostModule, CommentModule],
})
export class IndexModule {}
