import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Exchange rate: 1 USD = 16,000 IDR (approximate, can be updated as needed)
const USD_TO_IDR_RATE = 16000;

/**
 * Convert USD amount to Indonesian Rupiah (IDR)
 * @param usdAmount - Amount in USD
 * @returns Amount in IDR
 */
export function convertToIDR(usdAmount: number): number {
  return usdAmount * USD_TO_IDR_RATE;
}

/**
 * Format a USD amount as Indonesian Rupiah (IDR)
 * @param usdAmount - Amount in USD
 * @returns Formatted string in IDR (e.g., "Rp 160.000,00")
 */
export function formatIDR(usdAmount: number): string {
  const idrAmount = convertToIDR(usdAmount);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(idrAmount);
}

/**
 * Format a USD amount as Indonesian Rupiah (IDR) with decimal places
 * @param usdAmount - Amount in USD
 * @returns Formatted string in IDR with decimals (e.g., "Rp 160.000,50")
 */
export function formatIDRWithDecimals(usdAmount: number): string {
  const idrAmount = convertToIDR(usdAmount);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(idrAmount);
}
