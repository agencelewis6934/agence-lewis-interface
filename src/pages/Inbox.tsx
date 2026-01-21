import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Inbox as InboxIcon, Send, Star, File, MoreHorizontal, Paperclip, Reply, Trash2, Archive, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

interface Message {
    id: string;
    sender: string;
    subject: string;
    preview: string;
    content: string;
    created_at: string;
    is_read: boolean;
    is_starred: boolean;
    tag: string;
    sender_avatar: string;
}

export function Inbox() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'email' | 'chat'>('email');
    const [activeFolder, setActiveFolder] = useState('inbox'); // 'inbox', 'sent', 'drafts'
    const [isComposing, setIsComposing] = useState(false);

    // Composition state
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeContent, setComposeContent] = useState('');

    // Chat state
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const { user } = useAuth(); // Assume we have access to user info now

    useEffect(() => {
        if (viewMode === 'email') {
            fetchMessages();
        }
    }, [viewMode, activeFolder]);

    useEffect(() => {
        // Subscribe to real-time chat
        const channel = supabase
            .channel('team_chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_chat_messages' }, (payload) => {
                setChatMessages((current) => [...current, payload.new]);
            })
            .subscribe();

        fetchChatHistory();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            let query = supabase.from('inbox_messages').select('*').order('created_at', { ascending: false });

            if (activeFolder === 'starred') {
                // query = query.eq('is_starred', true);
            } else {
                query = query.eq('folder', activeFolder);
            }

            const { data } = await query;
            if (data) setMessages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!composeTo || !composeSubject || !composeContent) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        try {
            // @ts-ignore
            await supabase.from('inbox_messages').insert({
                sender: user?.user_metadata?.first_name || 'Admin', // In 'sent' folder, sender is me
                sender_avatar: 'ME',
                recipient: composeTo,
                subject: composeSubject,
                content: composeContent,
                preview: composeContent.substring(0, 50) + '...',
                folder: 'sent',
                is_read: true,
                tag: 'General'
            });

            setIsComposing(false);
            setComposeTo('');
            setComposeSubject('');
            setComposeContent('');

            if (activeFolder === 'sent') fetchMessages();
            else setActiveFolder('sent');

        } catch (error) {
            console.error("Error sending email", error);
            alert("Erreur lors de l'envoi");
        }
    };

    const fetchChatHistory = async () => {
        const { data } = await supabase.from('team_chat_messages').select('*').order('created_at', { ascending: true });
        if (data) setChatMessages(data);
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        // Optimistic update (optional, but Realtime is fast usually)
        // const tempMsg = { id: Date.now(), content: newMessage, sender_name: 'Moi', created_at: new Date().toISOString() };
        // setChatMessages(prev => [...prev, tempMsg]);

        // @ts-ignore
        await supabase.from('team_chat_messages').insert({
            content: newMessage,
            sender_name: user?.user_metadata?.first_name || 'Admin', // Fallback
            sender_avatar: 'ME',
            sender_id: user?.id
        });
        setNewMessage('');
        // Scroll to bottom logic would go here
    };

    const selectedMail = messages.find(m => m.id === selectedMailId);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-white mb-1">Boîte de réception</h2>
                    <p className="text-text-muted">Gérez vos communications client et interne</p>
                </div>
                <div className="flex items-center bg-surface-elevated rounded-lg p-1 border border-border">
                    <button
                        onClick={() => setViewMode('email')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'email' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'}`}
                    >
                        Emails
                    </button>
                    <button
                        onClick={() => setViewMode('chat')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'chat' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'}`}
                    >
                        Team Chat
                    </button>
                </div>
                {viewMode === 'email' && (
                    <Button variant="primary" onClick={() => setIsComposing(!isComposing)}>
                        {isComposing ? 'Annuler' : 'Nouveau message'}
                    </Button>
                )}
            </div>

            {viewMode === 'chat' ? (
                /* Chat Interface */
                <Card className="flex-1 glass-panel flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border/50 bg-surface-elevated/30 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Canal Général</h3>
                        <span className="text-xs text-text-muted">{chatMessages.length} messages</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                        {chatMessages.map((msg: any) => {
                            const isMe = msg.sender_id === user?.id || (!msg.sender_id && msg.sender_name === 'Admin'); // Simple check
                            return (
                                <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                    <Avatar fallback={msg.sender_avatar || msg.sender_name?.[0]} className="h-8 w-8 text-xs shrink-0" />
                                    <div>
                                        <div className={`p-3 rounded-2xl ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-elevated border border-border rounded-tl-none'}`}>
                                            {!isMe && <p className="text-[10px] text-text-muted mb-1 font-bold">{msg.sender_name}</p>}
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                        <span className="text-[10px] text-text-subtle mt-1 block px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="p-4 bg-surface-elevated/50 border-t border-border/50">
                        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                            <Button type="button" variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
                            <Input
                                placeholder="Écrivez votre message..."
                                className="flex-1 bg-surface border-border-subtle"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <Button type="submit" variant="primary" size="icon"><Send className="h-4 w-4" /></Button>
                        </form>
                    </div>
                </Card>
            ) : (
                /* Email Interface (Existing) */
                <div className="flex gap-6 h-full min-h-0">
                    {/* Sidebar Navigation */}
                    <Card className="w-64 shrink-0 flex flex-col gap-2 p-4 h-full glass-panel border-r border-border/50">
                        <Button variant="ghost" onClick={() => setActiveFolder('inbox')} className={`justify-start w-full ${activeFolder === 'inbox' ? 'bg-primary/10 text-primary font-bold' : 'text-text-muted hover:text-white'}`}>
                            <InboxIcon className="mr-3 h-4 w-4" /> Boîte de réception
                        </Button>
                        <Button variant="ghost" onClick={() => setActiveFolder('sent')} className={`justify-start w-full ${activeFolder === 'sent' ? 'bg-primary/10 text-primary font-bold' : 'text-text-muted hover:text-white'}`}>
                            <Send className="mr-3 h-4 w-4" /> Envoyés
                        </Button>
                        <div className="my-2 h-px bg-border-subtle" />
                        <p className="px-4 text-xs font-bold text-text-subtle uppercase tracking-wider mb-2">Labels</p>
                        <Button variant="ghost" className="justify-start w-full text-text-muted hover:text-white">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-3" /> Projet
                        </Button>
                        <Button variant="ghost" className="justify-start w-full text-text-muted hover:text-white">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-3" /> Finance
                        </Button>
                        <Button variant="ghost" className="justify-start w-full text-text-muted hover:text-white">
                            <span className="w-2 h-2 rounded-full bg-amber-500 mr-3" /> Lead
                        </Button>
                    </Card>

                    {/* Message List */}
                    <Card className="w-96 shrink-0 flex flex-col glass h-full p-0 overflow-hidden border-r border-border/50">
                        <div className="p-4 border-b border-border/50">
                            <Input
                                placeholder="Rechercher..."
                                leftIcon={<Search className="h-4 w-4" />}
                                className="bg-surface-elevated border-border-subtle"
                            />
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                {messages.map((email) => (
                                    <div
                                        key={email.id}
                                        onClick={() => setSelectedMailId(email.id)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedMailId === email.id
                                            ? 'bg-primary/5 border-primary/20 shadow-md'
                                            : 'bg-transparent border-transparent hover:bg-surface-hover hover:border-border-subtle'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar fallback={email.sender_avatar} className="h-6 w-6 text-[10px]" />
                                                <span className={`text-sm ${!email.is_read ? 'font-bold text-white' : 'text-text-secondary'}`}>
                                                    {email.sender}
                                                </span>
                                            </div>
                                            <span className="text-xs text-text-subtle">{formatDate(email.created_at)}</span>
                                        </div>
                                        <h4 className={`text-sm mb-1 line-clamp-1 ${!email.is_read ? 'font-bold text-white' : 'text-text-secondary'}`}>
                                            {email.subject}
                                        </h4>
                                        <p className="text-xs text-text-muted line-clamp-2">
                                            {email.preview}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Message Detail */}
                    <Card className="flex-1 glass-panel h-full flex flex-col p-0 overflow-hidden">
                        {isComposing ? (
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b border-border/50">
                                    <h3 className="text-xl font-bold text-white">Nouveau message</h3>
                                </div>
                                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Destinataire</label>
                                        <Input
                                            placeholder="Ex: client@exemple.com"
                                            value={composeTo}
                                            onChange={(e) => setComposeTo(e.target.value)}
                                            className="bg-surface-elevated"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Sujet</label>
                                        <Input
                                            placeholder="Sujet du message"
                                            value={composeSubject}
                                            onChange={(e) => setComposeSubject(e.target.value)}
                                            className="bg-surface-elevated"
                                        />
                                    </div>
                                    <div className="space-y-2 flex-1 flex flex-col">
                                        <label className="text-sm font-medium text-text-secondary">Message</label>
                                        <textarea
                                            className="flex-1 w-full bg-surface-elevated border border-border-subtle rounded-lg p-4 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none min-h-[300px]"
                                            placeholder="Votre message..."
                                            value={composeContent}
                                            onChange={(e) => setComposeContent(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border/50 bg-surface-elevated/50 flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setIsComposing(false)}>Annuler</Button>
                                    <Button variant="primary" onClick={handleSendEmail} leftIcon={<Send className="h-4 w-4" />}>Envoyer</Button>
                                </div>
                            </div>
                        ) : selectedMail ? (
                            <>
                                <div className="p-6 border-b border-border/50 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{selectedMail.subject}</h3>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="neutral">{selectedMail.tag}</Badge>
                                            <span className="text-sm text-text-muted">{formatDate(selectedMail.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="text-text-muted hover:text-white"><Archive className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-text-muted hover:text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-text-muted hover:text-white"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                                <div className="flex-1 p-8 overflow-y-auto">
                                    <div className="flex items-center gap-4 mb-8">
                                        <Avatar fallback={selectedMail.sender_avatar} className="h-12 w-12 text-sm bg-gradient-to-br from-primary to-secondary" />
                                        <div>
                                            <p className="font-bold text-white">{selectedMail.sender}</p>
                                            <p className="text-xs text-text-muted">À: Antoine Lewis</p>
                                        </div>
                                    </div>
                                    <div className="prose prose-invert text-text-secondary max-w-none whitespace-pre-wrap">
                                        {selectedMail.content || selectedMail.preview}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border/50 bg-surface-elevated/50">
                                    <div className="flex gap-4">
                                        <Button variant="primary" leftIcon={<Reply className="h-4 w-4" />}>Répondre</Button>
                                        <Button variant="outline">Transférer</Button>
                                        <Button variant="ghost" leftIcon={<Paperclip className="h-4 w-4" />}>Joindre un fichier</Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted">
                                <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                                    <InboxIcon className="h-8 w-8 opacity-20" />
                                </div>
                                <p>Sélectionnez un message pour le lire</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}

export default Inbox;
