import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/services/api/client'
import { userService } from '@/services/api/user.service'
import type { UserProfile } from '@/types/user'

interface LoginCredentials {
    email: string
    password: string
}

interface RegisterData extends LoginCredentials {
    name: string
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('auth_token'))
    const user = ref<UserProfile | null>(null)

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

    async function fetchProfile() {
        try {
            user.value = await userService.getProfile()
        } catch (e) {
            // If profile fetch fails, don't break the app
        }
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
        fetchProfile,
        logout,
    }
})
