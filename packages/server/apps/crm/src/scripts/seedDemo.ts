import { AppDataSource, ensureDatabaseReady } from '../infrastructure/persistence/typeorm/data-source';
import { CustomerORM } from '../infrastructure/persistence/typeorm/entities/CustomerORM';
import { OpportunityORM } from '../infrastructure/persistence/typeorm/entities/OpportunityORM';
import { OrderORM } from '../infrastructure/persistence/typeorm/entities/OrderORM';
import type { OpportunityStage } from '../domain/opportunities/Opportunity';
import type { OrderStatus } from '../domain/orders/Order';

type CustomerSeed = {
  name: string;
  email: string;
  phone: string;
  company: string;
};

type OpportunitySeed = {
  customerEmail: string;
  title: string;
  description: string;
  amount: number;
  stage: OpportunityStage;
  expectedCloseDate: Date | null;
};

type OrderSeed = {
  orderNo: string;
  customerEmail: string;
  name: string;
  description: string;
  amount: number;
  status: OrderStatus;
};

const CUSTOMER_COUNT = 120;
const opportunityStages: OpportunityStage[] = ['new', 'qualified', 'proposal', 'won', 'lost'];
const orderStatuses: OrderStatus[] = ['draft', 'confirmed', 'completed', 'cancelled'];
const firstNames = [
  'Maya',
  'Oliver',
  'Nora',
  'Ethan',
  'Sophia',
  'Lucas',
  'Ava',
  'Daniel',
  'Emily',
  'Ryan',
  'Chloe',
  'Leo',
  'Grace',
  'Noah',
  'Ella',
  'Mason',
  'Luna',
  'Henry',
  'Zoe',
  'Jack',
];
const lastNames = [
  'Chen',
  'Sun',
  'Li',
  'Xu',
  'Gao',
  'Tan',
  'Lin',
  'Qiu',
  'Wang',
  'Zhang',
  'Zhou',
  'Liu',
  'Ye',
  'Hu',
  'Shen',
];
const companyPrefixes = [
  'Apex',
  'Blue Harbour',
  'Northstar',
  'Helio',
  'Summit',
  'Vertex',
  'Cinder',
  'Meridian',
  'Evergreen',
  'Silverline',
  'Golden Ridge',
  'Cloudbridge',
];
const companySuffixes = [
  'Retail Group',
  'Foods',
  'Logistics',
  'Medical',
  'Learning Labs',
  'Mobility',
  'Commerce',
  'Hotels',
  'Technology',
  'Industrial',
  'Energy',
  'Health',
];
const opportunityThemes = [
  'Customer onboarding',
  'National account rollout',
  'Renewal automation',
  'Sales operations upgrade',
  'Partner portal launch',
  'Retention dashboard',
  'Regional expansion',
  'Dealer collaboration program',
];
const orderThemes = [
  'Implementation package',
  'Success onboarding bundle',
  'Quarterly optimization service',
  'Migration workshop',
  'Enablement sprint',
  'Analytics addon',
];

function pad(value: number, size = 3): string {
  return String(value).padStart(size, '0');
}

function buildPhone(index: number): string {
  return `138${String(10000000 + index).slice(-8)}`;
}

function buildExpectedCloseDate(index: number, stage: OpportunityStage): Date {
  const month = (index % 12) + 1;
  const day = ((index * 3) % 26) + 1;

  if (stage === 'won' || stage === 'lost') {
    return new Date(Date.UTC(2026, Math.max(month - 2, 0), day));
  }

  return new Date(Date.UTC(2026, Math.min(month + 3, 11), day));
}

function buildCustomerSeeds(): CustomerSeed[] {
  return Array.from({ length: CUSTOMER_COUNT }, (_unused, zeroBasedIndex) => {
    const index = zeroBasedIndex + 1;
    const firstName = firstNames[zeroBasedIndex % firstNames.length];
    const lastName = lastNames[Math.floor(zeroBasedIndex / firstNames.length) % lastNames.length];
    const companyPrefix = companyPrefixes[zeroBasedIndex % companyPrefixes.length];
    const companySuffix = companySuffixes[Math.floor(zeroBasedIndex / companyPrefixes.length) % companySuffixes.length];

    return {
      name: `${firstName} ${lastName}`,
      email: `crm.demo.${pad(index)}@nba.local`,
      phone: buildPhone(index),
      company: `${companyPrefix} ${companySuffix} ${pad(index)}`,
    };
  });
}

function buildOpportunitySeeds(customers: CustomerSeed[]): OpportunitySeed[] {
  let runningNumber = 1;

  return customers.flatMap((customer, zeroBasedIndex) => {
    const perCustomer = zeroBasedIndex % 3 === 0 ? 2 : 1;

    return Array.from({ length: perCustomer }, (_unused, sequence) => {
      const itemNumber = runningNumber++;
      const stage = opportunityStages[(zeroBasedIndex + sequence) % opportunityStages.length];
      const theme = opportunityThemes[(zeroBasedIndex + sequence) % opportunityThemes.length];
      const amount = 60000 + zeroBasedIndex * 3500 + sequence * 12000;

      return {
        customerEmail: customer.email,
        title: `DEMO-OPP-${pad(itemNumber, 4)} ${theme}`,
        description: `${theme} for ${customer.company}, covering stakeholder alignment, process setup, and KPI tracking.`,
        amount,
        stage,
        expectedCloseDate: buildExpectedCloseDate(itemNumber, stage),
      };
    });
  });
}

