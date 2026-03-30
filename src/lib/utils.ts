import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs <= 0) return 'Ended'

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    const remainingHours = diffHours % 24
    return remainingHours > 0
      ? `${diffDays}d ${remainingHours}h left`
      : `${diffDays}d left`
  }
  if (diffHours > 0) {
    const remainingMins = diffMins % 60
    return remainingMins > 0
      ? `${diffHours}h ${remainingMins}m left`
      : `${diffHours}h left`
  }
  return `${diffMins}m left`
}

export function isPodExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date()
}

export function formatMessageTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMessageDate(createdAt: string): string {
  const date = new Date(createdAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return formatMessageTime(createdAt)
  if (diffDays === 1) return `Yesterday ${formatMessageTime(createdAt)}`
  return (
    date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    formatMessageTime(createdAt)
  )
}
