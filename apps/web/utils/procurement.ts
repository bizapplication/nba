import type { LifecycleStatus, SelectOption } from '~/types/finance'
import type {
  GoodsReceiptStatus,
  PaymentStatus,
  ProductStatus,
  PurchaseOrderStatus,
  VendorInvoiceStatus,
  VendorStatus
} from '~/types/procurement'
import { lifecycleStatusOptions } from '~/utils/finance'

export const productStatusOptions: SelectOption<ProductStatus>[] = lifecycleStatusOptions
export const vendorStatusOptions: SelectOption<VendorStatus>[] = lifecycleStatusOptions

export const purchaseOrderStatusOptions: SelectOption<PurchaseOrderStatus>[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已下单', value: 'ORDERED' },
  { label: '已取消', value: 'CANCELLED' }
]

export const goodsReceiptStatusOptions: SelectOption<GoodsReceiptStatus>[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已收货', value: 'RECEIVED' },
  { label: '已取消', value: 'CANCELLED' }
]

export const vendorInvoiceStatusOptions: SelectOption<VendorInvoiceStatus>[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已执行', value: 'EXECUTED' },
  { label: '已取消', value: 'CANCELLED' }
]

export const paymentStatusOptions: SelectOption<PaymentStatus>[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已执行', value: 'EXECUTED' },
  { label: '已取消', value: 'CANCELLED' }
]

export function procurementStatusColor(
  status:
    | VendorStatus
    | ProductStatus
    | LifecycleStatus
    | PurchaseOrderStatus
    | GoodsReceiptStatus
    | VendorInvoiceStatus
    | PaymentStatus
) {
  if (
    status === 'active' ||
    status === 'ORDERED' ||
    status === 'RECEIVED' ||
    status === 'EXECUTED'
  ) {
    return 'success'
  }

  if (status === 'DRAFT') {
    return 'warning'
  }

  if (status === 'CANCELLED') {
    return 'error'
  }

  return 'neutral'
}
