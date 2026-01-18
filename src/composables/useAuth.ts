import {computed} from 'vue'
import {useAuthStore} from '@/stores/auth'

export function useAuth() {
    const store = useAuthStore()

    const user = computed(() => store.user)
    const token = computed(() => store.token)
    const isAuthenticated = computed(() => store.isAuthenticated)

    const login = (credentials: { email: string; password: string }) =>
        store.login(credentials)

    const register = (data: { name: string; email: string; password: string }) =>
        store.register(data)

    const logout = () => store.logout()

    return {
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
    }
}