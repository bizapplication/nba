import type {
  CreateProductInput,
  PaginatedDto,
  ProductDto,
  ProductListQuery,
  UpdateProductInput,
} from './dto.ts';
import { mapProductToDto } from './mappers.ts';
import type {
  GoodsReceiptRepository,
  ProductRepository,
  PurchaseOrderRepository,
} from '../../domain/procurement/repositories.ts';
import { lifecycleStatuses } from '../../domain/fin/types.ts';
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
  requiredEnum,
  requiredString,
} from '../../shared/validation.ts';

export class ProductService {
  productRepository: ProductRepository;
  purchaseOrderRepository: PurchaseOrderRepository;
  goodsReceiptRepository: GoodsReceiptRepository;

  constructor(
    productRepository: ProductRepository,
    purchaseOrderRepository: PurchaseOrderRepository,
    goodsReceiptRepository: GoodsReceiptRepository,
  ) {
    this.productRepository = productRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.goodsReceiptRepository = goodsReceiptRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<ProductDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: ProductListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), lifecycleStatuses, 'status'),
    };

    const products = await this.productRepository.listAll();
    const filtered = sortByNewest(products, 'createdAt').filter(
      (product) =>
        includesSearch(
          [product.productCode, product.productName, product.unit, product.description],
          parsedQuery.search,
        ) && (!parsedQuery.status || product.status === parsedQuery.status),
    );

    return paginate(
      filtered.map((product) => mapProductToDto(product)),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<ProductDto> {
    const parsedInput = this.parseCreateOrUpdateInput(input);
    const existing = await this.productRepository.findByCode(parsedInput.productCode);
    if (existing) {
      throw conflict('PRODUCT_CODE_EXISTS', 'Product code already exists', {
        productCode: parsedInput.productCode,
      });
    }

    const timestamp = nowIso();
    const product = await this.productRepository.save({
      id: createId('product'),
      productCode: parsedInput.productCode,
      productName: parsedInput.productName,
      unit: parsedInput.unit,
      status: parsedInput.status,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(product.id);
  }

  async update(id: string, input: unknown): Promise<ProductDto> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw notFound('PRODUCT_NOT_FOUND', 'Product not found', { id });
    }

    const parsedInput = this.parseCreateOrUpdateInput(input);
    const codeOwner = await this.productRepository.findByCode(parsedInput.productCode);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('PRODUCT_CODE_EXISTS', 'Product code already exists', {
        productCode: parsedInput.productCode,
      });
    }

    await this.productRepository.save({
      ...existing,
      productCode: parsedInput.productCode,
      productName: parsedInput.productName,
      unit: parsedInput.unit,
      status: parsedInput.status,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw notFound('PRODUCT_NOT_FOUND', 'Product not found', { id });
    }

    const linkedPurchaseOrder = (await this.purchaseOrderRepository.listAll()).find(
      (item) => item.productId === id,
    );
    if (linkedPurchaseOrder) {
      throw conflict(
        'PRODUCT_HAS_PURCHASE_ORDERS',
        'Product is referenced by at least one purchase order',
        { id, purchaseOrderId: linkedPurchaseOrder.id },
      );
    }

    const linkedGoodsReceipt = (await this.goodsReceiptRepository.listAll()).find(
      (item) => item.productId === id,
    );
    if (linkedGoodsReceipt) {
      throw conflict(
        'PRODUCT_HAS_GOODS_RECEIPTS',
        'Product is referenced by at least one goods receipt',
        { id, goodsReceiptId: linkedGoodsReceipt.id },
      );
    }

    await this.productRepository.delete(id);
  }

  private parseCreateOrUpdateInput(
    input: unknown,
  ): CreateProductInput | UpdateProductInput {
    const payload = asRecord(input);

    return {
      productCode: requiredString(readField(payload, 'productCode'), 'productCode').toUpperCase(),
      productName: requiredString(readField(payload, 'productName'), 'productName'),
      unit: requiredString(readField(payload, 'unit'), 'unit'),
      status: requiredEnum(readField(payload, 'status'), lifecycleStatuses, 'status'),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async toDto(id: string): Promise<ProductDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw notFound('PRODUCT_NOT_FOUND', 'Product not found', { id });
    }

    return mapProductToDto(product);
  }
}
