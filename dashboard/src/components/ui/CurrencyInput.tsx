import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CurrencyInput({ value, onChange, onBlur, placeholder, className = '', disabled = false }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize display value from numeric value
    if (value > 0) {
      const formatted = formatCurrency(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const formatCurrency = (num: number): string => {
    // Convert number to string with 2 decimal places
    const numStr = num.toFixed(2);
    // Split into integer and decimal parts
    const [intPart, decPart] = numStr.split('.');
    // Add thousand separators
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Return formatted string
    return `${formattedInt},${decPart}`;
  };

  const parseCurrency = (str: string): number => {
    // Remove all non-digit characters except comma and dot
    const cleaned = str.replace(/[^\d,.]/g, '');
    // Handle both comma and dot as decimal separator
    const normalized = cleaned.replace(',', '.');
    // Remove extra dots (keep only the last one as decimal separator)
    const parts = normalized.split('.');
    if (parts.length > 2) {
      const intPart = parts.slice(0, -1).join('');
      const decPart = parts[parts.length - 1];
      const finalValue = `${intPart}.${decPart}`;
      return parseFloat(finalValue) || 0;
    }
    // Parse to float
    const num = parseFloat(normalized) || 0;
    return num;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow user to type freely - don't format on every keystroke
    // Just store the raw input value
    setDisplayValue(inputValue);
    
    // Parse and update the numeric value
    const numValue = parseCurrency(inputValue);
    onChange(numValue);
  };

  const handleBlur = () => {
    // Format only on blur (when user leaves the field)
    const numValue = parseCurrency(displayValue);
    if (numValue > 0) {
      const formatted = formatCurrency(numValue);
      setDisplayValue(formatted);
      // Ensure the numeric value is updated
      onChange(numValue);
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
      onBlur={handleBlur}
      placeholder={placeholder || '0,00'}
      className={className}
      disabled={disabled}
      inputMode="decimal"
    />
  );
}
