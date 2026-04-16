import type {
  CreatePurchaseOrderInput,
  PaginatedDto,
  PurchaseOrderDto,
  PurchaseOrderListQuery,
  UpdatePurchaseOrderInput,
} from './dto.ts';
import { mapPurchaseOrderToDto } from './mappers.ts';
import type {
  GoodsReceiptRepository,
  ProductRepository,
  PurchaseOrderRepository,
  VendorInvoiceRepository,
  VendorRepository,
} from '../../domain/procurement/repositories.ts';
import { purchaseOrderStatuses } from '../../domain/procurement/types.ts';
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

export class PurchaseOrderService {
  purchaseOrderRepository: PurchaseOrderRepository;
  vendorRepository: VendorRepository;
  productRepository: ProductRepository;
  goodsReceiptRepository: GoodsReceiptRepository;
  vendorInvoiceRepository: VendorInvoiceRepository;

  constructor(
    purchaseOrderRepository: PurchaseOrderRepository,
    vendorRepository: VendorRepository,
    productRepository: ProductRepository,
    goodsReceiptRepository: GoodsReceiptRepository,
    vendorInvoiceRepository: VendorInvoiceRepository,
  ) {
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.vendorRepository = vendorRepository;
    this.productRepository = productRepository;
    this.goodsReceiptRepository = goodsReceiptRepository;
    this.vendorInvoiceRepository = vendorInvoiceRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<PurchaseOrderDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: PurchaseOrderListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      vendorId: optionalString(readField(query, 'vendorId')),
      productId: optionalString(readField(query, 'productId')),
      status: optionalEnum(readField(query, 'status'), purchaseOrderStatuses, 'status'),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const [purchaseOrders, vendors, products, goodsReceipts, invoices] = await Promise.all([
      this.purchaseOrderRepository.listAll(),
      this.vendorRepository.listAll(),
      this.productRepository.listAll(),
      this.goodsReceiptRepository.listAll(),
      this.vendorInvoiceRepository.listAll(),
    ]);

    const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    const productsById = new Map(products.map((product) => [product.id, product]));
    const goodsReceiptsByPurchaseOrderId = this.groupByKey(
      goodsReceipts,
      (goodsReceipt) => goodsReceipt.purchaseOrderId,
    );
    const invoicesByPurchaseOrderId = this.groupByKey(
      invoices,
      (invoice) => invoice.purchaseOrderId,
    );

    const filtered = sortByNewest(purchaseOrders, 'createdAt').filter((purchaseOrder) => {
      const vendor = vendorsById.get(purchaseOrder.vendorId) ?? null;
      const product = productsById.get(purchaseOrder.productId) ?? null;

      return (
        includesSearch(
          [
            purchaseOrder.purchaseOrderNo,
            purchaseOrder.referenceNo,
            purchaseOrder.description,
            vendor?.vendorName ?? '',
            product?.productName ?? '',
            product?.productCode ?? '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.vendorId || purchaseOrder.vendorId === parsedQuery.vendorId) &&
        (!parsedQuery.productId || purchaseOrder.productId === parsedQuery.productId) &&
        (!parsedQuery.status || purchaseOrder.status === parsedQuery.status) &&
        isWithinDateRange(
          `${purchaseOrder.orderDate}T00:00:00.000Z`,
          parsedQuery.dateFrom,
          parsedQuery.dateTo,
        )
      );
    });

    return paginate(
      filtered.map((purchaseOrder) =>
        mapPurchaseOrderToDto(
          purchaseOrder,
          vendorsById,
          productsById,
          goodsReceiptsByPurchaseOrderId,
          invoicesByPurchaseOrderId,
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<PurchaseOrderDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const purchaseOrders = await this.purchaseOrderRepository.listAll();
    const purchaseOrderNo = parsedInput.purchaseOrderNo
      ? parsedInput.purchaseOrderNo.toUpperCase()
      : nextSequenceCode(
          'PO',
          purchaseOrders.map((purchaseOrder) => purchaseOrder.purchaseOrderNo),
        );

    const existing = await this.purchaseOrderRepository.findByOrderNo(purchaseOrderNo);
    if (existing) {
      throw conflict('PURCHASE_ORDER_NO_EXISTS', 'Purchase order number already exists', {
        purchaseOrderNo,
      });
    }

    await this.resolveOrderContext(parsedInput);
    const timestamp = nowIso();
    const created = await this.purchaseOrderRepository.save({
      id: createId('purchaseorder'),
      purchaseOrderNo,
      vendorId: parsedInput.vendorId,
      productId: parsedInput.productId,
      quantity: parsedInput.quantity,
      unitPrice: parsedInput.unitPrice,
      amount: roundMoney(parsedInput.quantity * parsedInput.unitPrice),
      currencyCode: parsedInput.currency,
      orderDate: parsedInput.orderDate,
      status: parsedInput.status,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<PurchaseOrderDto> {
    const existing = await this.purchaseOrderRepository.findById(id);
    if (!existing) {
      throw notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found', { id });
    }

    await this.ensureNoDownstreamDocuments(id);
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const purchaseOrderNo = parsedInput.purchaseOrderNo
      ? parsedInput.purchaseOrderNo.toUpperCase()
      : existing.purchaseOrderNo;
    const codeOwner = await this.purchaseOrderRepository.findByOrderNo(purchaseOrderNo);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('PURCHASE_ORDER_NO_EXISTS', 'Purchase order number already exists', {
        purchaseOrderNo,
      });
    }

    await this.resolveOrderContext(parsedInput);
    await this.purchaseOrderRepository.save({
      ...existing,
      purchaseOrderNo,
      vendorId: parsedInput.vendorId,
      productId: parsedInput.productId,
      quantity: parsedInput.quantity,
      unitPrice: parsedInput.unitPrice,
      amount: roundMoney(parsedInput.quantity * parsedInput.unitPrice),
      currencyCode: parsedInput.currency,
      orderDate: parsedInput.orderDate,
      status: parsedInput.status,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.purchaseOrderRepository.findById(id);
    if (!existing) {
      throw notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found', { id });
    }

    await this.ensureNoDownstreamDocuments(id);
    await this.purchaseOrderRepository.delete(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreatePurchaseOrderInput | UpdatePurchaseOrderInput> {
    const payload = asRecord(input);

    return {
      purchaseOrderNo: optionalString(readField(payload, 'purchaseOrderNo')),
      vendorId: requiredString(readField(payload, 'vendorId'), 'vendorId'),
      productId: requiredString(readField(payload, 'productId'), 'productId'),
      quantity: roundMoney(requiredPositiveNumber(readField(payload, 'quantity'), 'quantity')),
      unitPrice: roundMoney(
        requiredPositiveNumber(readField(payload, 'unitPrice'), 'unitPrice'),
      ),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      orderDate: requiredDate(readField(payload, 'orderDate'), 'orderDate'),
      status:
        optionalEnum(readField(payload, 'status'), purchaseOrderStatuses, 'status') ?? 'DRAFT',
      referenceNo: optionalString(readField(payload, 'referenceNo')),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async resolveOrderContext(
    input: CreatePurchaseOrderInput | UpdatePurchaseOrderInput,
  ) {
    const [vendor, product] = await Promise.all([
      this.vendorRepository.findById(input.vendorId),
      this.productRepository.findById(input.productId),
    ]);

    if (!vendor) {
      throw notFound('VENDOR_NOT_FOUND', 'Vendor not found', { vendorId: input.vendorId });
    }

    if (!product) {
      throw notFound('PRODUCT_NOT_FOUND', 'Product not found', { productId: input.productId });
    }

    return { vendor, product };
  }

  private async ensureNoDownstreamDocuments(id: string): Promise<void> {
    const linkedGoodsReceipt = (await this.goodsReceiptRepository.listAll()).find(
      (item) => item.purchaseOrderId === id,
    );
    if (linkedGoodsReceipt) {
      throw conflict(
        'PURCHASE_ORDER_HAS_GOODS_RECEIPTS',
        'Purchase order is referenced by at least one goods receipt',
        { id, goodsReceiptId: linkedGoodsReceipt.id },
      );
    }

    const linkedInvoice = (await this.vendorInvoiceRepository.listAll()).find(
      (item) => item.purchaseOrderId === id,
    );
    if (linkedInvoice) {
      throw conflict(
        'PURCHASE_ORDER_HAS_VENDOR_INVOICES',
        'Purchase order is referenced by at least one vendor invoice',
        { id, vendorInvoiceId: linkedInvoice.id },
      );
    }
  }

  private async toDto(id: string): Promise<PurchaseOrderDto> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(id);
    if (!purchaseOrder) {
      throw notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found', { id });
    }

    const [vendors, products, goodsReceipts, invoices] = await Promise.all([
      this.vendorRepository.listAll(),
      this.productRepository.listAll(),
      this.goodsReceiptRepository.listAll(),
      this.vendorInvoiceRepository.listAll(),
    ]);

    return mapPurchaseOrderToDto(
      purchaseOrder,
      new Map(vendors.map((vendor) => [vendor.id, vendor])),
      new Map(products.map((product) => [product.id, product])),
      this.groupByKey(goodsReceipts, (goodsReceipt) => goodsReceipt.purchaseOrderId),
      this.groupByKey(invoices, (invoice) => invoice.purchaseOrderId),
    );
  }

  private groupByKey<T>(items: T[], readKey: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();

    for (const item of items) {
      const key = readKey(item);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }

    return map;
  }
}
