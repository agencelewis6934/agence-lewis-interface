import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Bell, Lock, Users, Monitor, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function Settings() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        bio: '',
        language: 'Français',
        timezone: 'Paris (GMT+1)'
    });

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    const settings = data as any;
                    setProfile({
                        first_name: settings.first_name || '',
                        last_name: settings.last_name || '',
                        email: user.email || '',
                        bio: settings.bio || '',
                        language: settings.language || 'Français',
                        timezone: settings.timezone || 'Paris (GMT+1)'
                    });
                } else if (!error && user) {
                    // Init profile from user metadata if no settings exist
                    setProfile(prev => ({ ...prev, email: user.email || '' }));
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Vous devez être connecté pour sauvegarder.');
                return;
            }

            const updates = {
                user_id: user.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                bio: profile.bio,
                language: profile.language,
                timezone: profile.timezone,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('user_settings').upsert(updates as any);

            if (error) throw error;
            toast.success('Profil mis à jour avec succès !');
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde du profil.');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
        }

        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-6">
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle>Profil Public</CardTitle>
                                <CardDescription>Gérez comment les autres voient votre profil.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar fallback={profile.first_name?.[0] || "U"} className="h-20 w-20 text-xl bg-gradient-to-br from-primary to-secondary" />
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm">Changer l'avatar</Button>
                                        <p className="text-xs text-text-muted">JPG, GIF ou PNG. 1MB max.</p>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Prénom"
                                        value={profile.first_name}
                                        onChange={(e) => handleChange('first_name', e.target.value)}
                                    />
                                    <Input
                                        label="Nom"
                                        value={profile.last_name}
                                        onChange={(e) => handleChange('last_name', e.target.value)}
                                    />
                                    <Input
                                        label="Email"
                                        value={profile.email}
                                        disabled
                                        className="md:col-span-2 opacity-50"
                                    />
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-text-subtle">Bio</label>
                                        <textarea
                                            className="w-full h-24 bg-surface-elevated border border-border rounded-xl p-3 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
                                            placeholder="Dites quelque chose sur vous..."
                                            value={profile.bio}
                                            onChange={(e) => handleChange('bio', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle>Préférences Régionales</CardTitle>
                                <CardDescription>Langue et fuseau horaire.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-subtle">Langue</label>
                                    <select
                                        value={profile.language}
                                        onChange={(e) => handleChange('language', e.target.value)}
                                        className="w-full h-10 bg-surface-elevated border border-border rounded-xl px-3 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option>Français</option>
                                        <option>English</option>
                                        <option>Español</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-subtle">Fuseau Horaire</label>
                                    <select
                                        value={profile.timezone}
                                        onChange={(e) => handleChange('timezone', e.target.value)}
                                        className="w-full h-10 bg-surface-elevated border border-border rounded-xl px-3 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option>Paris (GMT+1)</option>
                                        <option>London (GMT+0)</option>
                                        <option>New York (GMT-5)</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'appearance':
                return (
                    <Card className="glass-panel">
                        <CardHeader>
                            <CardTitle>Apparence</CardTitle>
                            <CardDescription>Personnalisez l'interface de l'application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-text-subtle">Thème</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-primary bg-surface-elevated ring-2 ring-primary/20 transition-all">
                                        <Moon className="h-6 w-6 text-primary" />
                                        <span className="text-sm font-bold text-white">Sombre</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-all opacity-50 cursor-not-allowed" disabled>
                                        <Sun className="h-6 w-6 text-text-subtle" />
                                        <span className="text-sm text-text-subtle">Clair (Bientôt)</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-all opacity-50 cursor-not-allowed" disabled>
                                        <Monitor className="h-6 w-6 text-text-subtle" />
                                        <span className="text-sm text-text-subtle">Système</span>
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-surface-elevated flex items-center justify-center">
                            <Lock className="h-8 w-8 text-text-subtle" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Section en développement</h3>
                            <p className="text-text-muted">Cette fonctionnalité sera disponible prochainement.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-heading font-bold mb-2">Paramètres</h2>
                    <p className="text-text-muted text-lg">Gérez vos préférences et celle de l'agence</p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    onClick={updateProfile}
                    disabled={saving}
                >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="col-span-12 md:col-span-3">
                    <Card className="glass p-2 space-y-1 sticky top-8">
                        {[
                            { id: 'general', label: 'Général', icon: User },
                            { id: 'notifications', label: 'Notifications', icon: Bell },
                            { id: 'security', label: 'Sécurité', icon: Lock },
                            { id: 'appearance', label: 'Apparence', icon: Monitor },
                            { id: 'team', label: 'Équipe', icon: Users },
                        ].map((item) => (
                            <Button
                                key={item.id}
                                variant="ghost"
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full justify-start text-sm ${activeTab === item.id
                                    ? 'bg-surface-elevated text-white shadow-md border border-border/50'
                                    : 'text-text-subtle hover:text-white'
                                    }`}
                            >
                                <item.icon className={`h-4 w-4 mr-3 ${activeTab === item.id ? 'text-primary' : ''}`} />
                                {item.label}
                            </Button>
                        ))}
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="col-span-12 md:col-span-9">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
