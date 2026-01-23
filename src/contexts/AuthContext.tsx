import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[Auth] Checking Supabase session...');

        // Check active session from Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log('[Auth] Found Supabase session');
                setSession(session);
                setUser(session?.user ?? null);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('[Auth] Auth state changed, updating session');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        // Bypass authentication for specific users
        const allowedUsers = [
            {
                email: 'a.payet@agence-lewis.fr',
                password: 'Admin123@!',
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                full_name: 'Angel'
            },
            {
                email: 'a.pivetti@agence-lewis.fr',
                password: 'Admin123@!',
                id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                full_name: 'Antoine'
            }
        ];

        const matchedUser = allowedUsers.find(
            u => u.email === email && u.password === password
        );

        if (matchedUser) {
            console.log(`[Auth] Bypass login for ${matchedUser.full_name}`);

            const mockUser = {
                id: matchedUser.id,
                email: matchedUser.email,
                user_metadata: { full_name: matchedUser.full_name },
                app_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            } as any;

            const mockSession = {
                access_token: 'mock-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh-token',
                user: mockUser
            } as any;

            setSession(mockSession);
            setUser(mockUser);
            return { error: null };
        }

        // Try real Supabase auth for other users
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (!error && data.session) {
            setSession(data.session);
            setUser(data.user);
        }

        return { error };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    const value = {
        session,
        user,
        signIn,
        signUp,
        signOut,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
