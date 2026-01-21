import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, leftIcon, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2 w-full">
                {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
                <div className="relative flex items-center">
                    {leftIcon && (
                        <div className="absolute left-3 text-gray-500 pointer-events-none">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full h-10 bg-[#1A1A1A] border border-gray-800 rounded-lg px-4 text-white placeholder-gray-600 transition-all",
                            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
                            leftIcon && "pl-10",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500/50",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
