interface ChipSelectorOption {
  value: string;
  label: string;
}

interface ChipSelectorProps {
  options: string[] | ChipSelectorOption[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  label?: string;
  className?: string;
  multiple?: boolean;
}

export function ChipSelector({
  options,
  selected,
  onChange,
  label,
  className = '',
  multiple = false,
}: ChipSelectorProps) {

  // Normalize options to array of objects
  const normalizedOptions: ChipSelectorOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Handle multiple selection
  const selectedValues = multiple
    ? (Array.isArray(selected) ? selected : [])
    : [selected].filter(Boolean);

  const handleClick = (value: string) => {
    if (multiple) {
      const current = Array.isArray(selected) ? selected : [];
      const newSelection = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange(newSelection);
    } else {
      onChange(value);
    }
  };

  const isSelected = (value: string) => {
    if (multiple) {
      return selectedValues.includes(value);
    }
    return selected === value;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {normalizedOptions.map((option) => {
          const selected = isSelected(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              className={`
                min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  selected
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                    : 'text-slate-700 bg-white border-2 border-slate-300 hover:border-primary/30'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
