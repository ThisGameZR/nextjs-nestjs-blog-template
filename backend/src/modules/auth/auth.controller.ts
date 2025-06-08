import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/auth.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ValidationErrorDto } from '../shared/common.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  // @UseGuards(LocalAuthGuard) Actually in real project we would use this guard, but since this guard expects a password, we will not use it
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user and receive access token',
    description: `
      Authenticates a user with username
      Returns a JWT access token for authenticated requests.
      
      **Token Usage:**
      - Include the returned access_token in the Authorization header
      - Format: "Bearer {access_token}"
      - Token expires in 7 days by default
    `,
  })
  @ApiOkResponse({
    description: 'User authenticated successfully',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials provided',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: '' },
        statusCode: { type: 'number', example: 401 },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000Z' },
        path: { type: 'string', example: '/api/v1/auth/login' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    type: ValidationErrorDto,
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
