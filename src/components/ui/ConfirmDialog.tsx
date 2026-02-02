import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    destructive = false,
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={cn(
                                "relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden",
                                "ring-1 ring-white/5"
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-4 p-6 pb-4">
                                {destructive && (
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-text-muted leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors text-text-subtle hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 px-6 pb-6 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    variant={destructive ? 'destructive' : 'primary'}
                                    onClick={handleConfirm}
                                    className="flex-1"
                                >
                                    {confirmText}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
