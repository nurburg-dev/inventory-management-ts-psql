export interface BlockInventory {
  id?: number;
  item_id: number;
  quantity_blocked: number;
  reason: string;
  blocked_by?: string;
  blocked_at?: Date;
  expires_at?: Date;
  status: 'active' | 'expired' | 'released';
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateBlockRequest {
  item_id: number;
  quantity_blocked: number;
  reason: string;
  blocked_by?: string;
  expires_at?: Date;
}

export interface UpdateBlockRequest {
  quantity_blocked?: number;
  reason?: string;
  expires_at?: Date;
  status?: 'active' | 'expired' | 'released';
}

export interface ReleaseBlockRequest {
  reason?: string;
}