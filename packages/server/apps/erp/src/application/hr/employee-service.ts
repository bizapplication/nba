import type {
  CreateEmployeeInput,
  EmployeeDto,
  EmployeeListQuery,
  PaginatedDto,
  UpdateEmployeeInput,
} from './dto.ts';
import { mapEmployeeToDto } from './mappers.ts';
import type {
  DepartmentRepository,
  EmployeeRepository,
  EmploymentRepository,
  ExpenseClaimRepository,
  PositionRepository,
} from '../../domain/hr/repositories.ts';
import type { Employment } from '../../domain/hr/types.ts';
import { employeeStatuses } from '../../domain/hr/types.ts';
import { createId } from '../../shared/id.ts';
import { conflict, notFound } from '../../shared/errors.ts';
import { includesSearch, paginate, sortByNewest } from '../../shared/pagination.ts';
import { nowIso } from '../../shared/time.ts';
import {
  asRecord,
  optionalCurrencyCode,
  optionalEnum,
  optionalInteger,
  optionalString,
  readField,
  requiredCurrencyCode,
  requiredEnum,
  requiredString,
} from '../../shared/validation.ts';

export class EmployeeService {
  employeeRepository: EmployeeRepository;
  employmentRepository: EmploymentRepository;
  expenseClaimRepository: ExpenseClaimRepository;
  departmentRepository: DepartmentRepository;
  positionRepository: PositionRepository;

  constructor(
    employeeRepository: EmployeeRepository,
    employmentRepository: EmploymentRepository,
    expenseClaimRepository: ExpenseClaimRepository,
    departmentRepository: DepartmentRepository,
    positionRepository: PositionRepository,
  ) {
    this.employeeRepository = employeeRepository;
    this.employmentRepository = employmentRepository;
    this.expenseClaimRepository = expenseClaimRepository;
    this.departmentRepository = departmentRepository;
    this.positionRepository = positionRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<EmployeeDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: EmployeeListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), employeeStatuses, 'status'),
      departmentId: optionalString(readField(query, 'departmentId')),
      positionId: optionalString(readField(query, 'positionId')),
    };

    const [employees, employments, departments, positions] = await Promise.all([
      this.employeeRepository.listAll(),
      this.employmentRepository.listAll(),
      this.departmentRepository.listAll(),
      this.positionRepository.listAll(),
    ]);

    const employmentsByEmployeeId = this.groupEmploymentsByEmployeeId(employments);
    const filtered = sortByNewest(employees, 'createdAt').filter((employee) => {
      const primaryEmployment =
        employmentsByEmployeeId.get(employee.id)?.find((item) => item.isPrimary) ??
        employmentsByEmployeeId.get(employee.id)?.[0] ??
        null;

      return (
        includesSearch(
          [employee.employeeName, employee.employeeCode, employee.description],
          parsedQuery.search,
        ) &&
        (!parsedQuery.status || employee.status === parsedQuery.status) &&
        (!parsedQuery.departmentId ||
          primaryEmployment?.departmentId === parsedQuery.departmentId) &&
        (!parsedQuery.positionId ||
          primaryEmployment?.positionId === parsedQuery.positionId)
      );
    });

    return paginate(
      filtered.map((employee) =>
        mapEmployeeToDto(
          employee,
          employmentsByEmployeeId,
          new Map(departments.map((department) => [department.id, department])),
          new Map(positions.map((position) => [position.id, position])),
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<EmployeeDto> {
    const parsedInput = this.parseCreateOrUpdateInput(input);
    const existing = await this.employeeRepository.findByCode(parsedInput.employeeCode);
    if (existing) {
      throw conflict('EMPLOYEE_CODE_EXISTS', 'Employee code already exists', {
        employeeCode: parsedInput.employeeCode,
      });
    }

    const timestamp = nowIso();
    const employee = await this.employeeRepository.save({
      id: createId('employee'),
      employeeCode: parsedInput.employeeCode,
      employeeName: parsedInput.employeeName,
      status: parsedInput.status,
      defaultCurrency: parsedInput.defaultCurrency,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(employee.id);
  }

  async update(id: string, input: unknown): Promise<EmployeeDto> {
    const existing = await this.employeeRepository.findById(id);
    if (!existing) {
      throw notFound('EMPLOYEE_NOT_FOUND', 'Employee not found', { id });
    }

    const parsedInput = this.parseCreateOrUpdateInput(input);
    const codeOwner = await this.employeeRepository.findByCode(parsedInput.employeeCode);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('EMPLOYEE_CODE_EXISTS', 'Employee code already exists', {
        employeeCode: parsedInput.employeeCode,
      });
    }

    await this.employeeRepository.save({
      ...existing,
      employeeCode: parsedInput.employeeCode,
      employeeName: parsedInput.employeeName,
      status: parsedInput.status,
      defaultCurrency: parsedInput.defaultCurrency,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.employeeRepository.findById(id);
    if (!existing) {
      throw notFound('EMPLOYEE_NOT_FOUND', 'Employee not found', { id });
    }

    const linkedEmployment = (await this.employmentRepository.listAll()).find(
      (item) => item.employeeId === id,
    );
    if (linkedEmployment) {
      throw conflict(
        'EMPLOYEE_HAS_EMPLOYMENTS',
        'Employee is referenced by at least one employment',
        { id, employmentId: linkedEmployment.id },
      );
    }

    const linkedExpenseClaim = (await this.expenseClaimRepository.listAll()).find(
      (item) => item.employeeId === id,
    );
    if (linkedExpenseClaim) {
      throw conflict(
        'EMPLOYEE_HAS_EXPENSE_CLAIMS',
        'Employee is referenced by at least one expense claim',
        { id, expenseClaimId: linkedExpenseClaim.id },
      );
    }

    await this.employeeRepository.delete(id);
  }

  private parseCreateOrUpdateInput(
    input: unknown,
  ): CreateEmployeeInput | UpdateEmployeeInput {
    const payload = asRecord(input);

    return {
      employeeCode: requiredString(readField(payload, 'employeeCode'), 'employeeCode')
        .toUpperCase(),
      employeeName: requiredString(readField(payload, 'employeeName'), 'employeeName'),
      status: requiredEnum(readField(payload, 'status'), employeeStatuses, 'status'),
      defaultCurrency: requiredCurrencyCode(
        readField(payload, 'defaultCurrency'),
        'defaultCurrency',
      ),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async toDto(id: string): Promise<EmployeeDto> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw notFound('EMPLOYEE_NOT_FOUND', 'Employee not found', { id });
    }

    const [employments, departments, positions] = await Promise.all([
      this.employmentRepository.listAll(),
      this.departmentRepository.listAll(),
      this.positionRepository.listAll(),
    ]);

    return mapEmployeeToDto(
      employee,
      this.groupEmploymentsByEmployeeId(employments),
      new Map(departments.map((department) => [department.id, department])),
      new Map(positions.map((position) => [position.id, position])),
    );
  }

  private groupEmploymentsByEmployeeId(
    employments: Employment[],
  ): Map<string, Employment[]> {
    const map = new Map<string, Employment[]>();

    for (const employment of employments) {
      const bucket = map.get(employment.employeeId) ?? [];
      bucket.push(employment);
      map.set(employment.employeeId, bucket);
    }

    return map;
  }
}
