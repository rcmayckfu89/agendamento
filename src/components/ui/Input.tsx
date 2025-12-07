import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    className = '',
    id,
    ...props
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-foreground mb-2"
                >
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={`w-full px-3 py-2 bg-background border ${error ? 'border-destructive' : 'border-border'
                    } rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
