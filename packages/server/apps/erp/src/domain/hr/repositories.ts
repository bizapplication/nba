import type {
  Department,
  Employee,
  Employment,
  ExpenseClaim,
  Position,
} from './types.ts';

export interface DepartmentRepository {
  listAll(): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  findByCode(departmentCode: string): Promise<Department | null>;
  save(department: Department): Promise<Department>;
  delete(id: string): Promise<void>;
}

export interface PositionRepository {
  listAll(): Promise<Position[]>;
  findById(id: string): Promise<Position | null>;
  findByCode(positionCode: string): Promise<Position | null>;
  save(position: Position): Promise<Position>;
  delete(id: string): Promise<void>;
}

export interface EmployeeRepository {
  listAll(): Promise<Employee[]>;
  findById(id: string): Promise<Employee | null>;
  findByCode(employeeCode: string): Promise<Employee | null>;
  save(employee: Employee): Promise<Employee>;
  delete(id: string): Promise<void>;
}

export interface EmploymentRepository {
  listAll(): Promise<Employment[]>;
  findById(id: string): Promise<Employment | null>;
  save(employment: Employment): Promise<Employment>;
  delete(id: string): Promise<void>;
}

export interface ExpenseClaimRepository {
  listAll(): Promise<ExpenseClaim[]>;
  findById(id: string): Promise<ExpenseClaim | null>;
  findByClaimNo(expenseClaimNo: string): Promise<ExpenseClaim | null>;
  save(expenseClaim: ExpenseClaim): Promise<ExpenseClaim>;
  delete(id: string): Promise<void>;
}
