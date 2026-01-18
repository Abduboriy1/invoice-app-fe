import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/auth/LoginView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => LoginView,
            meta: { requiresGuest: true },
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/auth/RegisterView.vue'),
            meta: { requiresGuest: true },
        },
        {
            path: '/',
            component: () => import('@/layouts/AuthLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/dashboard/DashboardView.vue'),
                },
                {
                    path: 'invoices',
                    name: 'invoices',
                    component: () => import('@/views/invoices/InvoiceListView.vue'),
                },
                {
                    path: 'invoices/create',
                    name: 'invoice-create',
                    component: () => import('@/views/invoices/InvoiceCreateView.vue'),
                },
                {
                    path: 'invoices/:id',
                    name: 'invoice-detail',
                    component: () => import('@/views/invoices/InvoiceDetailView.vue'),
                },
                {
                    path: 'invoices/:id/edit',
                    name: 'invoice-edit',
                    component: () => import('@/views/invoices/InvoiceEditView.vue'),
                },
                {
                    path: 'time-tracking',
                    name: 'time-tracking',
                    component: () => import('@/views/time/TimeTrackingView.vue'),
                },
                {
                    path: 'time-entries',
                    name: 'time-entries',
                    component: () => import('@/views/time/TimeEntryView.vue'),
                },
            ],
        },
    ],
})

// Navigation guards
router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' })
    } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
        next({ name: 'dashboard' })
    } else {
        next()
    }
})

export default router