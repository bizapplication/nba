import type {
  CreateExpenseClaimInput,
  ExpenseClaimDto,
  ExpenseClaimListQuery,
  PaginatedDto,
  UpdateExpenseClaimInput,
} from './dto.ts';
import { mapExpenseClaimToDto } from './mappers.ts';
import type { AccountRepository, TransactionRepository } from '../../domain/fin/repositories.ts';
import type { PaymentOrderRepository } from '../../domain/procurement/repositories.ts';
import type {
  DepartmentRepository,
  EmployeeRepository,
  EmploymentRepository,
  ExpenseClaimRepository,
} from '../../domain/hr/repositories.ts';
import { expenseClaimStatuses } from '../../domain/hr/types.ts';
import { createId, nextSequenceCode } from '../../shared/id.ts';
import { conflict, notFound } from '../../shared/errors.ts';
import {
  includesSearch,
  isWithinDateRange,
  paginate,
  sortByNewest,
} from '../../shared/pagination.ts';
import { roundMoney } from '../../shared/money.ts';
import { nowIso } from '../../shared/time.ts';
import {
  asRecord,
  optionalEnum,
  optionalInteger,
  optionalString,
  readField,
  requiredCurrencyCode,
  requiredDate,
  requiredPositiveNumber,
  requiredString,
} from '../../shared/validation.ts';
import { TransactionService } from '../fin/transaction-service.ts';

export class ExpenseClaimService {
  expenseClaimRepository: ExpenseClaimRepository;
  employeeRepository: EmployeeRepository;
  departmentRepository: DepartmentRepository;
  employmentRepository: EmploymentRepository;
  paymentOrderRepository: PaymentOrderRepository;
  accountRepository: AccountRepository;
  transactionRepository: TransactionRepository;
  transactionService: TransactionService;

