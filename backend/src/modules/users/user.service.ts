import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserResponseDto } from './dto/user.dto';
import { LoggerService } from '../../common/logging/logger.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly logger: LoggerService,
  ) {}

  async createUser(username: string): Promise<UserResponseDto> {

    this.logger.log(`Creating new user: ${username}`, 'UserService');

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      this.logger.warn(`User creation failed - user already exists: ${username}`, 'UserService');
      throw new ConflictException('Username or email already exists');
    }

    const user = this.userRepository.create({
      username,
    });
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User created successfully: ${username} (ID: ${savedUser.id})`, 'UserService');
    return this.toResponseDto(savedUser);
  }

  async findByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { username },
    });
    return user ? this.toResponseDto(user) : null;
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user ? this.toResponseDto(user) : null;
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
