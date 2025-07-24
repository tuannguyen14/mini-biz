import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount || 0);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getStockStatusColor(stock: number): {
  bgColor: string;
  textColor: string;
  label: string;
  priority: number;
} {
  if (stock <= 50) {
    return {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      label: 'Sắp hết',
      priority: 3
    };
  } else if (stock <= 100) {
    return {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      label: 'Thấp',
      priority: 2
    };
  } else {
    return {
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      label: 'Bình thường',
      priority: 1
    };
  }
}

export const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'completed':
      return { text: 'Hoàn thành', className: 'bg-green-100 text-green-800 border-green-200' }
    case 'partial_paid':
      return { text: 'Trả một phần', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    case 'pending':
      return { text: 'Chờ thanh toán', className: 'bg-red-100 text-red-800 border-red-200' }
    default:
      return { text: 'Đã hủy', className: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}