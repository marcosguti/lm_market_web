export type OrderStatus =
  | 'pending'
  | 'paymentConfirmed'
  | 'preparing'
  | 'readyForDelivery'
  | 'outForDelivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'zelle' | 'mobilePayment' | 'binance';

export interface OrderLine {
  code: string;
  description: null | string;
  lineTotal: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  screenshotUrl: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
}

export interface OrderEntity {
  confirmationCode: null | string;
  createdAt: string;
  customerNotes: null | string;
  deliveryAddress: null | string;
  deliveryPhone: null | string;
  deliveryUserId: null | string;
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
  totalAmount: number;
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
