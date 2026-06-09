import type { Brand } from '../config';

export type Role = 'retailer' | 'warehouse' | 'admin';
export type OrderStatus =
  | 'placed' | 'picking' | 'packed' | 'invoiced' | 'closed' | 'cancelled';

export interface Profile {
  id: string;
  distributor_id: string;
  role: Role;
  shop_name: string | null;
  contact_name: string | null;
  phone: string | null;
  gstin: string | null;
  city: string | null;
}

export interface Part {
  id: string;
  distributor_id: string;
  part_no: string;
  description: string;
  brand: Brand;
  mrp: number;
  moq: number;
  bin_location: string | null;
  active: boolean;
}

export interface Order {
  id: string;
  distributor_id: string;
  retailer_id: string;
  status: OrderStatus;
  invoice_no: string | null;
  total_value: number;
  placed_at: string;
  closed_at: string | null;
  note: string | null;
}

export interface BasketLine {
  part: Part;
  qty: number;
}
