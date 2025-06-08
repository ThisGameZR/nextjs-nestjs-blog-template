import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { LoginDto } from '../src/modules/auth/dto/auth.dto';

export interface AuthTestUser {
  username: string;
  token: string;
  userId: string;
}

export class AuthTestUtils {
  constructor(private app: INestApplication) {}

  /**
   * Create a user and get authentication token
   */
  async createAuthenticatedUser(username: string): Promise<AuthTestUser> {
    const loginDto: LoginDto = { username };

    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(loginDto)
      .expect(HttpStatus.OK);

    return {
      username,
      token: response.body.data.access_token,
      userId: response.body.data.user.id,
    };
  }

  /**
   * Create multiple authenticated users
   */
  async createMultipleUsers(usernames: string[]): Promise<AuthTestUser[]> {
    const users = await Promise.all(
      usernames.map(username => this.createAuthenticatedUser(username))
    );
    return users;
  }

  /**
   * Make authenticated request helper
   */
  authenticatedRequest(token: string) {
    return {
      get: (url: string) =>
        request(this.app.getHttpServer())
          .get(url)
          .set('Authorization', `Bearer ${token}`),
      
      post: (url: string) =>
        request(this.app.getHttpServer())
          .post(url)
          .set('Authorization', `Bearer ${token}`),
      
      put: (url: string) =>
        request(this.app.getHttpServer())
          .put(url)
          .set('Authorization', `Bearer ${token}`),
      
      patch: (url: string) =>
        request(this.app.getHttpServer())
          .patch(url)
          .set('Authorization', `Bearer ${token}`),
      
      delete: (url: string) =>
        request(this.app.getHttpServer())
          .delete(url)
          .set('Authorization', `Bearer ${token}`),
    };
  }

  /**
   * Test invalid token scenarios
   */
  async testInvalidTokens(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET') {
    const invalidTokens = [
      '', // Empty token
      'invalid', // Invalid format
      'Bearer', // Just Bearer
      'Bearer ', // Bearer with space
      'Bearer invalid.jwt.token', // Malformed JWT
      'Basic dGVzdDp0ZXN0', // Wrong auth scheme
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature', // Invalid signature
    ];

    for (const token of invalidTokens) {
      let requestBuilder;
      
      switch (method) {
        case 'GET':
          requestBuilder = request(this.app.getHttpServer()).get(url);
          break;
        case 'POST':
          requestBuilder = request(this.app.getHttpServer()).post(url);
          break;
        case 'PUT':
          requestBuilder = request(this.app.getHttpServer()).put(url);
          break;
        case 'PATCH':
          requestBuilder = request(this.app.getHttpServer()).patch(url);
          break;
        case 'DELETE':
          requestBuilder = request(this.app.getHttpServer()).delete(url);
          break;
      }

      if (token) {
        requestBuilder = requestBuilder.set('Authorization', token);
      }

      const response = await requestBuilder.expect(HttpStatus.UNAUTHORIZED);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Validate JWT token structure
   */
  validateJWTStructure(token: string) {
    expect(typeof token).toBe('string');
    const parts = token.split('.');
    expect(parts).toHaveLength(3);

    // Decode and validate header
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    expect(header).toHaveProperty('alg');
    expect(header).toHaveProperty('typ', 'JWT');

    // Decode and validate payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    expect(payload).toHaveProperty('sub');
    expect(payload).toHaveProperty('username');
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');

    return { header, payload };
  }

  /**
   * Test concurrent requests with same token
   */
  async testConcurrentRequests(token: string, url: string, count: number = 5): Promise<any[]> {
    const requests = Array.from({ length: count }, () =>
      this.authenticatedRequest(token).get(url)
    );

    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('success', true);
    });

    return responses;
  }

  /**
   * Generate test data for validation scenarios
   */
  getValidationTestCases() {
    return {
      validUsernames: [
        'user1',
        'test.user',
        'user-123',
        'a',
        'A'.repeat(50), // Max length
        'user_test',
        'User123',
      ],
      invalidUsernames: [
        '', // Empty
        ' ', // Whitespace only
        '   ', // Multiple spaces
        null, // Null
        undefined, // Undefined
        123, // Number
        [], // Array
        {}, // Object
        'A'.repeat(51), // Exceeds max length
      ],
    };
  }

  /**
   * Create test scenarios for different auth states
   */
  async createTestScenarios() {
    const validUser = await this.createAuthenticatedUser('validuser');
    const anotherUser = await this.createAuthenticatedUser('anotheruser');

    return {
      authenticated: validUser,
      anotherAuthenticated: anotherUser,
      unauthenticated: null,
      invalidToken: 'Bearer invalid.token.here',
      expiredToken: 'Bearer expired.token.here', // Would need actual expired token
    };
  }

  /**
   * Test authentication middleware across different endpoints
   */
  async testAuthenticationAcrossEndpoints(token: string, endpoints: string[]): Promise<Array<{ endpoint: string; success: boolean }>> {
    const results: Array<{ endpoint: string; success: boolean }> = [];

    for (const endpoint of endpoints) {
      const response = await this.authenticatedRequest(token)
        .get(endpoint)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      results.push({ endpoint, success: true });
    }

    return results;
  }

  /**
   * Test rate limiting or concurrent access patterns
   */
  async testRateLimit(token: string, url: string, requestCount: number = 10) {
    const startTime = Date.now();
    
    const requests = Array.from({ length: requestCount }, async (_, index) => {
      const response = await this.authenticatedRequest(token).get(url);
      return {
        requestIndex: index,
        status: response.status,
        duration: Date.now() - startTime,
      };
    });

    const results = await Promise.all(requests);
    return results;
  }
}

/**
 * Helper function to create auth utils instance
 */
export function createAuthTestUtils(app: INestApplication): AuthTestUtils {
  return new AuthTestUtils(app);
}

/**
 * Common assertions for auth responses
 */
export const AuthAssertions = {
  expectSuccessfulLogin: (response: any) => {
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user).toHaveProperty('username');
    expect(response.body.data.user).toHaveProperty('createdAt');
  },

  expectUnauthorized: (response: any) => {
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
  },

  expectValidationError: (response: any, expectedMessage?: string) => {
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  },

  expectStandardResponse: (response: any) => {
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('statusCode');
    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('string');
  },
}; 