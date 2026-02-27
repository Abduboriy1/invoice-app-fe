<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { timeEntryService } from '@/services/api/timeEntry.service'
import type { TimeEntry } from '@/types/timeEntry'

const emit = defineEmits<{ (e: 'total-hours', value: number): void }>()

const chartEntries = ref<TimeEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const chartType = ref<'bar' | 'area'>('bar')

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const minYear = 2020

async function fetchYearlyEntries() {
    loading.value = true
    error.value = null
    try {
        chartEntries.value = await timeEntryService.list({
            start_date: `${selectedYear.value}-01-01`,
            end_date: `${selectedYear.value}-12-31`,
            limit: 1000,
        })
    } catch (e: any) {
        error.value = e?.response?.data?.message || 'Failed to load chart data'
    } finally {
        loading.value = false
    }
}

watch(selectedYear, fetchYearlyEntries)

const monthlyHours = computed<number[]>(() => {
    const buckets = new Array(12).fill(0)
    for (const entry of chartEntries.value) {
        const monthIndex = parseInt(entry.date.substring(5, 7), 10) - 1
        if (monthIndex >= 0 && monthIndex < 12) {
            buckets[monthIndex] += entry.hours
        }
    }
    return buckets.map(h => Math.round(h * 100) / 100)
})

const totalYearHours = computed(() => monthlyHours.value.reduce((a, b) => a + b, 0))

watch(totalYearHours, (val) => emit('total-hours', val), { immediate: true })

const series = computed(() => [{ name: 'Hours', data: monthlyHours.value }])

function formatHours(val: number): string {
    const hours = Math.floor(val)
    const minutes = Math.round((val - hours) * 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

const chartOptions = computed(() => {
    const isArea = chartType.value === 'area'
    return {
        chart: {
            type: chartType.value,
            toolbar: { show: false },
            animations: {
                enabled: true,
                speed: 600,
                easing: 'easeinout',
            },
        },
        colors: ['#3b82f6'],
        fill: isArea
            ? {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.45,
                    opacityTo: 0.05,
                    stops: [0, 100],
                    colorStops: [
                        { offset: 0, color: '#3b82f6', opacity: 0.45 },
                        { offset: 100, color: '#93c5fd', opacity: 0.05 },
                    ],
                },
            }
            : { type: 'solid' },
        stroke: isArea
            ? { curve: 'smooth', width: 2.5 }
            : { show: false },
        markers: isArea ? { size: 4 } : { size: 0 },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '55%',
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#6b7280', fontSize: '12px' } },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => `${Math.floor(val)}h`,
                style: { colors: '#6b7280', fontSize: '12px' },
            },
        },
        grid: {
            borderColor: '#f3f4f6',
            strokeDashArray: 4,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
        },
        tooltip: {
            y: { formatter: formatHours },
        },
    }
})

onMounted(fetchYearlyEntries)
</script>

<template>
    <div class="bg-white shadow rounded-lg p-6">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
            <div>
                <div class="flex items-center gap-2">
                    <h2 class="text-base font-semibold text-gray-900">Hours Tracked</h2>
                    <!-- Year navigator -->
                    <div class="flex items-center gap-1">
                        <button
                            :disabled="selectedYear <= minYear"
                            class="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            @click="selectedYear--"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                            </svg>
                        </button>
                        <span class="text-sm font-semibold text-gray-700 w-10 text-center select-none">{{ selectedYear }}</span>
                        <button
                            :disabled="selectedYear >= currentYear"
                            class="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            @click="selectedYear++"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="mt-0.5 text-sm text-gray-500">
                    Total: <span class="font-medium text-gray-700">{{ formatHours(totalYearHours) }}</span>
                </p>
            </div>
            <!-- Toggle -->
            <div class="flex items-center bg-gray-100 p-1 rounded-full gap-0.5">
                <button
                    :class="chartType === 'bar'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'"
                    class="px-3 py-1 text-xs font-medium rounded-full transition-all duration-200"
                    @click="chartType = 'bar'"
                >
                    Bar
                </button>
                <button
                    :class="chartType === 'area'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'"
                    class="px-3 py-1 text-xs font-medium rounded-full transition-all duration-200"
                    @click="chartType = 'area'"
                >
                    Line
                </button>
            </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="animate-pulse h-[280px] flex items-end gap-2 px-2">
            <div
                v-for="i in 12"
                :key="i"
                :style="{ height: `${20 + Math.abs(Math.sin(i * 1.3)) * 70}%` }"
                class="flex-1 bg-gray-200 rounded-t-sm"
            />
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="h-[280px] flex flex-col items-center justify-center bg-red-50 rounded-lg">
            <p class="text-sm text-red-700 mb-3">{{ error }}</p>
            <button
                class="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                @click="fetchYearlyEntries"
            >
                Retry
            </button>
        </div>

        <!-- Chart -->
        <VueApexCharts
            v-else
            :key="chartType"
            :options="chartOptions"
            :series="series"
            :type="chartType"
            height="280"
        />
    </div>
</template>
