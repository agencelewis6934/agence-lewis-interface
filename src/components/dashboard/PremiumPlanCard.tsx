import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const PremiumPlanCard: React.FC = () => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
            <Card className="bg-gradient-to-br from-primary to-secondary border-none overflow-hidden relative group">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <CardContent className="p-6 relative z-10 flex flex-col items-center text-center">
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md mb-4">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Passez au Premium</h3>
                    <p className="text-white/80 text-sm mb-6 max-w-[200px]">
                        Améliorez votre espace de travail et analysez vos profits en détail.
                    </p>

                    <Button variant="outline" className="w-full bg-white text-primary border-none hover:bg-white/90 font-bold group">
                        Commencer
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};
