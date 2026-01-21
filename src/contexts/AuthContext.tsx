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
    // Initialize from localStorage
    const [session, setSessionState] = useState<Session | null>(() => {
        const saved = localStorage.getItem('auth_session');
        return saved ? JSON.parse(saved) : null;
    });

    const [user, setUserState] = useState<User | null>(() => {
        const saved = localStorage.getItem('auth_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Start with loading=false if we have a session in localStorage
    const [loading, setLoading] = useState(() => {
        const hasSession = !!localStorage.getItem('auth_session');
        console.log('[Auth] Has session in localStorage:', hasSession);
        console.log('[Auth] Setting initial loading to:', !hasSession);
        return !hasSession;
    });

    // Wrapper functions to update both state and localStorage
    const setSession = (newSession: Session | null) => {
        setSessionState(newSession);
        if (newSession) {
            localStorage.setItem('auth_session', JSON.stringify(newSession));
        } else {
            localStorage.removeItem('auth_session');
        }
    };

    const setUser = (newUser: User | null) => {
        setUserState(newUser);
        if (newUser) {
            localStorage.setItem('auth_user', JSON.stringify(newUser));
        } else {
            localStorage.removeItem('auth_user');
        }
    };

    useEffect(() => {
        // Check active session from Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session);
                setUser(session?.user ?? null);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        // Dev bypass for admin credentials
        if (email === 'admin@agencelewis.com' && password === 'Admin123!') {
            const mockUser = {
                id: '11111111-1111-1111-1111-111111111111',
                email: email,
                user_metadata: { full_name: 'Admin Lewis' },
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

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
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
