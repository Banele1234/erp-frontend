import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ variant = 'default', size = 'md', className = '', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800',
    outline: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4\" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export function Table({ className = '', children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-slate-50 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props}>{children}</tbody>;
}

export function TableRow({ className = '', children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  header?: boolean;
}

export function TableCell({ header = false, className = '', children, ...props }: TableCellProps) {
  const Tag = header ? 'th' : 'td';
  const baseClass = header ? 'px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider' : 'px-4 py-3 text-sm text-slate-700';
  return (
    <Tag className={`${baseClass} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

interface InputProps extends Omit<HTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helpText?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  min?: number;
  step?: string;
  required?: boolean;
  placeholder?: string;
}

export function Input({ label, error, helpText, className = '', id, value, onChange, type, min, step, required, placeholder, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        step={step}
        required={required}
        placeholder={placeholder}
        className={`block w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && !error && <p className="text-sm text-slate-500">{helpText}</p>}
    </div>
  );
}

interface SelectProps extends Omit<HTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}

export function Select({ label, error, options, placeholder, className = '', id, value, onChange, required, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} transform transition-all`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg?: string;
}

export function StatCard({ title, value, change, icon, iconBg = 'bg-blue-100' }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-slate-400\" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="mt-4 text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${sizes[size]} border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
}
