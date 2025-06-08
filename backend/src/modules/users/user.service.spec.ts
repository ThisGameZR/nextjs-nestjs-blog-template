import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../database/entities/user.entity';
import { LoggerService } from '../../common/logging/logger.service';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;
  let logger: jest.Mocked<LoggerService>;

  const mockUser: User = {
    id: 'user-id-123',
    username: 'testuser',
    createdAt: new Date('2023-01-01'),
    posts: [],
    comments: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const username = 'newuser';
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(username);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(repository.create).toHaveBeenCalledWith({ username });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(logger.log).toHaveBeenCalledWith(
        `Creating new user: ${username}`,
        'UserService'
      );
      expect(logger.log).toHaveBeenCalledWith(
        `User created successfully: ${username} (ID: ${mockUser.id})`,
        'UserService'
      );
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const username = 'existinguser';
      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser(username)).rejects.toThrow(
        ConflictException
      );
      await expect(service.createUser(username)).rejects.toThrow(
        'Username or email already exists'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        `Creating new user: ${username}`,
        'UserService'
      );
      expect(logger.warn).toHaveBeenCalledWith(
        `User creation failed - user already exists: ${username}`,
        'UserService'
      );
    });

    it('should handle database errors during user creation', async () => {
      const username = 'newuser';
      const error = new Error('Database connection failed');
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockUser);
      repository.save.mockRejectedValue(error);

      await expect(service.createUser(username)).rejects.toThrow(
        'Database connection failed'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(repository.create).toHaveBeenCalledWith({ username });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const username = 'testuser';
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      });
    });

    it('should return null when user not found', async () => {
      const username = 'nonexistent';
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername(username);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(result).toBeNull();
    });

    it('should handle database errors during user lookup', async () => {
      const username = 'testuser';
      const error = new Error('Database connection failed');
      repository.findOne.mockRejectedValue(error);

      await expect(service.findByUsername(username)).rejects.toThrow(
        'Database connection failed'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const id = 'user-id-123';
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      });
    });

    it('should return null when user not found by id', async () => {
      const id = 'nonexistent-id';
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById(id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBeNull();
    });

    it('should handle database errors during user lookup by id', async () => {
      const id = 'user-id-123';
      const error = new Error('Database connection failed');
      repository.findOne.mockRejectedValue(error);

      await expect(service.findById(id)).rejects.toThrow(
        'Database connection failed'
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
}); 