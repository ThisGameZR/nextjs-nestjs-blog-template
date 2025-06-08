import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username for authentication',
    example: 'johndoe',
  })
  @IsString()
  @MaxLength(50, { message: 'Username must be less than 50 characters' })
  @IsNotEmpty({ message: 'Username is required' })
  username: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for authenticated requests',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type (always Bearer)',
    example: 'Bearer',
    default: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 604800,
  })
  expires_in: number;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123' },
      username: { type: 'string', example: 'johndoe' },
      createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000Z' },
    },
  })
  user: {
    id: string;
    username: string;
    createdAt: string;
  };
}
