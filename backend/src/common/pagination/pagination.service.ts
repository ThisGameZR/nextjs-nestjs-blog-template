import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { BaseQueryDto } from './base-query.dto';
import { PaginatedResponseDto, PaginationOptions, FilterCondition, DateRangeFilter } from './pagination.dto';

@Injectable()
export class PaginationService {
  /**
   * Generic method to apply pagination, sorting, and search to any TypeORM query builder
   */
  async paginate<T extends ObjectLiteral, U>(
    queryBuilder: SelectQueryBuilder<T>,
    query: BaseQueryDto,
    mapToDto: (entity: T) => U,
    options: PaginationOptions = {},
  ): Promise<PaginatedResponseDto<U>> {
    const { page = 1, limit = 10, sortOrder = 'desc', search } = query;
    const { searchFields = [], searchRelations = [], filters = [], dateRangeFilters = [] } = options;

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Apply date range filters
    this.applyDateRangeFilters(queryBuilder, dateRangeFilters);

    // Apply search filters
    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map((field, index) => {
        const alias = queryBuilder.alias;
        return `${alias}.${field} ILIKE :search${index}`;
      });

      // Add relation search conditions if specified
      if (searchRelations.length > 0) {
        searchRelations.forEach((relation, index) => {
          const [relationAlias, relationField] = relation.split('.');
          searchConditions.push(`${relationAlias}.${relationField} ILIKE :search${searchFields.length + index}`);
        });
      }

      queryBuilder.andWhere(
        `(${searchConditions.join(' OR ')})`,
        Object.fromEntries([
          ...searchFields.map((_, index) => [`search${index}`, `%${search}%`]),
          ...searchRelations.map((_, index) => [`search${searchFields.length + index}`, `%${search}%`]),
        ]) as ObjectLiteral,
      );
    }

    // Apply sorting
    const sortField = query.getSortField();
    const alias = queryBuilder.alias;
    queryBuilder.orderBy(`${alias}.${sortField}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [entities, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      items: entities.map(mapToDto),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Generic method for simple repository-based pagination
   */
  async paginateRepository<T extends ObjectLiteral, U>(
    repository: Repository<T>,
    query: BaseQueryDto,
    mapToDto: (entity: T) => U,
    options: PaginationOptions = {},
  ): Promise<PaginatedResponseDto<U>> {
    const queryBuilder = repository.createQueryBuilder(this.getEntityAlias(repository));
    return this.paginate(queryBuilder, query, mapToDto, options);
  }

  /**
   * Helper method to get entity alias from repository metadata
   */
  private getEntityAlias<T extends ObjectLiteral>(repository: Repository<T>): string {
    const entityName = repository.metadata.targetName;
    return entityName.toLowerCase();
  }

  /**
   * Create search conditions for multiple fields
   */
  createSearchConditions(alias: string, fields: string[], searchTerm: string): string {
    if (!searchTerm || fields.length === 0) return '';

    const conditions = fields.map((field) => `${alias}.${field} ILIKE '%${searchTerm}%'`);
    return `(${conditions.join(' OR ')})`;
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, filters: FilterCondition[]): void {
    const alias = queryBuilder.alias;

    filters.forEach((filter, index) => {
      const paramName = `filter${index}`;
      const fieldPath = `${alias}.${filter.field}`;

      switch (filter.operator) {
        case 'eq':
          queryBuilder.andWhere(`${fieldPath} = :${paramName}`, { [paramName]: filter.value });
          break;
        case 'neq':
          queryBuilder.andWhere(`${fieldPath} != :${paramName}`, { [paramName]: filter.value });
          break;
        case 'gt':
          queryBuilder.andWhere(`${fieldPath} > :${paramName}`, { [paramName]: filter.value });
          break;
        case 'gte':
          queryBuilder.andWhere(`${fieldPath} >= :${paramName}`, { [paramName]: filter.value });
          break;
        case 'lt':
          queryBuilder.andWhere(`${fieldPath} < :${paramName}`, { [paramName]: filter.value });
          break;
        case 'lte':
          queryBuilder.andWhere(`${fieldPath} <= :${paramName}`, { [paramName]: filter.value });
          break;
        case 'like':
          queryBuilder.andWhere(`${fieldPath} LIKE :${paramName}`, { [paramName]: `%${filter.value}%` });
          break;
        case 'ilike':
          queryBuilder.andWhere(`${fieldPath} ILIKE :${paramName}`, { [paramName]: `%${filter.value}%` });
          break;
        case 'in':
          queryBuilder.andWhere(`${fieldPath} IN (:...${paramName})`, { [paramName]: filter.value });
          break;
        case 'nin':
          queryBuilder.andWhere(`${fieldPath} NOT IN (:...${paramName})`, { [paramName]: filter.value });
          break;
        case 'null':
          queryBuilder.andWhere(`${fieldPath} IS NULL`);
          break;
        case 'notnull':
          queryBuilder.andWhere(`${fieldPath} IS NOT NULL`);
          break;
      }
    });
  }

  /**
   * Apply date range filters to query builder
   */
  private applyDateRangeFilters<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    dateRangeFilters: DateRangeFilter[],
  ): void {
    const alias = queryBuilder.alias;

    dateRangeFilters.forEach((filter, index) => {
      const fieldPath = `${alias}.${filter.field}`;

      if (filter.from) {
        queryBuilder.andWhere(`${fieldPath} >= :dateFrom${index}`, { [`dateFrom${index}`]: filter.from });
      }

      if (filter.to) {
        queryBuilder.andWhere(`${fieldPath} <= :dateTo${index}`, { [`dateTo${index}`]: filter.to });
      }
    });
  }

  /**
   * Validate pagination parameters and set defaults
   */
  validateAndSetDefaults(query: Partial<BaseQueryDto>): BaseQueryDto {
    return {
      page: Math.max(1, query.page || 1),
      limit: Math.min(100, Math.max(1, query.limit || 10)),
      sortOrder: ['asc', 'desc'].includes(query.sortOrder as string) ? query.sortOrder : 'desc',
      sortBy: query.sortBy || 'createdAt',
      search: query.search?.trim() || undefined,
      getSortableFields: () => ['createdAt', 'updatedAt'],
      getSortField: function () {
        const allowedFields = this.getSortableFields();
        return allowedFields.includes(this.sortBy) ? this.sortBy! : allowedFields[0];
      },
    } as BaseQueryDto;
  }
}
