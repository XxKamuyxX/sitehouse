import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Round currency value to 2 decimal places to prevent floating-point errors
 * @param value - The number to round
 * @returns The rounded value with exactly 2 decimal places
 */
export function roundCurrency(value: number): number {
  // Arredonda para 2 casas decimais com precisão
  return Number((Math.round(value * 100) / 100).toFixed(2));
}




