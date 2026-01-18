import {apiClient} from './client'

interface LoginCredentials {
    email: string
    password: string
}

interface RegisterData extends LoginCredentials {
    name: string
}

interface AuthResponse {
    token: string
    user: {
        id: string
        email: string
        name: string
    }
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const {data} = await apiClient.post('/auth/login', credentials)
        return data
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        const {data: response} = await apiClient.post('/auth/register', data)
        return response
    },
}