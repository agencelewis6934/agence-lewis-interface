import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Search, Plus, Hash, User, Send, Paperclip,
    MoreVertical, Users, MessageSquare, Loader2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { toast } from 'sonner';

interface Profile {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
    role: string;
    is_online: boolean;
}

interface Conversation {
    id: string;
    type: 'dm' | 'channel';
    name: string | null;
    created_at: string;
    unread_count?: number;
    last_message?: Message;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    edited_at: string | null;
    sender?: Profile;
}

interface ConversationMember {
    conversation_id: string;
    user_id: string;
    last_read_at: string | null;
}

export function Chat() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        checkAdminAccess();
    }, [user]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
            markAsRead(selectedConversation);
            subscribeToMessages(selectedConversation);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const checkAdminAccess = async () => {
        // For development: skip auth check and just load conversations
        console.log('[Chat] Dev mode - skipping admin check');
        setLoading(false);
        await fetchConversations();
    };

    const fetchConversations = async () => {
        try {
            // For development: show ALL conversations, not just user's
            console.log('[Chat] Fetching all conversations (dev mode)');
            console.log('[Chat] Supabase URL:', supabase.supabaseUrl);

            const { data, error } = await supabase
                .from('chat_conversations')
                .select('*')
                .order('created_at', { ascending: false });

            console.log('[Chat] Fetch result:', { data, error });

            if (error) {
                console.error('[Chat] Error fetching conversations:', error);
                return;
            }

            const convos = data?.map((item: any) => ({
                id: item.id,
                type: item.type,
                name: item.name,
                created_at: item.created_at,
                last_read_at: null
            })) || [];

            console.log('[Chat] Loaded conversations:', convos.length, convos);
            setConversations(convos);
        } catch (error: any) {
            console.error('[Chat] Error fetching conversations:', error);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            console.log('[Chat] 🔍 Fetching messages for conversation:', conversationId);

            // Fetch messages without the FK relation syntax
            const { data: messagesData, error: messagesError } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .is('deleted_at', null)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            console.log('[Chat] 📦 Raw messages from DB:', messagesData?.length || 0, messagesData);

            // Manually fetch sender profiles for each message
            const messagesWithSenders = await Promise.all(
                (messagesData || []).map(async (msg: any) => {
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('id, display_name, email, avatar_url')
                        .eq('id', msg.sender_id)
                        .single();

                    console.log('[Chat] 👤 Fetched sender for message:', msg.id, sender);
                    return { ...msg, sender: sender || undefined } as Message;
                })
            );

            console.log('[Chat] ✅ Final messages with senders:', messagesWithSenders.length, messagesWithSenders);
            setMessages(messagesWithSenders);
        } catch (error: any) {
            console.error('[Chat] ❌ Error fetching messages:', error);
        }
    };

    const subscribeToMessages = (conversationId: string) => {
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {
                    const newMsg = payload.new as Message;

                    // Fetch sender info
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', newMsg.sender_id)
                        .single();

                    setMessages((current) => [...current, { ...newMsg, sender }]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const markAsRead = async (conversationId: string) => {
        try {
            await supabase
                .from('chat_conversation_members')
                .update({ last_read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('user_id', user?.id);
        } catch (error: any) {
            console.error('[Chat] Error marking as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !user) return;

        try {
            setSending(true);
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    conversation_id: selectedConversation,
                    sender_id: user.id,
                    content: newMessage.trim()
                });

            if (error) throw error;

            setNewMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (error: any) {
            console.error('[Chat] Error sending message:', error);
            toast.error('Erreur lors de l\'envoi du message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Aujourd\'hui';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hier';
        } else {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        }
    };

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {};

        messages.forEach(msg => {
            const dateKey = new Date(msg.created_at).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(msg);
        });

        return groups;
    };

    const selectedConvo = conversations.find(c => c.id === selectedConversation);
    const messageGroups = groupMessagesByDate(messages);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-80px)] gap-0">
            {/* Sidebar - Conversations List */}
            <div className="w-80 border-r border-border flex flex-col bg-surface">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-white mb-4">Chat</h2>
                    <Input
                        placeholder="Rechercher..."
                        leftIcon={<Search className="h-4 w-4" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-4"
                    />
                    <Button variant="primary" className="w-full" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle conversation
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-2">
                        <div className="text-xs font-semibold text-text-subtle uppercase px-2 py-2">
                            Canaux
                        </div>
                        {conversations.filter(c => c.type === 'channel').map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedConversation === conv.id
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-surface-hover'
                                    }`}
                            >
                                <Hash className="h-5 w-5 text-text-subtle shrink-0" />
                                <span className="text-sm font-medium text-white truncate">
                                    {conv.name || 'Canal sans nom'}
                                </span>
                            </button>
                        ))}

                        <div className="text-xs font-semibold text-text-subtle uppercase px-2 py-2 mt-4">
                            Messages directs
                        </div>
                        {conversations.filter(c => c.type === 'dm').map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedConversation === conv.id
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-surface-hover'
                                    }`}
                            >
                                <Avatar fallback="U" className="h-8 w-8" />
                                <span className="text-sm font-medium text-white truncate">
                                    {conv.name || 'Conversation'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface">
                        <div className="flex items-center gap-3">
                            {selectedConvo?.type === 'channel' ? (
                                <Hash className="h-5 w-5 text-text-subtle" />
                            ) : (
                                <Avatar fallback="U" className="h-8 w-8" />
                            )}
                            <div>
                                <h3 className="font-bold text-white">
                                    {selectedConvo?.name || 'Conversation'}
                                </h3>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {Object.entries(messageGroups).map(([dateKey, msgs]) => (
                            <div key={dateKey}>
                                <div className="flex items-center justify-center my-4">
                                    <div className="px-3 py-1 bg-surface-elevated rounded-full">
                                        <span className="text-xs font-medium text-text-subtle">
                                            {formatDate(msgs[0].created_at)}
                                        </span>
                                    </div>
                                </div>
                                {msgs.map((msg) => {
                                    const isOwn = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}
                                        >
                                            <Avatar
                                                fallback={msg.sender?.display_name?.[0] || msg.sender?.email?.[0] || 'U'}
                                                className="h-10 w-10 shrink-0"
                                            />
                                            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-white">
                                                        {msg.sender?.display_name || msg.sender?.email || 'Utilisateur'}
                                                    </span>
                                                    <span className="text-xs text-text-subtle">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`px-4 py-2 rounded-2xl ${isOwn
                                                        ? 'bg-primary text-white'
                                                        : 'bg-surface-elevated text-white'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Composer */}
                    <div className="border-t border-border p-4 bg-surface">
                        <div className="flex items-end gap-2">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <div className="flex-1 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Tapez un message... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
                                    className="w-full max-h-32 bg-surface-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                                    rows={1}
                                />
                            </div>
                            <Button
                                variant="primary"
                                size="icon"
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || sending}
                                className="shrink-0"
                            >
                                {sending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-background">
                    <div className="text-center">
                        <MessageSquare className="h-16 w-16 text-text-subtle mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            Sélectionnez une conversation
                        </h3>
                        <p className="text-text-muted">
                            Choisissez une conversation dans la liste pour commencer à discuter
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chat;
