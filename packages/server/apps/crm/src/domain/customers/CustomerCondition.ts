import type { CustomerProps } from './Customer';

export type CustomerCondition = Partial<
  Pick<CustomerProps, 'id' | 'name' | 'email' | 'phone' | 'company' | 'isdelete'>
> & {
  ids?: string[];
  keyword?: string;
};
