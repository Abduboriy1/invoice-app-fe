import { apiClient } from './client'
import type { UserProfile, UserProfileUpdateRequest } from '@/types/user'

export const userService = {
    async getProfile(): Promise<UserProfile> {
        const { data } = await apiClient.get('/users/me')
        return data
    },

    async updateProfile(profile: UserProfileUpdateRequest): Promise<UserProfile> {
        const { data } = await apiClient.put('/users/me', profile)
        return data
    },
}
