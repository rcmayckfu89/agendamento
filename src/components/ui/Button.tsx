import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-soft',
        secondary: 'bg-card text-secondary-foreground hover:bg-secondary border border-border shadow-soft',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-soft',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground'
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5',
        lg: 'px-6 py-3 text-lg'
    };

    const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
        <button
            className={styles}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
                icon && iconPosition === 'left' && (
                    <span className="material-symbols-outlined">{icon}</span>
                )
            )}
            {children}
            {!loading && icon && iconPosition === 'right' && (
                <span className="material-symbols-outlined">{icon}</span>
            )}
        </button>
    );
};