  constructor(
    expenseClaimRepository: ExpenseClaimRepository,
    employeeRepository: EmployeeRepository,
    departmentRepository: DepartmentRepository,
    employmentRepository: EmploymentRepository,
    paymentOrderRepository: PaymentOrderRepository,
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
    transactionService: TransactionService,
  ) {
    this.expenseClaimRepository = expenseClaimRepository;
    this.employeeRepository = employeeRepository;
    this.departmentRepository = departmentRepository;
    this.employmentRepository = employmentRepository;
    this.paymentOrderRepository = paymentOrderRepository;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
    this.transactionService = transactionService;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<ExpenseClaimDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: ExpenseClaimListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      employeeId: optionalString(readField(query, 'employeeId')),
      departmentId: optionalString(readField(query, 'departmentId')),
      status: optionalEnum(readField(query, 'status'), expenseClaimStatuses, 'status'),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const [claims, employees, departments, paymentOrders, transactions] =
      await Promise.all([
        this.expenseClaimRepository.listAll(),
        this.employeeRepository.listAll(),
        this.departmentRepository.listAll(),
        this.paymentOrderRepository.listAll(),
        this.transactionRepository.listAll(),
      ]);

    const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
    const filtered = sortByNewest(claims, 'createdAt').filter((claim) => {
      return (
        includesSearch(
          [
            claim.expenseClaimNo,
            claim.referenceNo,
            claim.purpose,
            claim.description,
            employeesById.get(claim.employeeId)?.employeeName ?? '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.employeeId || claim.employeeId === parsedQuery.employeeId) &&
        (!parsedQuery.departmentId || claim.departmentId === parsedQuery.departmentId) &&
        (!parsedQuery.status || claim.status === parsedQuery.status) &&
        isWithinDateRange(
          `${claim.claimDate}T00:00:00.000Z`,
          parsedQuery.dateFrom,
          parsedQuery.dateTo,
        )
      );
    });

    return paginate(
      filtered.map((claim) =>
        mapExpenseClaimToDto(
          claim,
          employeesById,
          new Map(departments.map((department) => [department.id, department])),
          new Map(paymentOrders.map((paymentOrder) => [paymentOrder.id, paymentOrder])),
          new Map(transactions.map((transaction) => [transaction.header.id, transaction])),
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<ExpenseClaimDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const claims = await this.expenseClaimRepository.listAll();
    const expenseClaimNo = parsedInput.expenseClaimNo
      ? parsedInput.expenseClaimNo.toUpperCase()
      : nextSequenceCode(
          'EXP',
          claims.map((claim) => claim.expenseClaimNo),
        );

    const existing = await this.expenseClaimRepository.findByClaimNo(expenseClaimNo);
    if (existing) {
      throw conflict('EXPENSE_CLAIM_NO_EXISTS', 'Expense claim number already exists', {
        expenseClaimNo,
      });
    }

    const financeContext = await this.resolveClaimContext(parsedInput);
    const timestamp = nowIso();
    const created = await this.expenseClaimRepository.save({
      id: createId('expenseclaim'),
      expenseClaimNo,
      employeeId: parsedInput.employeeId,
      departmentId: parsedInput.departmentId,
      payFromAccountId: financeContext.payFromAccount.id,
      expenseAccountId: financeContext.expenseAccount.id,
      ledgerBookId: financeContext.payFromAccount.ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      claimDate: parsedInput.claimDate,
      purpose: parsedInput.purpose,
      status: 'DRAFT',
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      linkedPaymentOrderId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      executedAt: null,
    });

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<ExpenseClaimDto> {
    const existing = await this.expenseClaimRepository.findById(id);
    if (!existing) {
      throw notFound('EXPENSE_CLAIM_NOT_FOUND', 'Expense claim not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'EXPENSE_CLAIM_NOT_EDITABLE',
        'Only draft expense claims can be edited',
        { id, status: existing.status },
      );
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const expenseClaimNo = parsedInput.expenseClaimNo
      ? parsedInput.expenseClaimNo.toUpperCase()
      : existing.expenseClaimNo;
    const codeOwner = await this.expenseClaimRepository.findByClaimNo(expenseClaimNo);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('EXPENSE_CLAIM_NO_EXISTS', 'Expense claim number already exists', {
        expenseClaimNo,
      });
    }

    const financeContext = await this.resolveClaimContext(parsedInput);
    await this.expenseClaimRepository.save({
      ...existing,
      expenseClaimNo,
      employeeId: parsedInput.employeeId,
      departmentId: parsedInput.departmentId,
      payFromAccountId: financeContext.payFromAccount.id,
      expenseAccountId: financeContext.expenseAccount.id,
      ledgerBookId: financeContext.payFromAccount.ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      claimDate: parsedInput.claimDate,
      purpose: parsedInput.purpose,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.expenseClaimRepository.findById(id);
    if (!existing) {
      throw notFound('EXPENSE_CLAIM_NOT_FOUND', 'Expense claim not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'EXPENSE_CLAIM_NOT_DELETABLE',
        'Only draft expense claims can be deleted',
        { id, status: existing.status },
      );
    }

    await this.expenseClaimRepository.delete(id);
  }

  async execute(id: string): Promise<ExpenseClaimDto> {
    const existing = await this.expenseClaimRepository.findById(id);
    if (!existing) {
      throw notFound('EXPENSE_CLAIM_NOT_FOUND', 'Expense claim not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'EXPENSE_CLAIM_NOT_EXECUTABLE',
        'Only draft expense claims can be executed',
        { id, status: existing.status },
      );
    }

    const [employee, department] = await Promise.all([
      this.employeeRepository.findById(existing.employeeId),
      this.departmentRepository.findById(existing.departmentId),
    ]);

    if (!employee) {
      throw notFound('EMPLOYEE_NOT_FOUND', 'Employee not found', {
        employeeId: existing.employeeId,
      });
    }

    if (!department) {
      throw notFound('DEPARTMENT_NOT_FOUND', 'Department not found', {
        departmentId: existing.departmentId,
      });
    }

    await this.ensureStoredFinanceAccounts(existing);
    const payments = await this.paymentOrderRepository.listAll();
    const paymentOrderNo = nextSequenceCode(
      'PMT',
      payments.map((payment) => payment.paymentOrderNo),
    );
    const timestamp = nowIso();
    const paymentOrder = await this.paymentOrderRepository.save({
      id: createId('payment'),
      paymentOrderNo,
      payeeType: 'EMPLOYEE',
      vendorId: null,
      vendorBankAccountId: null,
      employeeId: existing.employeeId,
      payFromAccountId: existing.payFromAccountId,
      expenseAccountId: existing.expenseAccountId,
      ledgerBookId: existing.ledgerBookId,
      amount: existing.amount,
      currencyCode: existing.currencyCode,
      purpose: existing.purpose,
      paymentDate: existing.claimDate,
      status: 'DRAFT',
      referenceNo: existing.referenceNo ?? existing.expenseClaimNo,
      description:
        existing.description ??
        `Expense claim reimbursement for ${employee.employeeName} / ${department.departmentName}: ${existing.purpose}`,
      sourceType: 'EXPENSE_CLAIM',
      sourceId: existing.id,
      linkedTransactionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      executedAt: null,
    });

    const transaction = await this.transactionService.create({
      type: 'PAYMENT',
      amount: existing.amount,
      debitAccountId: existing.expenseAccountId,
      creditAccountId: existing.payFromAccountId,
      ledgerId: existing.ledgerBookId,
      transactionDate: existing.claimDate,
      referenceNo: existing.referenceNo ?? existing.expenseClaimNo,
      description:
        existing.description ??
        `Expense claim reimbursement for ${employee.employeeName}: ${existing.purpose}`,
      currency: existing.currencyCode,
      sourceType: 'PAYMENT_ORDER',
      sourceId: paymentOrder.id,
    });

    const postedTransaction = await this.transactionService.post(transaction.id);
    await this.paymentOrderRepository.save({
      ...paymentOrder,
      status: 'EXECUTED',
      linkedTransactionId: postedTransaction.id,
      executedAt: nowIso(),
      updatedAt: nowIso(),
    });
    await this.expenseClaimRepository.save({
      ...existing,
      status: 'EXECUTED',
      linkedPaymentOrderId: paymentOrder.id,
      executedAt: nowIso(),
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateExpenseClaimInput | UpdateExpenseClaimInput> {
    const payload = asRecord(input);

    return {
      expenseClaimNo: optionalString(readField(payload, 'expenseClaimNo')),
      employeeId: requiredString(readField(payload, 'employeeId'), 'employeeId'),
      departmentId: requiredString(readField(payload, 'departmentId'), 'departmentId'),
      amount: roundMoney(
        requiredPositiveNumber(readField(payload, 'amount'), 'amount'),
      ),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      claimDate: requiredDate(readField(payload, 'claimDate'), 'claimDate'),
      purpose: requiredString(readField(payload, 'purpose'), 'purpose'),
      referenceNo: optionalString(readField(payload, 'referenceNo')),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async resolveClaimContext(
    input: CreateExpenseClaimInput | UpdateExpenseClaimInput,
  ) {
    const [employee, department, employments, accounts] = await Promise.all([
      this.employeeRepository.findById(input.employeeId),
      this.departmentRepository.findById(input.departmentId),
      this.employmentRepository.listAll(),
      this.accountRepository.listAll(),
    ]);

    if (!employee) {
      throw notFound('EMPLOYEE_NOT_FOUND', 'Employee not found', {
        employeeId: input.employeeId,
      });
    }

    if (!department) {
      throw notFound('DEPARTMENT_NOT_FOUND', 'Department not found', {
        departmentId: input.departmentId,
      });
    }

    const linkedEmployment = employments.find(
      (item) =>
        item.employeeId === input.employeeId &&
        item.departmentId === input.departmentId &&
        item.status === 'active',
    );
    if (!linkedEmployment) {
      throw conflict(
        'EXPENSE_CLAIM_EMPLOYMENT_MISMATCH',
        'Selected employee does not have an active employment in the department',
        {
          employeeId: input.employeeId,
          departmentId: input.departmentId,
        },
      );
    }

    const payFromAccount =
      accounts.find(
        (account) =>
          account.id === 'acct_cash_main' &&
          account.accountStatus === 'ACTIVE' &&
          account.currencyCode === input.currency,
      ) ??
      accounts.find(
        (account) =>
          account.accountCategory === 'ASSET' &&
          account.accountStatus === 'ACTIVE' &&
          account.currencyCode === input.currency,
      ) ??
      null;

    if (!payFromAccount) {
      throw conflict(
        'EXPENSE_CLAIM_PAY_FROM_ACCOUNT_NOT_FOUND',
        'No active pay-from account is available for the claim currency',
        { currency: input.currency },
      );
    }

    const expenseAccount =
      accounts.find(
        (account) =>
          account.id === 'acct_expense_office' &&
          account.accountStatus === 'ACTIVE' &&
          account.currencyCode === input.currency,
      ) ??
      accounts.find(
        (account) =>
          account.accountCategory === 'EXPENSE' &&
          account.accountStatus === 'ACTIVE' &&
          account.currencyCode === input.currency &&
          account.id !== payFromAccount.id,
      ) ??
      null;

    if (!expenseAccount) {
      throw conflict(
        'EXPENSE_CLAIM_EXPENSE_ACCOUNT_NOT_FOUND',
        'No active expense account is available for the claim currency',
        { currency: input.currency },
      );
    }

    if (payFromAccount.ledgerBookId !== expenseAccount.ledgerBookId) {
      throw conflict(
        'EXPENSE_CLAIM_LEDGER_MISMATCH',
        'Default pay-from account and expense account must belong to the same ledger',
        {
          payFromLedgerId: payFromAccount.ledgerBookId,
          expenseLedgerId: expenseAccount.ledgerBookId,
        },
      );
    }

    return {
      employee,
      department,
      employment: linkedEmployment,
      payFromAccount,
      expenseAccount,
    };
  }

  private async ensureStoredFinanceAccounts(claim: {
    payFromAccountId: string;
    expenseAccountId: string;
    currencyCode: string;
  }) {
    const [payFromAccount, expenseAccount] = await Promise.all([
      this.accountRepository.findById(claim.payFromAccountId),
      this.accountRepository.findById(claim.expenseAccountId),
    ]);

    if (!payFromAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Stored pay-from account was not found', {
        accountId: claim.payFromAccountId,
      });
    }

    if (!expenseAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Stored expense account was not found', {
        accountId: claim.expenseAccountId,
      });
    }

    if (
      payFromAccount.currencyCode !== claim.currencyCode ||
      expenseAccount.currencyCode !== claim.currencyCode
    ) {
      throw conflict(
        'EXPENSE_CLAIM_CURRENCY_MISMATCH',
        'Stored finance accounts do not match the claim currency',
        {
          currency: claim.currencyCode,
          payFromAccountCurrency: payFromAccount.currencyCode,
          expenseAccountCurrency: expenseAccount.currencyCode,
        },
      );
    }
  }

  private async toDto(id: string): Promise<ExpenseClaimDto> {
    const claim = await this.expenseClaimRepository.findById(id);
    if (!claim) {
      throw notFound('EXPENSE_CLAIM_NOT_FOUND', 'Expense claim not found', { id });
    }

    const [employees, departments, paymentOrders, transactions] = await Promise.all([
      this.employeeRepository.listAll(),
      this.departmentRepository.listAll(),
      this.paymentOrderRepository.listAll(),
      this.transactionRepository.listAll(),
    ]);

    return mapExpenseClaimToDto(
      claim,
      new Map(employees.map((employee) => [employee.id, employee])),
      new Map(departments.map((department) => [department.id, department])),
      new Map(paymentOrders.map((paymentOrder) => [paymentOrder.id, paymentOrder])),
      new Map(transactions.map((transaction) => [transaction.header.id, transaction])),
    );
  }
}
