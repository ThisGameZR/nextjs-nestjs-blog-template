import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    length: 255,
    comment: 'Content of the comment',
  })
  content: string;

  @Column({
    type: 'uuid',
    comment: 'Post of the comment',
  })
  postId: string;

  @Column({
    type: 'uuid',
    comment: 'Author of the comment',
  })
  authorId: string;

  @ManyToOne(() => User, (user) => user.comments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Post, (post) => post.comments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}