import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export function Select({ label, value, onChange, options, placeholder = "Select...", className }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("flex flex-col gap-2 relative", className)} ref={containerRef}>
            {label && <label className="text-sm font-medium text-gray-400">{label}</label>}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full h-10 px-4",
                    "bg-[#1A1A1A] border border-gray-800 rounded-lg text-left",
                    "text-white transition-all duration-200",
                    "hover:border-gray-700 hover:bg-[#252525]",
                    "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
                    isOpen && "border-primary ring-1 ring-primary/50"
                )}
            >
                <span className={cn("truncate block", !selectedOption && "text-gray-500")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 top-[calc(100%+8px)] left-0 w-full min-w-[200px] overflow-hidden rounded-xl border border-gray-800 bg-[#1A1A1A]/95 backdrop-blur-xl shadow-2xl"
                    >
                        <div className="max-h-[300px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "relative flex w-full items-center px-4 py-2.5 text-sm transition-colors",
                                        "hover:bg-primary/10 hover:text-primary",
                                        option.value === value ? "bg-primary/5 text-primary font-medium" : "text-gray-300"
                                    )}
                                >
                                    <span className="flex-1 text-left truncate">{option.label}</span>
                                    {option.value === value && (
                                        <Check className="h-4 w-4 ml-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
