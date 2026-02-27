export interface UserProfile {
    id: string
    email: string
    full_name: string
    company_name: string
    phone: string
    address: string
    created_at: string
    updated_at: string
}

export interface UserProfileUpdateRequest {
    full_name: string
    email: string
    company_name: string
    phone: string
    address: string
}
