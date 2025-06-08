import { DataSource, Repository, ObjectLiteral, EntityTarget } from 'typeorm';
import { getApp, getDataSource, getTestSchemaName } from './setup';

/**
 * Get a repository for an entity within the test schema context
 */
export function getTestRepository<T extends ObjectLiteral>(entityClass: EntityTarget<T>): Repository<T> {
  const dataSource = getDataSource();
  if (!dataSource) {
    throw new Error('DataSource not available. Make sure tests are properly initialized.');
  }
  return dataSource.getRepository(entityClass);
}

/**
 * Clean all data from tables in the test schema (useful for individual test cleanup)
 * This is an alternative to dropping/recreating schemas between individual tests
 */
export async function cleanTestData(): Promise<void> {
  const dataSource = getDataSource();
  const schemaName = getTestSchemaName();
  
  if (!dataSource || !schemaName) return;
  
  try {
    // Ensure search path is set correctly (test schema + public for UUID functions)
    await dataSource.query(`SET search_path TO "${schemaName}", public`);
    
    // Get all table names in the current schema
    const tables = await dataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = $1 
      ORDER BY tablename
    `, [schemaName]);

    if (tables.length === 0) {
      return; // No tables to clean
    }

    // Build the table list for TRUNCATE command
    const tableNames = tables
      .map((table: any) => `"${schemaName}"."${table.tablename}"`)
      .join(', ');

    // Use TRUNCATE CASCADE to handle foreign key constraints
    // This will truncate all specified tables and any tables that reference them
    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE`);
    
  } catch (error) {
    // If TRUNCATE fails, fall back to DELETE with foreign key constraint handling
    try {
      // Ensure search path is set correctly for fallback
      await dataSource.query(`SET search_path TO "${schemaName}", public`);
      
      const entities = dataSource.entityMetadatas;
      
      // Disable foreign key constraints temporarily for cleanup
      await dataSource.query('SET session_replication_role = replica;');
      
      // For each entity, delete all records
      for (const entity of entities) {
        await dataSource.query(`DELETE FROM "${schemaName}"."${entity.tableName}"`);
      }
      
      // Re-enable foreign key constraints
      await dataSource.query('SET session_replication_role = DEFAULT;');
      
    } catch (fallbackError) {
      console.warn('Test data cleanup warning:', fallbackError.message);
    }
  }
}

/**
 * Execute raw SQL in the test schema context
 */
export async function executeTestQuery(query: string, parameters?: any[]): Promise<any> {
  const dataSource = getDataSource();
  if (!dataSource) {
    throw new Error('DataSource not available. Make sure tests are properly initialized.');
  }
  
  return dataSource.query(query, parameters);
}

/**
 * Get current test schema name (useful for debugging)
 */
export function getCurrentTestSchema(): string {
  const schemaName = getTestSchemaName();
  if (!schemaName) {
    throw new Error('Test schema name not available. Make sure tests are properly initialized.');
  }
  return schemaName;
}

/**
 * Ensure the search path is correctly set for the current test schema
 * Call this if you encounter UUID function errors during tests
 */
export async function ensureSearchPath(): Promise<void> {
  const dataSource = getDataSource();
  const schemaName = getTestSchemaName();
  
  if (!dataSource || !schemaName) {
    throw new Error('DataSource or schema name not available. Make sure tests are properly initialized.');
  }
  
  try {
    await dataSource.query(`SET search_path TO "${schemaName}", public`);
  } catch (error) {
    console.error('Failed to set search path:', error.message);
    throw error;
  }
} 