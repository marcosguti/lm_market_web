export type OrderStatus =
  | 'cancelada'
  | 'enReparto'
  | 'entregada'
  | 'listaParaReparto'
  | 'pagoConfirmado'
  | 'pendiente'
  | 'preparando';

export interface OrderLine {
  code: string;
  description: null | string;
  lineTotal: number;
  name: string;
  quantity: number;
  unitPrice: number;
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
