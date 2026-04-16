import type {
  GoodsReceipt,
  PaymentOrder,
  Product,
  PurchaseOrder,
  Vendor,
  VendorBankAccount,
  VendorInvoice,
} from './types.ts';

export interface ProductRepository {
  listAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByCode(productCode: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}

export interface VendorRepository {
  listAll(): Promise<Vendor[]>;
  findById(id: string): Promise<Vendor | null>;
  findByCode(vendorCode: string): Promise<Vendor | null>;
  save(vendor: Vendor): Promise<Vendor>;
  delete(id: string): Promise<void>;
}

export interface VendorBankAccountRepository {
  listAll(): Promise<VendorBankAccount[]>;
  findById(id: string): Promise<VendorBankAccount | null>;
  save(bankAccount: VendorBankAccount): Promise<VendorBankAccount>;
  delete(id: string): Promise<void>;
}

export interface PurchaseOrderRepository {
  listAll(): Promise<PurchaseOrder[]>;
  findById(id: string): Promise<PurchaseOrder | null>;
  findByOrderNo(purchaseOrderNo: string): Promise<PurchaseOrder | null>;
  save(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder>;
  delete(id: string): Promise<void>;
}

export interface GoodsReceiptRepository {
  listAll(): Promise<GoodsReceipt[]>;
  findById(id: string): Promise<GoodsReceipt | null>;
  findByReceiptNo(goodsReceiptNo: string): Promise<GoodsReceipt | null>;
  save(goodsReceipt: GoodsReceipt): Promise<GoodsReceipt>;
  delete(id: string): Promise<void>;
}

export interface VendorInvoiceRepository {
  listAll(): Promise<VendorInvoice[]>;
  findById(id: string): Promise<VendorInvoice | null>;
  findByInvoiceNo(vendorInvoiceNo: string): Promise<VendorInvoice | null>;
  save(vendorInvoice: VendorInvoice): Promise<VendorInvoice>;
  delete(id: string): Promise<void>;
}

export interface PaymentOrderRepository {
  listAll(): Promise<PaymentOrder[]>;
  findById(id: string): Promise<PaymentOrder | null>;
  findByOrderNo(paymentOrderNo: string): Promise<PaymentOrder | null>;
  save(paymentOrder: PaymentOrder): Promise<PaymentOrder>;
  delete(id: string): Promise<void>;
}
