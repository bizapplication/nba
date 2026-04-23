import type {
  CreatePositionInput,
  PaginatedDto,
  PositionDto,
  PositionListQuery,
  UpdatePositionInput,
} from './dto.ts';
import { mapPositionToDto } from './mappers.ts';
import type {
  EmploymentRepository,
  PositionRepository,
} from '../../domain/hr/repositories.ts';
import type { Employment } from '../../domain/hr/types.ts';
import { positionStatuses } from '../../domain/hr/types.ts';
import { createId } from '../../shared/id.ts';
import { conflict, notFound } from '../../shared/errors.ts';
import { includesSearch, paginate, sortByNewest } from '../../shared/pagination.ts';
import { nowIso } from '../../shared/time.ts';
import {
  asRecord,
  optionalEnum,
  optionalInteger,
  optionalString,
  readField,
  requiredEnum,
  requiredString,
} from '../../shared/validation.ts';

export class PositionService {
  positionRepository: PositionRepository;
  employmentRepository: EmploymentRepository;

  constructor(
    positionRepository: PositionRepository,
    employmentRepository: EmploymentRepository,
  ) {
    this.positionRepository = positionRepository;
    this.employmentRepository = employmentRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<PositionDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: PositionListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), positionStatuses, 'status'),
    };

    const [positions, employments] = await Promise.all([
      this.positionRepository.listAll(),
      this.employmentRepository.listAll(),
    ]);

    const employmentsByPositionId = this.groupEmploymentsByPositionId(employments);
    const filtered = sortByNewest(positions, 'createdAt').filter(
      (position) =>
        includesSearch(
          [position.positionName, position.positionCode, position.description],
          parsedQuery.search,
        ) && (!parsedQuery.status || position.status === parsedQuery.status),
    );

    return paginate(
      filtered.map((position) => mapPositionToDto(position, employmentsByPositionId)),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<PositionDto> {
    const parsedInput = this.parseCreateOrUpdateInput(input);
    const existing = await this.positionRepository.findByCode(parsedInput.positionCode);
    if (existing) {
      throw conflict('POSITION_CODE_EXISTS', 'Position code already exists', {
        positionCode: parsedInput.positionCode,
      });
    }

    const timestamp = nowIso();
    const position = await this.positionRepository.save({
      id: createId('position'),
      positionCode: parsedInput.positionCode,
      positionName: parsedInput.positionName,
      status: parsedInput.status,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(position.id);
  }

  async update(id: string, input: unknown): Promise<PositionDto> {
    const existing = await this.positionRepository.findById(id);
    if (!existing) {
      throw notFound('POSITION_NOT_FOUND', 'Position not found', { id });
    }

    const parsedInput = this.parseCreateOrUpdateInput(input);
    const codeOwner = await this.positionRepository.findByCode(parsedInput.positionCode);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('POSITION_CODE_EXISTS', 'Position code already exists', {
        positionCode: parsedInput.positionCode,
      });
    }

    await this.positionRepository.save({
      ...existing,
      positionCode: parsedInput.positionCode,
      positionName: parsedInput.positionName,
      status: parsedInput.status,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.positionRepository.findById(id);
    if (!existing) {
      throw notFound('POSITION_NOT_FOUND', 'Position not found', { id });
    }

    const linkedEmployment = (await this.employmentRepository.listAll()).find(
      (item) => item.positionId === id,
    );
    if (linkedEmployment) {
      throw conflict(
        'POSITION_HAS_EMPLOYMENTS',
        'Position is referenced by at least one employment',
        { id, employmentId: linkedEmployment.id },
      );
    }

    await this.positionRepository.delete(id);
  }

  private parseCreateOrUpdateInput(
    input: unknown,
  ): CreatePositionInput | UpdatePositionInput {
    const payload = asRecord(input);

    return {
      positionCode: requiredString(readField(payload, 'positionCode'), 'positionCode')
        .toUpperCase(),
      positionName: requiredString(readField(payload, 'positionName'), 'positionName'),
      status: requiredEnum(readField(payload, 'status'), positionStatuses, 'status'),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async toDto(id: string): Promise<PositionDto> {
    const position = await this.positionRepository.findById(id);
    if (!position) {
      throw notFound('POSITION_NOT_FOUND', 'Position not found', { id });
    }

    const employments = await this.employmentRepository.listAll();
    return mapPositionToDto(position, this.groupEmploymentsByPositionId(employments));
  }

  private groupEmploymentsByPositionId(
    employments: Employment[],
  ): Map<string, Employment[]> {
    const map = new Map<string, Employment[]>();

    for (const employment of employments) {
      const bucket = map.get(employment.positionId) ?? [];
      bucket.push(employment);
      map.set(employment.positionId, bucket);
    }

    return map;
  }
}
