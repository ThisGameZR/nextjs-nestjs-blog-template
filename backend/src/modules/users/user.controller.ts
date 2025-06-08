import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserResponseDto } from './dto/user.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('User Profile')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string): Promise<UserResponseDto | null> {
    return this.userService.findById(id);
  }
}
