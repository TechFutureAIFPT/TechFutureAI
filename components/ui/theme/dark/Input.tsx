/**
 * Dark Input — Component cho Dark Mode
 * Màu sắc đồng bộ từ tokens.ts (bgPrimary: #0B1120, primary: #60a5fa)
 */
import React, { forwardRef } from 'react';

interface DarkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const DarkInput = forwardRef<HTMLInputElement, DarkInputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `dark-input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            bg-[#0B1120] border rounded-xl px-4 py-2.5 text-sm
            text-slate-200 placeholder-slate-500
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
            /* rgba(96,165,250,0.3) = tokens.dark.borderFocus / tokens.dark.primaryMuted */
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-slate-700/60'}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <i className="fa-solid fa-circle-exclamation text-[10px]" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});

DarkInput.displayName = 'DarkInput';

/* ======== Dark Textarea ======== */
interface DarkTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const DarkTextarea = forwardRef<HTMLTextAreaElement, DarkTextareaProps>(({
  label,
  error,
  hint,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || `dark-textarea-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        className={`
          bg-[#0B1120] border rounded-xl px-4 py-3 text-sm
          text-slate-200 placeholder-slate-500
          transition-all duration-200 resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
          ${error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-slate-700/60'}
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <i className="fa-solid fa-circle-exclamation text-[10px]" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});

DarkTextarea.displayName = 'DarkTextarea';

/* ======== Dark Select ======== */
interface DarkSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  fullWidth?: boolean;
}

export const DarkSelect = forwardRef<HTMLSelectElement, DarkSelectProps>(({
  label,
  error,
  options,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `dark-select-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        className={`
          bg-[#0B1120] border rounded-xl px-4 py-2.5 text-sm
          text-slate-200
          transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
          ${error ? 'border-red-500/50' : 'border-slate-700/60'}
          ${className}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <i className="fa-solid fa-circle-exclamation text-[10px]" />
          {error}
        </p>
      )}
    </div>
  );
});

DarkSelect.displayName = 'DarkSelect';
