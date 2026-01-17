import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/services/api/client'

interface User {
    id: string
    email: string
    name: string
}

interface LoginCredentials {
    email: string
    password: string
}

interface RegisterData extends LoginCredentials {
    name: string
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('auth_token'))
    const user = ref<User | null>(null)

    const isAuthenticated = computed(() => !!token.value)

    async function login(credentials: LoginCredentials) {
        const { data } = await apiClient.post('/auth/login', credentials)
        token.value = data.token
        user.value = data.user
        console.log(data.token, data.user)
        localStorage.setItem('auth_token', data.token)
    }

    async function register(data: RegisterData) {
        const response = await apiClient.post('/auth/register', data)
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('auth_token', response.data.token)
    }

    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('auth_token')
    }

    return {
        token,
        user,
        isAuthenticated,
        login,
        register,
        logout,
    }
})