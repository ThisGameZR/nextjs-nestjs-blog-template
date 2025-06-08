import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { LoginDto } from './dto/auth.dto';
import { UserResponseDto } from '../users/dto/user.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: UserResponseDto = {
    id: 'user-id-123',
    username: 'testuser',
    createdAt: new Date('2023-01-01'),
  };

  beforeEach(async () => {
    const mockUserService = {
      findByUsername: jest.fn(),
      createUser: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = { username: 'testuser' };

    it('should login existing user successfully', async () => {
      const mockToken = 'mock-jwt-token';
      userService.findByUsername.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(userService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userService.createUser).not.toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: mockUser,
      });
    });

    it('should create new user and login when user does not exist', async () => {
      const mockToken = 'mock-jwt-token';
      userService.findByUsername.mockResolvedValue(null);
      userService.createUser.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(userService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userService.createUser).toHaveBeenCalledWith('testuser');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: mockUser,
      });
    });

    it('should handle user creation failure', async () => {
      const error = new Error('User creation failed');
      userService.findByUsername.mockResolvedValue(null);
      userService.createUser.mockRejectedValue(error);

      await expect(service.login(loginDto)).rejects.toThrow('User creation failed');
      expect(userService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userService.createUser).toHaveBeenCalledWith('testuser');
    });
  });

  describe('generateJwtToken', () => {
    it('should generate JWT token with correct payload', () => {
      const mockToken = 'mock-jwt-token';
      jwtService.sign.mockReturnValue(mockToken);

      const result = service.generateJwtToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toBe(mockToken);
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user', async () => {
      const mockToken = 'valid-token';
      const mockPayload = { sub: 'user-id-123', username: 'testuser' };
      jwtService.verify.mockReturnValue(mockPayload);
      userService.findById.mockResolvedValue(mockUser);

      const result = await service.validateToken(mockToken);

      expect(jwtService.verify).toHaveBeenCalledWith(mockToken);
      expect(userService.findById).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid token', async () => {
      const mockToken = 'invalid-token';
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateToken(mockToken);

      expect(jwtService.verify).toHaveBeenCalledWith(mockToken);
      expect(userService.findById).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      const mockToken = 'valid-token';
      const mockPayload = { sub: 'non-existent-user', username: 'testuser' };
      jwtService.verify.mockReturnValue(mockPayload);
      userService.findById.mockResolvedValue(null);

      const result = await service.validateToken(mockToken);

      expect(jwtService.verify).toHaveBeenCalledWith(mockToken);
      expect(userService.findById).toHaveBeenCalledWith('non-existent-user');
      expect(result).toBeNull();
    });
  });

  describe('validateUser', () => {
    it('should validate user and return user data', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser');

      expect(userService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');

      expect(userService.findByUsername).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });
}); 