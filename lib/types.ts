export type UserRole = 'admin' | 'funcionario'

export interface Profile {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  name: string
  abbreviation?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  category_id: string
  unit_id: string
  entry_date: string
  expiration_date?: string
  photo_url?: string
  low_stock_threshold: number
  current_quantity: number
  created_by: string
  created_at: string
  updated_at: string
  category?: Category
  unit?: Unit
}

export interface ProductPricing {
  id: string
  product_id: string
  cost_price: number
  sale_price: number
  created_at: string
  updated_at: string
}

export interface ProductWithPricing extends Product {
  pricing?: ProductPricing
}

export interface StockMovement {
  id: string
  product_id: string
  quantity_change: number
  movement_type: 'entrada' | 'saída'
  notes?: string
  recorded_by: string
  recorded_at: string
  created_at: string
  product?: Product
  recorded_by_profile?: Profile
}

export interface Revenue {
  faturamento_bruto: number
  faturamento_liquido: number
  total_quantidade_vendida: number
  total_custo_vendido: number
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}
