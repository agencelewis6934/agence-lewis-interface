import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Mail, Star, Trash2, Archive, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { toast } from 'sonner';

interface Email {
    id: string;
    message_id: string;
    thread_id: string | null;
    from_name: string | null;
    from_email: string | null;
    subject: string | null;
    snippet: string | null;
    body: string | null;
    source: string;
    status: string;
    created_at: string;
}

export function Inbox() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    useEffect(() => {
        fetchEmails();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('emails_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'emails' },
                (payload) => {
                    console.log('New email received:', payload.new);
                    setEmails((current) => [payload.new as Email, ...current]);
                    toast.success('Nouveau email reçu !');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('emails')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setEmails(data);
        } catch (error: any) {
            console.error('Error fetching emails:', error);
            toast.error('Erreur lors du chargement des emails');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (emailId: string) => {
        try {
            const { error } = await supabase
                .from('emails')
                .update({ status: 'read' })
                .eq('id', emailId);

            if (error) throw error;

            setEmails((current) =>
                current.map((email) =>
                    email.id === emailId ? { ...email, status: 'read' } : email
                )
            );
        } catch (error: any) {
            console.error('Error marking email as read:', error);
        }
    };

    const deleteEmail = async (emailId: string) => {
        try {
            const { error } = await supabase
                .from('emails')
                .delete()
                .eq('id', emailId);

            if (error) throw error;

            setEmails((current) => current.filter((email) => email.id !== emailId));
            if (selectedEmailId === emailId) setSelectedEmailId(null);
            toast.success('Email supprimé');
        } catch (error: any) {
            console.error('Error deleting email:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const selectedEmail = emails.find((e) => e.id === selectedEmailId);

    const filteredEmails = emails.filter((email) => {
        // Filter by status
        if (filter === 'unread' && email.status !== 'unread') return false;
        if (filter === 'read' && email.status !== 'read') return false;

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                email.subject?.toLowerCase().includes(query) ||
                email.from_name?.toLowerCase().includes(query) ||
                email.from_email?.toLowerCase().includes(query) ||
                email.body?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const getInitials = (name: string | null, email: string | null) => {
        if (name) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return '??';
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-white mb-1">Boîte de réception Gmail</h2>
                    <p className="text-text-muted">
                        {filteredEmails.length} email{filteredEmails.length > 1 ? 's' : ''}
                        {filter !== 'all' && ` (${filter === 'unread' ? 'non lu' : 'lu'}s)`}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchEmails} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            {/* Filters */}
            <Card className="glass-panel p-2 flex gap-2 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={`rounded-lg ${filter === 'all' ? 'bg-surface-hover text-white' : 'text-text-muted hover:text-white'}`}
                >
                    Tous
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className={`rounded-lg ${filter === 'unread' ? 'bg-surface-hover text-white' : 'text-text-muted hover:text-white'}`}
                >
                    Non lus
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter('read')}
                    className={`rounded-lg ${filter === 'read' ? 'bg-surface-hover text-white' : 'text-text-muted hover:text-white'}`}
                >
                    Lus
                </Button>
            </Card>

            {/* Email Interface */}
            <div className="flex gap-6 h-full min-h-0">
                {/* Email List */}
                <Card className="w-96 shrink-0 flex flex-col glass h-full p-0 overflow-hidden border-r border-border/50">
                    <div className="p-4 border-b border-border/50">
                        <Input
                            placeholder="Rechercher..."
                            leftIcon={<Search className="h-4 w-4" />}
                            className="bg-surface-elevated border-border-subtle"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8">
                            <Mail className="h-16 w-16 opacity-20 mb-4" />
                            <p className="text-center">
                                {searchQuery ? 'Aucun email trouvé' : 'Aucun email'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {filteredEmails.map((email) => (
                                <div
                                    key={email.id}
                                    onClick={() => {
                                        setSelectedEmailId(email.id);
                                        if (email.status === 'unread') {
                                            markAsRead(email.id);
                                        }
                                    }}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedEmailId === email.id
                                            ? 'bg-primary/5 border-primary/20 shadow-md'
                                            : 'bg-transparent border-transparent hover:bg-surface-hover hover:border-border-subtle'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Avatar
                                                fallback={getInitials(email.from_name, email.from_email)}
                                                className="h-8 w-8 text-xs shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span
                                                    className={`text-sm block truncate ${email.status === 'unread' ? 'font-bold text-white' : 'text-text-secondary'
                                                        }`}
                                                >
                                                    {email.from_name || email.from_email || 'Inconnu'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-text-subtle whitespace-nowrap ml-2">
                                            {formatDate(email.created_at)}
                                        </span>
                                    </div>
                                    <h4
                                        className={`text-sm mb-1 line-clamp-1 ${email.status === 'unread' ? 'font-bold text-white' : 'text-text-secondary'
                                            }`}
                                    >
                                        {email.subject || '(Sans objet)'}
                                    </h4>
                                    <p className="text-xs text-text-muted line-clamp-2">
                                        {email.snippet || email.body?.substring(0, 100) || ''}
                                    </p>
                                    {email.status === 'unread' && (
                                        <div className="mt-2">
                                            <Badge variant="info" className="text-xs">Nouveau</Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Email Detail */}
                <Card className="flex-1 glass-panel h-full flex flex-col p-0 overflow-hidden">
                    {selectedEmail ? (
                        <>
                            <div className="p-6 border-b border-border/50 flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {selectedEmail.subject || '(Sans objet)'}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="neutral">{selectedEmail.source}</Badge>
                                        <span className="text-sm text-text-muted">
                                            {new Date(selectedEmail.created_at).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="text-text-muted hover:text-white">
                                        <Star className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-text-muted hover:text-white">
                                        <Archive className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-text-muted hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => deleteEmail(selectedEmail.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="flex items-center gap-4 mb-8">
                                    <Avatar
                                        fallback={getInitials(selectedEmail.from_name, selectedEmail.from_email)}
                                        className="h-12 w-12 text-sm bg-gradient-to-br from-primary to-secondary"
                                    />
                                    <div>
                                        <p className="font-bold text-white">
                                            {selectedEmail.from_name || 'Expéditeur inconnu'}
                                        </p>
                                        <p className="text-xs text-text-muted">{selectedEmail.from_email}</p>
                                    </div>
                                </div>
                                <div className="prose prose-invert text-text-secondary max-w-none whitespace-pre-wrap">
                                    {selectedEmail.body || selectedEmail.snippet || 'Aucun contenu'}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted">
                            <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                                <Mail className="h-8 w-8 opacity-20" />
                            </div>
                            <p>Sélectionnez un email pour le lire</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default Inbox;
