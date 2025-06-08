import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    length: 50,
    comment: 'Unique username for login',
  })
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Post, (post) => post.author, {
    cascade: false,
  })
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author, {
    cascade: false,
  })
  comments: Comment[];
}
