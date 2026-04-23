import type {
  CreateDepartmentInput,
  DepartmentDto,
  DepartmentListQuery,
  PaginatedDto,
  UpdateDepartmentInput,
} from './dto.ts';
import { mapDepartmentToDto } from './mappers.ts';
import type {
  DepartmentRepository,
  EmploymentRepository,
  ExpenseClaimRepository,
} from '../../domain/hr/repositories.ts';
import type { Employment } from '../../domain/hr/types.ts';
import { departmentStatuses } from '../../domain/hr/types.ts';
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

export class DepartmentService {
  departmentRepository: DepartmentRepository;
  employmentRepository: EmploymentRepository;
  expenseClaimRepository: ExpenseClaimRepository;

  constructor(
    departmentRepository: DepartmentRepository,
    employmentRepository: EmploymentRepository,
    expenseClaimRepository: ExpenseClaimRepository,
  ) {
    this.departmentRepository = departmentRepository;
    this.employmentRepository = employmentRepository;
    this.expenseClaimRepository = expenseClaimRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<DepartmentDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: DepartmentListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), departmentStatuses, 'status'),
    };

    const [departments, employments] = await Promise.all([
      this.departmentRepository.listAll(),
      this.employmentRepository.listAll(),
    ]);

    const employmentsByDepartmentId = this.groupEmploymentsByDepartmentId(employments);
    const filtered = sortByNewest(departments, 'createdAt').filter(
      (department) =>
        includesSearch(
          [
            department.departmentName,
            department.departmentCode,
            department.description,
          ],
          parsedQuery.search,
        ) && (!parsedQuery.status || department.status === parsedQuery.status),
    );

    return paginate(
      filtered.map((department) =>
        mapDepartmentToDto(department, employmentsByDepartmentId),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<DepartmentDto> {
    const parsedInput = this.parseCreateOrUpdateInput(input);
    const existing = await this.departmentRepository.findByCode(parsedInput.departmentCode);
    if (existing) {
      throw conflict('DEPARTMENT_CODE_EXISTS', 'Department code already exists', {
        departmentCode: parsedInput.departmentCode,
      });
    }

    const timestamp = nowIso();
    const department = await this.departmentRepository.save({
      id: createId('department'),
      departmentCode: parsedInput.departmentCode,
      departmentName: parsedInput.departmentName,
      status: parsedInput.status,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(department.id);
  }

  async update(id: string, input: unknown): Promise<DepartmentDto> {
    const existing = await this.departmentRepository.findById(id);
    if (!existing) {
      throw notFound('DEPARTMENT_NOT_FOUND', 'Department not found', { id });
    }

    const parsedInput = this.parseCreateOrUpdateInput(input);
    const codeOwner = await this.departmentRepository.findByCode(parsedInput.departmentCode);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('DEPARTMENT_CODE_EXISTS', 'Department code already exists', {
        departmentCode: parsedInput.departmentCode,
      });
    }

    await this.departmentRepository.save({
      ...existing,
      departmentCode: parsedInput.departmentCode,
      departmentName: parsedInput.departmentName,
      status: parsedInput.status,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.departmentRepository.findById(id);
    if (!existing) {
      throw notFound('DEPARTMENT_NOT_FOUND', 'Department not found', { id });
    }

    const linkedEmployment = (await this.employmentRepository.listAll()).find(
      (item) => item.departmentId === id,
    );
    if (linkedEmployment) {
      throw conflict(
        'DEPARTMENT_HAS_EMPLOYMENTS',
        'Department is referenced by at least one employment',
        { id, employmentId: linkedEmployment.id },
      );
    }

    const linkedExpenseClaim = (await this.expenseClaimRepository.listAll()).find(
      (item) => item.departmentId === id,
    );
    if (linkedExpenseClaim) {
      throw conflict(
        'DEPARTMENT_HAS_EXPENSE_CLAIMS',
        'Department is referenced by at least one expense claim',
        { id, expenseClaimId: linkedExpenseClaim.id },
      );
    }

    await this.departmentRepository.delete(id);
  }

  private parseCreateOrUpdateInput(
    input: unknown,
  ): CreateDepartmentInput | UpdateDepartmentInput {
    const payload = asRecord(input);

    return {
      departmentCode: requiredString(
        readField(payload, 'departmentCode'),
        'departmentCode',
      ).toUpperCase(),
      departmentName: requiredString(
        readField(payload, 'departmentName'),
        'departmentName',
      ),
      status: requiredEnum(readField(payload, 'status'), departmentStatuses, 'status'),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async toDto(id: string): Promise<DepartmentDto> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw notFound('DEPARTMENT_NOT_FOUND', 'Department not found', { id });
    }

    const employments = await this.employmentRepository.listAll();
    return mapDepartmentToDto(
      department,
      this.groupEmploymentsByDepartmentId(employments),
    );
  }

  private groupEmploymentsByDepartmentId(
    employments: Employment[],
  ): Map<string, Employment[]> {
    const map = new Map<string, Employment[]>();

    for (const employment of employments) {
      const bucket = map.get(employment.departmentId) ?? [];
      bucket.push(employment);
      map.set(employment.departmentId, bucket);
    }

    return map;
  }
}
