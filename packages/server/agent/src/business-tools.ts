import { env } from './env.ts';

interface ToolResult {
  ok: true;
  content: string;
}

async function fetchJson(pathname: string) {
  const target = new URL(pathname, pathname.startsWith('/api/finance') ? env.erpApiBase : env.crmApiBase);
  const response = await fetch(target.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch ${target.toString()}: ${response.status}`);
  }

  return response.json();
}

export async function listCustomers(args: { keyword?: string; limit?: number }): Promise<ToolResult> {
  const query = new URLSearchParams();
  if (args.keyword) query.set('keyword', args.keyword);
  query.set('page', '1');
  query.set('pageSize', String(args.limit ?? 8));
  const data = await fetchJson(`/api/customers?${query.toString()}`);
  return {
    ok: true,
    content: JSON.stringify(data)
  };
}

export async function listOpportunities(args: { keyword?: string; limit?: number }): Promise<ToolResult> {
  const query = new URLSearchParams();
  if (args.keyword) query.set('keyword', args.keyword);
  query.set('page', '1');
  query.set('pageSize', String(args.limit ?? 8));
  const data = await fetchJson(`/api/opportunities?${query.toString()}`);
  return {
    ok: true,
    content: JSON.stringify(data)
  };
}

export async function listOrders(args: { keyword?: string; limit?: number }): Promise<ToolResult> {
  const query = new URLSearchParams();
  if (args.keyword) query.set('keyword', args.keyword);
  query.set('page', '1');
  query.set('pageSize', String(args.limit ?? 8));
  const data = await fetchJson(`/api/orders?${query.toString()}`);
  return {
    ok: true,
    content: JSON.stringify(data)
  };
}

export async function listFinanceAccounts(args: { limit?: number }): Promise<ToolResult> {
  const query = new URLSearchParams();
  query.set('page', '1');
  query.set('pageSize', String(args.limit ?? 8));
  const data = await fetchJson(`/api/finance/accounts?${query.toString()}`);
  return {
    ok: true,
    content: JSON.stringify(data)
  };
}

export async function listTransactions(args: { limit?: number }): Promise<ToolResult> {
  const query = new URLSearchParams();
  query.set('page', '1');
  query.set('pageSize', String(args.limit ?? 8));
  const data = await fetchJson(`/api/finance/transactions?${query.toString()}`);
  return {
    ok: true,
    content: JSON.stringify(data)
  };
}
