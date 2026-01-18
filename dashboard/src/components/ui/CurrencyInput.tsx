import { useState, useEffect, useRef } from 'react';
import { roundCurrency } from '../../lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * CurrencyInput with ATM-style behavior
 * Typing digits shifts them into cents (e.g., typing "5" -> 0.05, "50" -> 0.50, "500" -> 5.00)
 */
export function CurrencyInput({ value, onChange, onBlur, placeholder, className = '', disabled = false }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only update display value if not focused (to prevent cursor jumping)
    if (!isFocused) {
      if (value > 0) {
        const formatted = formatCurrency(value);
        setDisplayValue(formatted);
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused]);

  /**
   * Format number as BRL currency (R$ 1.234,56)
   */
  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  /**
   * Parse input string to number
   * Logic: If contains comma/dot, treat as decimal. Otherwise, treat as integer value.
   * Example: "300" -> 300.00, "300,50" -> 300.50, "300.50" -> 300.50
   */
  const parseATMInput = (str: string): number => {
    // Remove currency symbols and spaces, but keep comma and dot
    let cleaned = str.replace(/[R$\s]/g, '').trim();
    
    if (cleaned === '' || cleaned === ',') {
      return 0;
    }
    
    // Check if contains comma or dot (decimal separator)
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    
    if (hasComma || hasDot) {
      // Has decimal separator - parse as decimal number
      // Replace comma with dot for parsing
      const normalized = cleaned.replace(',', '.');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : roundCurrency(parsed);
    } else {
      // No decimal separator - treat as integer (reais)
      const digitsOnly = cleaned.replace(/\D/g, '');
      if (digitsOnly === '') {
        return 0;
      }
      const integer = parseInt(digitsOnly, 10);
      return isNaN(integer) ? 0 : roundCurrency(integer);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Store raw input value while typing
    setDisplayValue(inputValue);
    
    // Parse using ATM logic (digits as cents)
    const numValue = parseATMInput(inputValue);
    
    // Update the numeric value (rounded)
    onChange(numValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // When focused, show raw number (no formatting) for easier editing
    if (value > 0) {
      // Round first to avoid floating point errors (1500 becoming 1499.98)
      const roundedValue = roundCurrency(value);
      // Show as number with 2 decimal places (comma as separator)
      const formatted = roundedValue.toFixed(2).replace('.', ',');
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
    // Keep cursor at end
    setTimeout(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format on blur
    const numValue = parseATMInput(displayValue);
    const roundedValue = roundCurrency(numValue);
    
    if (roundedValue > 0) {
      const formatted = formatCurrency(roundedValue);
      setDisplayValue(formatted);
      onChange(roundedValue);
    } else {
      setDisplayValue('');
      onChange(0);
    }
    
    // Call custom onBlur if provided
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder || 'R$ 0,00'}
      className={className}
      disabled={disabled}
      inputMode="numeric"
    />
  );
}
