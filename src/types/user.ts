export interface User {
    id: string
    email: string
    name: string
    created_at?: string
    updated_at?: string
}

export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
}