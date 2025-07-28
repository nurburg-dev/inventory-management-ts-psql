export interface Item {
  id?: number;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  category?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface TemporarilyBlockInventoryRequest {
  itemId: number;
  quantity: number;
}

export interface TemporarilyBlockInventoryResponse {
  blockId: number;
}

export interface PermanentlyBlockInventory {
  blockId: number;
}
