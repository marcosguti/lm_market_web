export type OrderStatus =
  | 'pending'
  | 'paymentPendingConfirmation'
  | 'paymentConfirmed'
  | 'preparing'
  | 'readyForDelivery'
  | 'assignedToDeliveryDriver'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusHistoryUser {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  type: string;
}

export interface OrderStatusHistoryEntry {
  cancellationReason?: null | string;
  changedBy: OrderStatusHistoryUser;
  createdAt: string;
  deliveryProofUrl?: null | string;
  fromStatus: OrderStatus;
  id: string;
  toStatus: OrderStatus;
}

export type PaymentMethod = 'cash' | 'zelle' | 'mobilePayment' | 'binance';

export interface OrderLine {
  code: string;
  description: null | string;
  imageUrl?: null | string;
  lineTotal: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  createdAt: string;
  id: string;
  method: PaymentMethod;
  paidAt: string;
  reference: string;
  screenshotUrl: string | null;
  verifiedAt: string | null;
  verifiedAutomatically?: boolean;
  verifiedBy: string | null;
}

export interface OrderEntity {
  confirmationCode: null | string;
  createdAt: string;
  customerNotes: null | string;
  deliveryAddress: null | string;
  deliveryPhone: null | string;
  deliveryProofUrl: null | string;
  cancellationReason: null | string;
  deliveryUserId: null | string;
  deliveryUserName?: null | string;
  deliveryUserPhone?: null | string;
  id: string;
  idempotencyKey: null | string;
  paidAt: null | string;
  payment: Payment | null;
  paymentDate: null | string;
  paymentMethod: PaymentMethod | null;
  paymentReference: null | string;
  paymentScreenshotUrl: null | string;
  products: OrderLine[];
  status: OrderStatus;
  storeId: null | string;
  storeName?: null | string;
  totalAmount: number;
  totalAmountBs?: null | number;
  exchangeRate?: null | number;
  updatedAt: string;
  userId: string;
  userNumberId: string;
  version: number;
}

export interface InventoryChange {
  available: number;
  code: string;
  reason: 'missing' | 'out_of_stock' | 'quantity_adjusted';
  requested: number;
}
