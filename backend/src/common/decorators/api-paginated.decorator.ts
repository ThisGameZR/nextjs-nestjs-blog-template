import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath, ApiQuery } from '@nestjs/swagger';

export interface ApiPaginatedOptions {
  description?: string;
  summary?: string;
  searchDescription?: string;
}

export const ApiPaginated = <TModel extends Type<any>>(model: TModel, options: ApiPaginatedOptions = {}) => {
  const {
    description = 'Paginated response with data and pagination metadata',
    searchDescription = 'Search query string',
  } = options;

  return applyDecorators(
    ApiExtraModels(model),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (1-based)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page (max 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort direction',
      example: 'desc',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: searchDescription,
      example: '',
    }),
    ApiQuery({
      name: 'createdFrom',
      required: false,
      type: String,
      description: 'Filter by creation date (from yyyy-mm-dd)',
      example: '',
    }),
    ApiQuery({
      name: 'createdTo',
      required: false,
      type: String,
      description: 'Filter by creation date (to yyyy-mm-dd)',
      example: '',
    }),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Indicates if the request was successful',
          },
          message: {
            type: 'string',
            example: 'Data retrieved successfully',
            description: 'Human-readable message',
          },
          data: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
                description: 'Array of items for the current page',
              },
              pagination: {
                type: 'object',
                properties: {
                  total: {
                    type: 'number',
                    example: 150,
                    description: 'Total number of items',
                  },
                  page: {
                    type: 'number',
                    example: 1,
                    description: 'Current page number',
                  },
                  limit: {
                    type: 'number',
                    example: 10,
                    description: 'Items per page',
                  },
                  totalPages: {
                    type: 'number',
                    example: 15,
                    description: 'Total number of pages',
                  },
                  hasNextPage: {
                    type: 'boolean',
                    example: true,
                    description: 'Whether there is a next page',
                  },
                  hasPrevPage: {
                    type: 'boolean',
                    example: false,
                    description: 'Whether there is a previous page',
                  },
                },
                description: 'Pagination metadata',
              },
            },
          },
          statusCode: {
            type: 'number',
            example: 200,
            description: 'HTTP status code',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
            description: 'Response timestamp',
          },
        },
      },
    }),
  );
};
