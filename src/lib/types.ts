export type Role = "owner" | "manager" | "cashier";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
};

export type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  cost_price: number;
  sell_price: number;
  quantity: number;
  reorder_level: number;
  createdAt: number;
  updatedAt: number;
};

export type ProductInput = {
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  cost_price: number;
  sell_price: number;
  quantity: number;
  reorder_level: number;
};

export type SaleItem = {
  product_id: string;
  name: string;
  unit_price: number;
  unit_cost: number;
  quantity: number;
  line_total: number;
};

export type Sale = {
  id: string;
  cashierId: string | null;
  total: number;
  cost_total: number;
  profit: number;
  item_count: number;
  items: SaleItem[];
  createdAt: number;
};

export type CartItem = { product_id: string; quantity: number };
