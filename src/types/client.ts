export interface Client {
  id: string
  name: string
  email?: string
  company_name?: string
  address?: string
  phone?: string
  hourly_rate?: number
  created_at?: string
  updated_at?: string
}

export interface ClientCreateRequest {
  name: string
  email?: string
  company_name?: string
  address?: string
  phone?: string
  hourly_rate?: number
}
