import {computed, ref} from 'vue'

export function usePagination(itemsPerPage: number = 10) {
    const currentPage = ref(1)
    const totalItems = ref(0)

    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

    const hasNext = computed(() => currentPage.value < totalPages.value)
    const hasPrev = computed(() => currentPage.value > 1)

    const offset = computed(() => (currentPage.value - 1) * itemsPerPage)

    function nextPage() {
        if (hasNext.value) {
            currentPage.value++
        }
    }

    function prevPage() {
        if (hasPrev.value) {
            currentPage.value--
        }
    }

    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page
        }
    }

    function reset() {
        currentPage.value = 1
    }

    function setTotalItems(total: number) {
        totalItems.value = total
    }

    return {
        currentPage,
        totalItems,
        totalPages,
        itemsPerPage,
        hasNext,
        hasPrev,
        offset,
        nextPage,
        prevPage,
        goToPage,
        reset,
        setTotalItems,
    }
}