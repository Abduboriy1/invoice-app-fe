<template>
    <div class="flex gap-4 p-4 h-full">
        <!-- Left Section (1 unit) -->
        <div class="flex-1 bg-white-200 p-4 rounded-lg">
            <slot name="left"></slot>
        </div>

        <!-- Center Section (3 units) -->
        <div class="flex-[3] bg-white-200 p-4 rounded-lg">
            <slot name="center"></slot>
        </div>

        <!-- Right Section (1 unit) -->
        <div class="flex-1 bg-white-200 p-4 rounded-lg">
            <slot name="right"></slot>
        </div>
    </div>
</template>

<script setup>
// Optional: Add props if you want to customize styling
</script>