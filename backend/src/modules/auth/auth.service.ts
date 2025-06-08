import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { LoginDto } from './dto/auth.dto';
import { UserResponseDto } from '../users/dto/user.dto';

export interface AuthResponse {
  access_token: string;
  user: UserResponseDto;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Check if user exists
    let user = await this.userService.findByUsername(loginDto.username);
    
    if (!user) {
      // Create new user if not found
      user = await this.userService.createUser(loginDto.username);
    }

    const access_token = this.generateJwtToken(user);

    return {
      access_token,
      user,
    };
  }

  generateJwtToken(user: UserResponseDto): string {
    const payload = {
      sub: user.id,
      username: user.username,
    };

    return this.jwtService.sign(payload);
  }

  async validateToken(token: string): Promise<UserResponseDto | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.userService.findById(String(payload.sub));
    } catch {
      return null;
    }
  }

  async validateUser(username: string): Promise<UserResponseDto | null> {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      return null;
    }
    return user;
  }
}
