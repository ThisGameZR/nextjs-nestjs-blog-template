import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';

// Single source of truth for post categories - using enum for better type safety
export enum PostCategory {
  HISTORY = 'History',
  SCIENCE = 'Science',
  TECHNOLOGY = 'Technology',
  ART = 'Art',
  MUSIC = 'Music',
  SPORTS = 'Sports',
  OTHER = 'Other',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    length: 255,
    comment: 'Title of the post',
  })
  title: string;

  @Column({
    length: 255,
    comment: 'Content of the post',
  })
  content: string;

  @Column({
    type: 'enum',
    enum: PostCategory,
    comment: 'Category of the post',
  })
  category: PostCategory;

  @Column({
    type: 'uuid',
    comment: 'Author of the post',
  })
  authorId: string;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @CreateDateColumn({
    comment: 'Created at date',
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Updated at date',
  })
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

// Actually normally we would have soft delete, but for the sake of time, we will not have it
//   @Column({
//     type: 'timestamp',
//     comment: 'Deleted at date',
//   })
//   deletedAt: Date;
}