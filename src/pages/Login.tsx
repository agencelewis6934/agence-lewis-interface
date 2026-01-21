import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            toast.success('Connexion réussie !');
            navigate('/');
        } catch (error: any) {
            console.error(error);
            toast.error('Erreur de connexion : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_10%_20%,rgba(224,82,139,0.1)_0%,transparent_20%),radial-gradient(circle_at_90%_80%,rgba(187,139,166,0.1)_0%,transparent_20%)]">
            <div className="w-full max-w-[400px] rounded-2xl border border-border bg-surface p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="mb-1 font-heading text-3xl font-bold text-white">
                        AGENCE <span className="text-primary">LEWIS</span>
                    </h1>
                    <p className="text-sm text-text-muted">Connectez-vous à votre tableau de bord</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <Input
                        type="email"
                        placeholder="nom@agence.com"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftIcon={<Mail size={18} />}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="••••••••"
                        label="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock size={18} />}
                        required
                    />

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        isLoading={loading}
                        rightIcon={<ArrowRight size={18} />}
                        size="lg"
                    >
                        Se connecter
                    </Button>
                </form>

                <div className="mt-8 text-center flex flex-col gap-2">
                    <a href="#" className="text-sm text-text-muted transition-colors hover:text-primary">
                        Mot de passe oublié ?
                    </a>
                    <p className="text-sm text-text-muted">
                        Pas encore de compte ?{' '}
                        <Link to="/signup" className="text-primary hover:underline transition-colors">
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
