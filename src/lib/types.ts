export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
}

export interface OrderItem {
  productCode: string;
  quantity: number;
}

export interface CalculateRequest {
  items: OrderItem[];
  memberCardNumber?: string;
}

export interface ItemDiscount {
  productCode: string;
  productName: string;
  pairsCount: number;
  discountAmount: number;
}

export interface CalculateResponse {
  success: boolean;
  totalBeforeDiscount: number;
  itemDiscounts: ItemDiscount[];
  totalItemDiscount: number;
  memberDiscount: number;
  memberCardValid: boolean | null;
  finalTotal: number;
  error?: string;
}
