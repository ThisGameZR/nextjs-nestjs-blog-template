import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { getApp } from './setup';
import { cleanTestData } from './test-utils';
import { LoginDto } from '../src/modules/auth/dto/auth.dto';

describe('Auth Module (e2e)', () => {
  let app: any;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    // Clean test data before each test to ensure test isolation
    await cleanTestData();
  });

  describe('/auth/login (POST)', () => {
    describe('Success Cases', () => {
      it('should login with valid username and create new user if not exists', async () => {
        const loginDto: LoginDto = {
          username: 'johndoe',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('access_token');
        expect(response.body.data).toHaveProperty('user');
        
        // Validate JWT token structure
        expect(typeof response.body.data.access_token).toBe('string');
        expect(response.body.data.access_token.split('.')).toHaveLength(3); // JWT has 3 parts
        
        // Validate user data
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user).toHaveProperty('username', 'johndoe');
        expect(response.body.data.user).toHaveProperty('createdAt');
      });

      it('should login with existing user', async () => {
        const loginDto: LoginDto = {
          username: 'existinguser',
        };

        // First login to create user
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        // Second login with same user
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body.data).toHaveProperty('access_token');
        expect(response.body.data.user).toHaveProperty('username', 'existinguser');
      });

      it('should login with username containing special characters', async () => {
        const loginDto: LoginDto = {
          username: 'user.test-123',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('username', 'user.test-123');
      });

      it('should login with minimum length username', async () => {
        const loginDto: LoginDto = {
          username: 'a',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('username', 'a');
      });

      it('should login with maximum length username (50 characters)', async () => {
        const loginDto: LoginDto = {
          username: 'a'.repeat(50),
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user.username).toHaveLength(50);
      });
    });

    describe('Validation Error Cases', () => {
      it('should return validation error when username is empty', async () => {
        const loginDto = {
          username: '',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.validationErrors)).toBe(true);
        expect(response.body.validationErrors).toContain('Username is required');
      });

      it('should return validation error when username is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({})
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body.validationErrors).toContain('Username is required');
      });

      it('should return validation error when username is null', async () => {
        const loginDto = {
          username: null,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body.validationErrors).toContain('Username is required');
      });

      it('should convert number to string (implicit conversion enabled)', async () => {
        const loginDto = {
          username: 123,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        // Due to implicit conversion, number is converted to string
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('username', '123');
      });

      it('should return validation error when username exceeds 50 characters', async () => {
        const loginDto: LoginDto = {
          username: 'a'.repeat(51),
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body.validationErrors).toContain('Username must be less than 50 characters');
      });

      it('should accept whitespace username (not trimmed - no transform decorator)', async () => {
        const loginDto = {
          username: '   testuser   ',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        // Username is NOT trimmed because there's no @Transform decorator
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('username', '   testuser   ');
      });

      it('should accept username with only whitespace (IsNotEmpty doesn\'t reject whitespace)', async () => {
        const loginDto = {
          username: '   ',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        // IsNotEmpty only checks for null/undefined/empty string, not whitespace-only
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('username', '   ');
      });
    });

    describe('Invalid Request Cases', () => {
      it('should return bad request for invalid JSON', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .set('Content-Type', 'application/json')
          .send('invalid json')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('invalid json');
      });

      it('should handle extra fields gracefully (whitelist: true)', async () => {
        const loginDto = {
          username: 'testuser',
          extraField: 'should be ignored',
          password: 'should also be ignored',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Success');
        expect(response.body.data.user).toHaveProperty('username', 'testuser');
      });
    });

    describe('Content-Type and Headers', () => {
      it('should work with application/json content-type', async () => {
        const loginDto: LoginDto = {
          username: 'jsonuser',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .set('Content-Type', 'application/json')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('username', 'jsonuser');
      });

      it('should return validation error for unsupported content-type', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .set('Content-Type', 'text/plain')
          .send('username=testuser')
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'Validation failed');
      });
    });

    describe('Response Structure Validation', () => {
      it('should return response in standard format', async () => {
        const loginDto: LoginDto = {
          username: 'responsetest',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        // Validate standard response structure
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('statusCode');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.timestamp).toBe('string');

        // Validate auth-specific response data
        expect(response.body.data).toHaveProperty('access_token');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user).toHaveProperty('username');
        expect(response.body.data.user).toHaveProperty('createdAt');
      });
    });

    describe('JWT Token Validation', () => {
      it('should generate valid JWT token that can be decoded', async () => {
        const loginDto: LoginDto = {
          username: 'jwttest',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        const token = response.body.data.access_token;
        
        // Basic JWT structure validation
        expect(typeof token).toBe('string');
        const parts = token.split('.');
        expect(parts).toHaveLength(3);
        
        // Decode header and payload (without verification for testing purposes)
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        
        expect(header).toHaveProperty('alg');
        expect(header).toHaveProperty('typ', 'JWT');
        expect(payload).toHaveProperty('sub');
        expect(payload).toHaveProperty('username', 'jwttest');
        expect(payload).toHaveProperty('iat');
        expect(payload).toHaveProperty('exp');
      });

      it('should generate different tokens for different users', async () => {
        const user1Response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ username: 'user1' })
          .expect(HttpStatus.OK);

        const user2Response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ username: 'user2' })
          .expect(HttpStatus.OK);

        expect(user1Response.body.data.access_token).not.toBe(user2Response.body.data.access_token);
      });

      it('should generate same tokens for same user when logged in within same second', async () => {
        const loginDto: LoginDto = {
          username: 'sameuser',
        };

        const response1 = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        const response2 = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        // Tokens should be the same because they're generated for the same user within the same second
        // JWT iat (issued at) is based on seconds, so same second = same token
        expect(response1.body.data.access_token).toBe(response2.body.data.access_token);
      });
    });

    describe('Edge Cases and Behavior Verification', () => {
      it('should handle unicode characters in username', async () => {
        const loginDto: LoginDto = {
          username: 'user_测试_🚀',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('username', 'user_测试_🚀');
      });

      it('should handle usernames with numbers and special chars', async () => {
        const testCases = [
          'user123',
          'user-name',
          'user_name',
          'user.name',
          'user@domain',
          'user+tag',
        ];

        for (const username of testCases) {
          const response = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ username })
            .expect(HttpStatus.OK);

          expect(response.body.data.user).toHaveProperty('username', username);
        }
      });

      it('should validate that token contains correct user information', async () => {
        const loginDto: LoginDto = {
          username: 'tokenuser',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        const token = response.body.data.access_token;
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        
        expect(payload.username).toBe('tokenuser');
        expect(payload.sub).toBe(response.body.data.user.id);
        expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
        expect(payload.exp).toBeGreaterThan(payload.iat);
      });
    });
  });
}); 