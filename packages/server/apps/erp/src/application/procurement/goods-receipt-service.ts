import type {
  CreateGoodsReceiptInput,
  GoodsReceiptDto,
  GoodsReceiptListQuery,
  PaginatedDto,
  UpdateGoodsReceiptInput,
} from './dto.ts';
import { mapGoodsReceiptToDto } from './mappers.ts';
import type {
  GoodsReceiptRepository,
  ProductRepository,
  PurchaseOrderRepository,
  VendorInvoiceRepository,
  VendorRepository,
} from '../../domain/procurement/repositories.ts';
import { goodsReceiptStatuses } from '../../domain/procurement/types.ts';
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
  requiredDate,
  requiredPositiveNumber,
  requiredString,
} from '../../shared/validation.ts';

export class GoodsReceiptService {
  goodsReceiptRepository: GoodsReceiptRepository;
  purchaseOrderRepository: PurchaseOrderRepository;
  vendorRepository: VendorRepository;
  productRepository: ProductRepository;
  vendorInvoiceRepository: VendorInvoiceRepository;

  constructor(
    goodsReceiptRepository: GoodsReceiptRepository,
    purchaseOrderRepository: PurchaseOrderRepository,
    vendorRepository: VendorRepository,
    productRepository: ProductRepository,
    vendorInvoiceRepository: VendorInvoiceRepository,
  ) {
    this.goodsReceiptRepository = goodsReceiptRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.vendorRepository = vendorRepository;
    this.productRepository = productRepository;
    this.vendorInvoiceRepository = vendorInvoiceRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<GoodsReceiptDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: GoodsReceiptListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      purchaseOrderId: optionalString(readField(query, 'purchaseOrderId')),
      vendorId: optionalString(readField(query, 'vendorId')),
      productId: optionalString(readField(query, 'productId')),
      status: optionalEnum(readField(query, 'status'), goodsReceiptStatuses, 'status'),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const [goodsReceipts, purchaseOrders, vendors, products] = await Promise.all([
      this.goodsReceiptRepository.listAll(),
      this.purchaseOrderRepository.listAll(),
      this.vendorRepository.listAll(),
      this.productRepository.listAll(),
    ]);

    const purchaseOrdersById = new Map(
      purchaseOrders.map((purchaseOrder) => [purchaseOrder.id, purchaseOrder]),
    );
    const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    const productsById = new Map(products.map((product) => [product.id, product]));

    const filtered = sortByNewest(goodsReceipts, 'createdAt').filter((goodsReceipt) => {
      const purchaseOrder = purchaseOrdersById.get(goodsReceipt.purchaseOrderId) ?? null;
      const vendor = vendorsById.get(goodsReceipt.vendorId) ?? null;
      const product = productsById.get(goodsReceipt.productId) ?? null;

      return (
        includesSearch(
          [
            goodsReceipt.goodsReceiptNo,
            goodsReceipt.referenceNo,
            goodsReceipt.description,
            purchaseOrder?.purchaseOrderNo ?? '',
            vendor?.vendorName ?? '',
            product?.productName ?? '',
            product?.productCode ?? '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.purchaseOrderId ||
          goodsReceipt.purchaseOrderId === parsedQuery.purchaseOrderId) &&
        (!parsedQuery.vendorId || goodsReceipt.vendorId === parsedQuery.vendorId) &&
        (!parsedQuery.productId || goodsReceipt.productId === parsedQuery.productId) &&
        (!parsedQuery.status || goodsReceipt.status === parsedQuery.status) &&
        isWithinDateRange(
          `${goodsReceipt.receiptDate}T00:00:00.000Z`,
          parsedQuery.dateFrom,
          parsedQuery.dateTo,
        )
      );
    });

    return paginate(
      filtered.map((goodsReceipt) =>
        mapGoodsReceiptToDto(
          goodsReceipt,
          purchaseOrdersById,
          vendorsById,
          productsById,
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<GoodsReceiptDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const goodsReceipts = await this.goodsReceiptRepository.listAll();
    const goodsReceiptNo = parsedInput.goodsReceiptNo
      ? parsedInput.goodsReceiptNo.toUpperCase()
      : nextSequenceCode(
          'GR',
          goodsReceipts.map((goodsReceipt) => goodsReceipt.goodsReceiptNo),
        );

    const existing = await this.goodsReceiptRepository.findByReceiptNo(goodsReceiptNo);
    if (existing) {
      throw conflict('GOODS_RECEIPT_NO_EXISTS', 'Goods receipt number already exists', {
        goodsReceiptNo,
      });
    }

    const { purchaseOrder } = await this.resolveReceiptContext(parsedInput);
    const timestamp = nowIso();
    const created = await this.goodsReceiptRepository.save({
      id: createId('goodsreceipt'),
      goodsReceiptNo,
      purchaseOrderId: parsedInput.purchaseOrderId,
      vendorId: purchaseOrder.vendorId,
      productId: purchaseOrder.productId,
      quantity: parsedInput.quantity,
      receiptDate: parsedInput.receiptDate,
      status: parsedInput.status,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<GoodsReceiptDto> {
    const existing = await this.goodsReceiptRepository.findById(id);
    if (!existing) {
      throw notFound('GOODS_RECEIPT_NOT_FOUND', 'Goods receipt not found', { id });
    }

    await this.ensureNoLinkedInvoices(id);
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const goodsReceiptNo = parsedInput.goodsReceiptNo
      ? parsedInput.goodsReceiptNo.toUpperCase()
      : existing.goodsReceiptNo;
    const codeOwner = await this.goodsReceiptRepository.findByReceiptNo(goodsReceiptNo);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('GOODS_RECEIPT_NO_EXISTS', 'Goods receipt number already exists', {
        goodsReceiptNo,
      });
    }

    const { purchaseOrder } = await this.resolveReceiptContext(parsedInput, id);
    await this.goodsReceiptRepository.save({
      ...existing,
      goodsReceiptNo,
      purchaseOrderId: parsedInput.purchaseOrderId,
      vendorId: purchaseOrder.vendorId,
      productId: purchaseOrder.productId,
      quantity: parsedInput.quantity,
      receiptDate: parsedInput.receiptDate,
      status: parsedInput.status,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.goodsReceiptRepository.findById(id);
    if (!existing) {
      throw notFound('GOODS_RECEIPT_NOT_FOUND', 'Goods receipt not found', { id });
    }

    await this.ensureNoLinkedInvoices(id);
    await this.goodsReceiptRepository.delete(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateGoodsReceiptInput | UpdateGoodsReceiptInput> {
    const payload = asRecord(input);

    return {
      goodsReceiptNo: optionalString(readField(payload, 'goodsReceiptNo')),
      purchaseOrderId: requiredString(readField(payload, 'purchaseOrderId'), 'purchaseOrderId'),
      quantity: roundMoney(requiredPositiveNumber(readField(payload, 'quantity'), 'quantity')),
      receiptDate: requiredDate(readField(payload, 'receiptDate'), 'receiptDate'),
      status:
        optionalEnum(readField(payload, 'status'), goodsReceiptStatuses, 'status') ??
        'DRAFT',
      referenceNo: optionalString(readField(payload, 'referenceNo')),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async resolveReceiptContext(
    input: CreateGoodsReceiptInput | UpdateGoodsReceiptInput,
    currentId?: string,
  ) {
    const purchaseOrder = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!purchaseOrder) {
      throw notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found', {
        purchaseOrderId: input.purchaseOrderId,
      });
    }

    if (purchaseOrder.status === 'CANCELLED') {
      throw conflict(
        'GOODS_RECEIPT_PURCHASE_ORDER_CANCELLED',
        'Cancelled purchase orders cannot be received',
        { purchaseOrderId: input.purchaseOrderId },
      );
    }

    const receivedQuantity = (await this.goodsReceiptRepository.listAll())
      .filter(
        (goodsReceipt) =>
          goodsReceipt.purchaseOrderId === input.purchaseOrderId &&
          goodsReceipt.id !== currentId &&
          goodsReceipt.status !== 'CANCELLED',
      )
      .reduce((total, goodsReceipt) => total + goodsReceipt.quantity, 0);

    if (roundMoney(receivedQuantity + input.quantity) > roundMoney(purchaseOrder.quantity)) {
      throw conflict(
        'GOODS_RECEIPT_QUANTITY_EXCEEDS_PURCHASE_ORDER',
        'Goods receipt quantity exceeds the ordered quantity',
        {
          purchaseOrderId: input.purchaseOrderId,
          orderedQuantity: purchaseOrder.quantity,
          receivedQuantity,
          newQuantity: input.quantity,
        },
      );
    }

    return { purchaseOrder };
  }

  private async ensureNoLinkedInvoices(id: string): Promise<void> {
    const linkedInvoice = (await this.vendorInvoiceRepository.listAll()).find(
      (item) => item.goodsReceiptId === id,
    );
    if (linkedInvoice) {
      throw conflict(
        'GOODS_RECEIPT_HAS_VENDOR_INVOICES',
        'Goods receipt is referenced by at least one vendor invoice',
        { id, vendorInvoiceId: linkedInvoice.id },
      );
    }
  }

  private async toDto(id: string): Promise<GoodsReceiptDto> {
    const goodsReceipt = await this.goodsReceiptRepository.findById(id);
    if (!goodsReceipt) {
      throw notFound('GOODS_RECEIPT_NOT_FOUND', 'Goods receipt not found', { id });
    }

    const [purchaseOrders, vendors, products] = await Promise.all([
      this.purchaseOrderRepository.listAll(),
      this.vendorRepository.listAll(),
      this.productRepository.listAll(),
    ]);

    return mapGoodsReceiptToDto(
      goodsReceipt,
      new Map(purchaseOrders.map((purchaseOrder) => [purchaseOrder.id, purchaseOrder])),
      new Map(vendors.map((vendor) => [vendor.id, vendor])),
      new Map(products.map((product) => [product.id, product])),
    );
  }
}
