import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useClickOutside } from '../../hooks/useClickOutside';

interface DropdownMenuProps {
    children: ReactNode;
}

interface DropdownMenuTriggerProps {
    children: ReactNode;
    asChild?: boolean;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

interface DropdownMenuContentProps {
    children: ReactNode;
    className?: string;
    align?: 'start' | 'end' | 'center';
    width?: string | number;
}

interface DropdownMenuItemProps {
    children: ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    destructive?: boolean;
    icon?: ReactNode;
}

// Context to share state
const DropdownContext = React.createContext<{
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const toggle = () => setIsOpen((prev) => !prev);
    const close = () => setIsOpen(false);

    useClickOutside(contentRef, close, triggerRef);

    // Handle scroll to update position or close
    useEffect(() => {
        if (isOpen) {
            const handleScroll = () => close(); // Simple behavior: close on scroll to avoid complex positioning updates
            window.addEventListener('scroll', handleScroll, { capture: true });
            return () => window.removeEventListener('scroll', handleScroll, { capture: true });
        }
    }, [isOpen]);

    return (
        <DropdownContext.Provider value={{ isOpen, toggle, close, triggerRef, contentRef }}>
            <div className="relative inline-block text-left">
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild, className, onClick }) => {
    const context = React.useContext(DropdownContext);
    if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

    // Simple child cloning if asChild is true
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as any, {
            ref: context.triggerRef,
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation(); // Standard behavior
                context.toggle();
                onClick?.(e);
                (children as any).props.onClick?.(e);
            },
            className: cn(className, (children as any).props.className)
        });
    }

    return (
        <div
            ref={context.triggerRef as React.RefObject<HTMLDivElement>}
            onClick={(e) => {
                e.stopPropagation();
                context.toggle();
                onClick?.(e);
            }}
            className={cn("cursor-pointer", className)}
        >
            {children}
        </div>
    );
};


export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ children, className, align = 'end', width = 200 }) => {
    const context = React.useContext(DropdownContext);
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    React.useEffect(() => {
        if (context.isOpen && context.triggerRef.current) {
            const triggerRect = context.triggerRef.current.getBoundingClientRect();
            // Calculate absolute position
            // We want it to be below the trigger
            let top = triggerRect.bottom + 8 + window.scrollY;
            let left = triggerRect.left + window.scrollX;

            if (align === 'end') {
                left = triggerRect.right + window.scrollX - (typeof width === 'number' ? width : 200);
            } else if (align === 'center') {
                left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - ((typeof width === 'number' ? width : 200) / 2);
            }

            // Naive boundary check (optional, keep simple for now)
            setPosition({ top, left });
        }
    }, [context.isOpen, align, width]);

    if (!context.isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {context.isOpen && position && (
                <motion.div
                    ref={context.contentRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{
                        position: 'absolute',
                        top: position.top,
                        left: position.left,
                        width: width,
                        zIndex: 9999
                    }}
                    className={cn(
                        "rounded-xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden p-1 ring-1 ring-white/5",
                        className
                    )}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick, className, destructive, icon }) => {
    const context = React.useContext(DropdownContext);

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
                context?.close();
            }}
            className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                "hover:bg-white/5 focus:bg-white/5 focus:outline-none",
                destructive
                    ? "text-red-500 hover:text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                    : "text-text-main hover:text-white",
                className
            )}
        >
            {icon && <span className="mr-2 h-4 w-4 opacity-70">{icon}</span>}
            {children}
        </button>
    );
};
