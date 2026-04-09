interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  name,
  required = false,
  disabled = false,
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      disabled={disabled}
      className={`
        w-full bg-carbon border border-border rounded-none
        px-4 py-3 text-white font-body text-sm
        placeholder:text-muted
        focus:outline-none focus:border-ignition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  );
}
