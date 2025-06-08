import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items for the current page',
    type: 'array',
  })
  items: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: 'Total number of items',
        example: 150,
      },
      page: {
        type: 'number',
        description: 'Current page number',
        example: 1,
      },
      limit: {
        type: 'number',
        description: 'Items per page',
        example: 10,
      },
      totalPages: {
        type: 'number',
        description: 'Total number of pages',
        example: 15,
      },
      hasNextPage: {
        type: 'boolean',
        description: 'Whether there is a next page',
        example: true,
      },
      hasPrevPage: {
        type: 'boolean',
        description: 'Whether there is a previous page',
        example: false,
      },
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'nin' | 'null' | 'notnull';
  value?: any;
}

export interface DateRangeFilter {
  field: string;
  from?: Date;
  to?: Date;
}

export interface PaginationOptions {
  searchFields?: string[];
  searchRelations?: string[];
  defaultSortField?: string;
  filters?: FilterCondition[];
  dateRangeFilters?: DateRangeFilter[];
}