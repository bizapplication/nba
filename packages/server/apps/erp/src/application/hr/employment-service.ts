import type {
  CreateEmploymentInput,
  EmploymentDto,
  EmploymentListQuery,
  PaginatedDto,
  UpdateEmploymentInput,
} from './dto.ts';
import { mapEmploymentToDto } from './mappers.ts';
import type {
  DepartmentRepository,
  EmployeeRepository,
  EmploymentRepository,
  PositionRepository,
} from '../../domain/hr/repositories.ts';
import { employmentStatuses } from '../../domain/hr/types.ts';
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
  requiredBoolean,
  requiredDate,
  requiredEnum,
  requiredString,
} from '../../shared/validation.ts';

export class EmploymentService {
  employmentRepository: EmploymentRepository;
  employeeRepository: EmployeeRepository;
  departmentRepository: DepartmentRepository;
  positionRepository: PositionRepository;

  constructor(
    employmentRepository: EmploymentRepository,
    employeeRepository: EmployeeRepository,
    departmentRepository: DepartmentRepository,
    positionRepository: PositionRepository,
  ) {
    this.employmentRepository = employmentRepository;
    this.employeeRepository = employeeRepository;
    this.departmentRepository = departmentRepository;
    this.positionRepository = positionRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<EmploymentDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: EmploymentListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      employeeId: optionalString(readField(query, 'employeeId')),
      departmentId: optionalString(readField(query, 'departmentId')),
      positionId: optionalString(readField(query, 'positionId')),
      status: optionalEnum(readField(query, 'status'), employmentStatuses, 'status'),
    };

    const [employments, employees, departments, positions] = await Promise.all([
      this.employmentRepository.listAll(),
      this.employeeRepository.listAll(),
      this.departmentRepository.listAll(),
      this.positionRepository.listAll(),
    ]);

    const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
    const filtered = sortByNewest(employments, 'createdAt').filter((employment) => {
      return (
        includesSearch(
          [
            employeesById.get(employment.employeeId)?.employeeName ?? '',
            departments.find((department) => department.id === employment.departmentId)
              ?.departmentName ?? '',
            positions.find((position) => position.id === employment.positionId)?.positionName ??
              '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.employeeId || employment.employeeId === parsedQuery.employeeId) &&
        (!parsedQuery.departmentId || employment.departmentId === parsedQuery.departmentId) &&
        (!parsedQuery.positionId || employment.positionId === parsedQuery.positionId) &&
        (!parsedQuery.status || employment.status === parsedQuery.status)
      );
    });

    return paginate(
      filtered.map((employment) =>
        mapEmploymentToDto(
          employment,
          employeesById,
          new Map(departments.map((department) => [department.id, department])),
          new Map(positions.map((position) => [position.id, position])),
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<EmploymentDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const timestamp = nowIso();
    const shouldBePrimary = await this.shouldUsePrimaryFlag(
      parsedInput.employeeId,
      parsedInput.isPrimary,
    );

    const created = await this.employmentRepository.save({
      id: createId('employment'),
      employeeId: parsedInput.employeeId,
      departmentId: parsedInput.departmentId,
      positionId: parsedInput.positionId,
      entryDate: parsedInput.entryDate,
      status: parsedInput.status,
      isPrimary: shouldBePrimary,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (shouldBePrimary) {
      await this.ensureOnlyOnePrimary(created.employeeId, created.id);
    }

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<EmploymentDto> {
    const existing = await this.employmentRepository.findById(id);
    if (!existing) {
      throw notFound('EMPLOYMENT_NOT_FOUND', 'Employment not found', { id });
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const shouldBePrimary = await this.shouldUsePrimaryFlag(
      parsedInput.employeeId,
      parsedInput.isPrimary,
      id,
    );

    await this.employmentRepository.save({
      ...existing,
      employeeId: parsedInput.employeeId,
      departmentId: parsedInput.departmentId,
      positionId: parsedInput.positionId,
      entryDate: parsedInput.entryDate,
      status: parsedInput.status,
      isPrimary: shouldBePrimary,
      updatedAt: nowIso(),
    });

    if (shouldBePrimary) {
      await this.ensureOnlyOnePrimary(parsedInput.employeeId, id);
    }

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.employmentRepository.findById(id);
    if (!existing) {
      throw notFound('EMPLOYMENT_NOT_FOUND', 'Employment not found', { id });
    }

    await this.employmentRepository.delete(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateEmploymentInput | UpdateEmploymentInput> {
    const payload = asRecord(input);
    const parsedInput: CreateEmploymentInput = {
      employeeId: requiredString(readField(payload, 'employeeId'), 'employeeId'),
      departmentId: requiredString(readField(payload, 'departmentId'), 'departmentId'),
      positionId: requiredString(readField(payload, 'positionId'), 'positionId'),
      entryDate: requiredDate(readField(payload, 'entryDate'), 'entryDate'),
      status: requiredEnum(readField(payload, 'status'), employmentStatuses, 'status'),
      isPrimary: requiredBoolean(readField(payload, 'isPrimary'), 'isPrimary'),
    };

    const [employee, department, position] = await Promise.all([
      this.employeeRepository.findById(parsedInput.employeeId),
      this.departmentRepository.findById(parsedInput.departmentId),
      this.positionRepository.findById(parsedInput.positionId),
    ]);

    if (!employee) {
      throw notFound('EMPLOYEE_NOT_FOUND', 'Employee not found', {
        employeeId: parsedInput.employeeId,
      });
    }

    if (!department) {
      throw notFound('DEPARTMENT_NOT_FOUND', 'Department not found', {
        departmentId: parsedInput.departmentId,
      });
    }

    if (!position) {
      throw notFound('POSITION_NOT_FOUND', 'Position not found', {
        positionId: parsedInput.positionId,
      });
    }

    return parsedInput;
  }

  private async shouldUsePrimaryFlag(
    employeeId: string,
    isPrimary: boolean,
    currentId?: string,
  ): Promise<boolean> {
    if (isPrimary) {
      return true;
    }

    const existingEmployments = (await this.employmentRepository.listAll()).filter(
      (item) => item.employeeId === employeeId && item.id !== currentId,
    );

    return existingEmployments.length === 0;
  }

  private async ensureOnlyOnePrimary(employeeId: string, keepId: string): Promise<void> {
    const employments = await this.employmentRepository.listAll();

    for (const employment of employments) {
      if (
        employment.employeeId !== employeeId ||
        employment.id === keepId ||
        !employment.isPrimary
      ) {
        continue;
      }

      await this.employmentRepository.save({
        ...employment,
        isPrimary: false,
        updatedAt: nowIso(),
      });
    }
  }

  private async toDto(id: string): Promise<EmploymentDto> {
    const employment = await this.employmentRepository.findById(id);
    if (!employment) {
      throw notFound('EMPLOYMENT_NOT_FOUND', 'Employment not found', { id });
    }

    const [employees, departments, positions] = await Promise.all([
      this.employeeRepository.listAll(),
      this.departmentRepository.listAll(),
      this.positionRepository.listAll(),
    ]);

    return mapEmploymentToDto(
      employment,
      new Map(employees.map((employee) => [employee.id, employee])),
      new Map(departments.map((department) => [department.id, department])),
      new Map(positions.map((position) => [position.id, position])),
    );
  }
}
