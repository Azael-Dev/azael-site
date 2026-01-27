<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useStatusAlert, type StatusIssue, type ParsedStatusInfo } from '../composables/useStatusAlert'

const {
    issues,
    isLoading,
    parseIssueBody,
    isUpcoming,
    isActiveSchedule,
    getAlertType,
    formatDate,
    dismissAlert,
    isAlertDismissed,
    getActiveIssue,
    getAffectedServicesFromLabels
} = useStatusAlert()

const isVisible = ref(false)
const isExpanded = ref(false)

// Get the first active (non-dismissed) issue
const activeIssue = computed<StatusIssue | null>(() => getActiveIssue())

// Parse the issue body for metadata
const parsedInfo = computed<ParsedStatusInfo | null>(() => {
    if (!activeIssue.value) return null
    return parseIssueBody(activeIssue.value.body || '')
})

// Determine alert type based on labels
const alertType = computed(() => {
    if (!activeIssue.value) return 'info'
    return getAlertType(activeIssue.value.labels)
})

// Check if maintenance is upcoming (before start time)
const isMaintenanceUpcoming = computed(() => {
    if (!parsedInfo.value || alertType.value !== 'maintenance') return false
    return isUpcoming(parsedInfo.value)
})

// Get alert styling based on type and timing
const alertStyles = computed(() => {
    // Maintenance - upcoming (blue) vs active (amber)
    if (alertType.value === 'maintenance') {
        if (isMaintenanceUpcoming.value) {
            // Upcoming maintenance - use blue/primary color
            return {
                bgColor: 'bg-primary-500/10',
                borderColor: 'border-primary-500/40',
                textColor: 'text-primary-400',
                iconColor: 'text-primary-400',
                icon: 'fas fa-calendar-alt',
                glowColor: 'shadow-primary-500/20',
                badgeBg: 'bg-primary-500/20'
            }
        } else {
            // Active maintenance - use amber color
            return {
                bgColor: 'bg-amber-500/10',
                borderColor: 'border-amber-500/40',
                textColor: 'text-amber-400',
                iconColor: 'text-amber-400',
                icon: 'fas fa-wrench',
                glowColor: 'shadow-amber-500/20',
                badgeBg: 'bg-amber-500/20'
            }
        }
    }

    // Status issue - red
    if (alertType.value === 'status') {
        return {
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/40',
            textColor: 'text-red-400',
            iconColor: 'text-red-400',
            icon: 'fas fa-exclamation-triangle',
            glowColor: 'shadow-red-500/20',
            badgeBg: 'bg-red-500/20'
        }
    }

    // Default info - blue/primary
    return {
        bgColor: 'bg-primary-500/10',
        borderColor: 'border-primary-500/40',
        textColor: 'text-primary-400',
        iconColor: 'text-primary-400',
        icon: 'fas fa-info-circle',
        glowColor: 'shadow-primary-500/20',
        badgeBg: 'bg-primary-500/20'
    }
})

// Status text
const statusText = computed(() => {
    if (!parsedInfo.value) return ''

    if (alertType.value === 'maintenance') {
        if (isMaintenanceUpcoming.value) {
            return 'กำหนดการบำรุงรักษา'
        }
        return 'กำลังปรับปรุงระบบ'
    }

    if (alertType.value === 'status') {
        return 'แจ้งเตือนปัญหา'
    }

    return 'แจ้งเตือน'
})

// Get all affected services for status type (from labels)
const statusAffectedServices = computed(() => {
    if (alertType.value !== 'status' || !activeIssue.value) return []
    return getAffectedServicesFromLabels(activeIssue.value.labels)
})

// Combined services (down + degraded) for display
const hasAffectedServices = computed(() => {
    return (parsedInfo.value?.expectedDown?.length || 0) > 0 ||
        (parsedInfo.value?.expectedDegraded?.length || 0) > 0 ||
        statusAffectedServices.value.length > 0
})

// Handle dismiss
const handleDismiss = () => {
    if (activeIssue.value) {
        isVisible.value = false
        setTimeout(() => {
            dismissAlert(activeIssue.value!.id)
        }, 300)
    }
}

// Toggle expanded state
const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
}

// Show alert with animation after mount
onMounted(() => {
    setTimeout(() => {
        if (activeIssue.value && !isAlertDismissed(activeIssue.value.id)) {
            isVisible.value = true
        }
    }, 500)
})

// Watch for issues loaded
const checkAndShowAlert = () => {
    if (activeIssue.value && !isAlertDismissed(activeIssue.value.id)) {
        setTimeout(() => {
            isVisible.value = true
        }, 500)
    }
}

// Re-check when issues change
watch(issues, checkAndShowAlert)
</script>