function buildOrderSeeds(customers: CustomerSeed[]): OrderSeed[] {
  let runningNumber = 1;

  return customers.flatMap((customer, zeroBasedIndex) => {
    const perCustomer = zeroBasedIndex % 4 === 0 ? 2 : 1;

    return Array.from({ length: perCustomer }, (_unused, sequence) => {
      const itemNumber = runningNumber++;
      const status = orderStatuses[(zeroBasedIndex + sequence) % orderStatuses.length];
      const theme = orderThemes[(zeroBasedIndex + sequence) % orderThemes.length];
      const amount = 28000 + zeroBasedIndex * 1800 + sequence * 9500;

      return {
        orderNo: `CRM-2026-${pad(itemNumber, 4)}`,
        customerEmail: customer.email,
        name: `${theme} ${sequence + 1}`,
        description: `${theme} for ${customer.company}, including delivery planning, user enablement, and follow-up support.`,
        amount,
        status,
      };
    });
  });
}

const customerSeeds = buildCustomerSeeds();
const opportunitySeeds = buildOpportunitySeeds(customerSeeds);
const orderSeeds = buildOrderSeeds(customerSeeds);

async function upsertCustomer(seed: CustomerSeed) {
  const repository = AppDataSource.getRepository(CustomerORM);
  const existing = await repository.findOne({ where: { email: seed.email } });

  if (existing) {
    existing.name = seed.name;
    existing.email = seed.email;
    existing.phone = seed.phone;
    existing.company = seed.company;
    existing.isdelete = false;
    const saved = await repository.save(existing);
    return { customer: saved, action: 'updated' as const };
  }

  const created = await repository.save(
    repository.create({
      ...seed,
      isdelete: false,
    }),
  );

  return { customer: created, action: 'created' as const };
}

async function upsertOpportunity(seed: OpportunitySeed, customerId: string) {
  const repository = AppDataSource.getRepository(OpportunityORM);
  const existing = await repository.findOne({
    where: {
      customerId,
      title: seed.title,
    },
  });

  if (existing) {
    existing.customerId = customerId;
    existing.title = seed.title;
    existing.description = seed.description;
    existing.amount = seed.amount;
    existing.stage = seed.stage;
    existing.expectedCloseDate = seed.expectedCloseDate;
    existing.isdelete = false;
    await repository.save(existing);
    return 'updated' as const;
  }

  await repository.save(
    repository.create({
      customerId,
      title: seed.title,
      description: seed.description,
      amount: seed.amount,
      stage: seed.stage,
      expectedCloseDate: seed.expectedCloseDate,
      isdelete: false,
    }),
  );

  return 'created' as const;
}

async function upsertOrder(seed: OrderSeed, customerId: string) {
  const repository = AppDataSource.getRepository(OrderORM);
  const existing = await repository.findOne({ where: { orderNo: seed.orderNo } });

  if (existing) {
    existing.orderNo = seed.orderNo;
    existing.customerId = customerId;
    existing.name = seed.name;
    existing.description = seed.description;
    existing.amount = seed.amount;
    existing.status = seed.status;
    existing.isdelete = false;
    await repository.save(existing);
    return 'updated' as const;
  }

  await repository.save(
    repository.create({
      orderNo: seed.orderNo,
      customerId,
      name: seed.name,
      description: seed.description,
      amount: seed.amount,
      status: seed.status,
      isdelete: false,
    }),
  );

  return 'created' as const;
}

async function main() {
  await ensureDatabaseReady();
  await AppDataSource.initialize();

  const summary = {
    customers: { created: 0, updated: 0 },
    opportunities: { created: 0, updated: 0 },
    orders: { created: 0, updated: 0 },
  };

  try {
    const customersByEmail = new Map<string, CustomerORM>();

    for (const seed of customerSeeds) {
      const { customer, action } = await upsertCustomer(seed);
      customersByEmail.set(seed.email, customer);
      summary.customers[action] += 1;
    }

    for (const seed of opportunitySeeds) {
      const customer = customersByEmail.get(seed.customerEmail);

      if (!customer) {
        throw new Error(`Missing customer for opportunity seed: ${seed.customerEmail}`);
      }

      const action = await upsertOpportunity(seed, customer.id);
      summary.opportunities[action] += 1;
    }

    for (const seed of orderSeeds) {
      const customer = customersByEmail.get(seed.customerEmail);

      if (!customer) {
        throw new Error(`Missing customer for order seed: ${seed.customerEmail}`);
      }

      const action = await upsertOrder(seed, customer.id);
      summary.orders[action] += 1;
    }

    console.log('CRM demo seed completed.');
    console.table(summary);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch(async (error) => {
  console.error('CRM demo seed failed:', error);

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  process.exit(1);
});
