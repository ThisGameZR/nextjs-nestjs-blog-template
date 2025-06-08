export default async (): Promise<void> => {
  // Ensure NODE_ENV is set to test for all test files
  process.env.NODE_ENV = 'test';
  
  // For schema-based testing, ensure synchronize is enabled to create tables in test schemas
  if (!process.env.DATABASE_SYNCHRONIZE) {
    process.env.DATABASE_SYNCHRONIZE = 'true';
  }
  
  // Enable logging for debugging during tests if needed
  if (!process.env.DATABASE_LOGGING) {
    process.env.DATABASE_LOGGING = 'false';
  }
  
  console.log('Jest setup: NODE_ENV set to test, database configured for schema-based testing');
}; 