<template>
    <!-- Status Alert Banner -->
    <Transition name="alert-slide">
        <div v-if="activeIssue && isVisible && !isLoading"
            class="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div :class="[
                'rounded-2xl border backdrop-blur-xl transition-all duration-300',
                alertStyles.bgColor,
                alertStyles.borderColor,
                isExpanded ? 'shadow-2xl' : 'shadow-xl'
            ]" :style="{ boxShadow: `0 8px 32px -4px ${alertType === 'status' ? 'rgba(239, 68, 68, 0.15)' : alertType === 'maintenance' && !isMaintenanceUpcoming ? 'rgba(245, 158, 11, 0.15)' : 'rgba(20, 184, 166, 0.15)'}` }">
                <!-- Main Alert Header -->
                <div class="p-4">
                    <div class="flex items-start gap-4">
                        <!-- Icon with glow effect -->
                        <div class="relative flex-shrink-0">
                            <div :class="[
                                'w-11 h-11 rounded-xl flex items-center justify-center',
                                alertStyles.badgeBg
                            ]">
                                <i :class="[alertStyles.icon, alertStyles.iconColor, 'text-lg']"></i>
                            </div>
                            <!-- Pulse indicator -->
                            <span v-if="!isMaintenanceUpcoming" :class="[
                                'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                                alertType === 'status' ? 'bg-red-500' : 'bg-amber-500'
                            ]">
                                <span :class="[
                                    'absolute inset-0 rounded-full animate-ping',
                                    alertType === 'status' ? 'bg-red-400' : 'bg-amber-400'
                                ]"></span>
                            </span>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Status Badge & Title -->
                            <div class="flex items-center gap-2 flex-wrap mb-1">
                                <span :class="[
                                    'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide uppercase',
                                    alertStyles.badgeBg,
                                    alertStyles.textColor
                                ]">
                                    <i :class="[alertStyles.icon, 'mr-1.5 text-[10px]']"></i>
                                    {{ statusText }}
                                </span>
                            </div>

                            <!-- Title -->
                            <h3 class="text-white font-medium text-sm leading-snug mb-2">
                                {{ activeIssue.title }}
                            </h3>

                            <!-- Time Range (if available) -->
                            <div v-if="parsedInfo?.start || parsedInfo?.end"
                                class="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                <i class="fas fa-clock text-gray-500"></i>
                                <span v-if="parsedInfo.start" class="font-medium">{{ formatDate(parsedInfo.start) }}</span>
                                <span v-if="parsedInfo.start && parsedInfo.end" class="text-gray-600">→</span>
                                <span v-if="parsedInfo.end" class="font-medium">{{ formatDate(parsedInfo.end) }}</span>
                            </div>

                            <!-- Affected Services Preview (collapsed view) -->
                            <div v-if="hasAffectedServices && !isExpanded" class="flex flex-wrap gap-1.5">
                                <!-- Status type: show services from labels -->
                                <template v-if="alertType === 'status'">
                                    <span v-for="service in statusAffectedServices.slice(0, 4)" :key="service"
                                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-red-500/10 text-red-300 border border-red-500/20">
                                        <i class="fas fa-times-circle mr-1 text-[9px] text-red-400"></i>
                                        {{ service }}
                                    </span>
                                    <span v-if="statusAffectedServices.length > 4"
                                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-dark-300/50 text-gray-400">
                                        +{{ statusAffectedServices.length - 4 }} อื่นๆ
                                    </span>
                                </template>

                                <!-- Maintenance type: show down/degraded services -->
                                <template v-else>
                                    <!-- Down services (red) -->
                                    <span v-for="service in (parsedInfo?.expectedDown || []).slice(0, 2)" :key="'down-' + service"
                                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-red-500/10 text-red-300 border border-red-500/20">
                                        <i class="fas fa-times-circle mr-1 text-[9px] text-red-400"></i>
                                        {{ service }}
                                    </span>
                                    <!-- Degraded services (amber/primary based on timing) -->
                                    <span v-for="service in (parsedInfo?.expectedDegraded || []).slice(0, 2)" :key="'degraded-' + service"
                                        :class="[
                                            'inline-flex items-center px-2 py-0.5 rounded-md text-xs border',
                                            isMaintenanceUpcoming
                                                ? 'bg-primary-500/10 text-primary-300 border-primary-500/20'
                                                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                        ]">
                                        <i :class="[
                                            'fas fa-exclamation-circle mr-1 text-[9px]',
                                            isMaintenanceUpcoming ? 'text-primary-400' : 'text-amber-400'
                                        ]"></i>
                                        {{ service }}
                                    </span>
                                    <!-- More indicator -->
                                    <span v-if="((parsedInfo?.expectedDown?.length || 0) + (parsedInfo?.expectedDegraded?.length || 0)) > 4"
                                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-dark-300/50 text-gray-400">
                                        +{{ ((parsedInfo?.expectedDown?.length || 0) + (parsedInfo?.expectedDegraded?.length || 0)) - 4 }} อื่นๆ
                                    </span>
                                </template>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex-shrink-0 flex items-center gap-1">
                            <!-- Expand/Collapse Button -->
                            <button @click="toggleExpanded"
                                class="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white cursor-pointer"
                                :title="isExpanded ? 'ย่อ' : 'ขยาย'">
                                <i :class="['fas text-sm transition-transform duration-200', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                            </button>

                            <!-- Dismiss Button -->
                            <button @click="handleDismiss"
                                class="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white cursor-pointer"
                                title="ปิด">
                                <i class="fas fa-times text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Expanded Content -->
                <Transition name="expand">
                    <div v-if="isExpanded" class="px-4 pb-4">
                        <div class="pt-4 border-t border-white/10">
                            <!-- All Affected Services -->
                            <div v-if="hasAffectedServices" class="mb-4">
                                <h4 class="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                    บริการที่ได้รับผลกระทบ
                                </h4>

                                <!-- Status type: show all services from labels -->
                                <template v-if="alertType === 'status'">
                                    <div class="flex flex-wrap gap-2">
                                        <span v-for="service in statusAffectedServices" :key="service"
                                            class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-300 border border-red-500/20">
                                            <i class="fas fa-times-circle mr-1.5 text-red-400"></i>
                                            {{ service }}
                                        </span>
                                    </div>
                                </template>

                                <!-- Maintenance type: show down and degraded separately -->
                                <template v-else>
                                    <!-- Down services -->
                                    <div v-if="parsedInfo?.expectedDown?.length" class="mb-3">
                                        <p class="text-xs text-red-400 mb-2 flex items-center">
                                            <i class="fas fa-times-circle mr-1.5"></i>
                                            ไม่สามารถใช้งานได้ชั่วคราว
                                        </p>
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="service in parsedInfo.expectedDown" :key="'down-' + service"
                                                class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-300 border border-red-500/20">
                                                <i class="fas fa-server mr-1.5 text-[10px]"></i>
                                                {{ service }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Degraded services -->
                                    <div v-if="parsedInfo?.expectedDegraded?.length">
                                        <p :class="[
                                            'text-xs mb-2 flex items-center',
                                            isMaintenanceUpcoming ? 'text-primary-400' : 'text-amber-400'
                                        ]">
                                            <i class="fas fa-exclamation-circle mr-1.5"></i>
                                            อาจได้รับผลกระทบ
                                        </p>
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="service in parsedInfo.expectedDegraded" :key="'degraded-' + service"
                                                :class="[
                                                    'inline-flex items-center px-3 py-1.5 rounded-lg text-xs border',
                                                    isMaintenanceUpcoming
                                                        ? 'bg-primary-500/10 text-primary-300 border-primary-500/20'
                                                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                                ]">
                                                <i class="fas fa-server mr-1.5 text-[10px]"></i>
                                                {{ service }}
                                            </span>
                                        </div>
                                    </div>
                                </template>
                            </div>

                            <!-- Description Preview -->
                            <div v-if="parsedInfo?.description" class="mb-4">
                                <h4 class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">รายละเอียด</h4>
                                <p class="text-sm text-gray-300 leading-relaxed line-clamp-3">
                                    {{ parsedInfo.description.replace(/[#*`]/g, '').substring(0, 250) }}...
                                </p>
                            </div>

                            <!-- View More Link -->
                            <a :href="activeIssue.html_url" target="_blank" rel="noopener noreferrer" :class="[
                                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                alertStyles.badgeBg,
                                alertStyles.textColor,
                                'hover:brightness-125 hover:scale-[1.02]'
                            ]">
                                <span>ดูรายละเอียดเพิ่มเติม</span>
                                <i class="fas fa-external-link-alt text-xs"></i>
                            </a>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </Transition>

    <!-- Loading Skeleton -->
    <Transition name="fade">
        <div v-if="isLoading" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div class="rounded-2xl border border-dark-300/30 bg-dark-200/80 backdrop-blur-xl p-4 animate-pulse">
                <div class="flex items-start gap-4">
                    <div class="w-11 h-11 rounded-xl bg-dark-400/50"></div>
                    <div class="flex-1">
                        <div class="h-5 bg-dark-400/50 rounded-lg w-32 mb-2"></div>
                        <div class="h-4 bg-dark-400/50 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-dark-400/50 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/* Alert slide animation - from top */
.alert-slide-enter-active,
.alert-slide-leave-active {
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.alert-slide-enter-from {
    opacity: 0;
    transform: translate(-50%, -100%);
}

.alert-slide-leave-to {
    opacity: 0;
    transform: translate(-50%, -100%);
}

/* Expand animation */
.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    opacity: 0;
    max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
    opacity: 1;
    max-height: 400px;
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Line clamp utility */
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
