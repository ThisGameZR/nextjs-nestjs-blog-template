import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: "User's unique username",
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Timestamp when the user was created',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;
}