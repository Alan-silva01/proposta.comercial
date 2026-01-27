'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/login');
            } else if (session) {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push('/login');
            return;
        }

        setUser(session.user);
        setLoading(false);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div>
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--surface-card)',
            }}>
                <span style={{ color: 'var(--brand-neon)', fontWeight: 'bold' }}>
                    Propostas Admin
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {user?.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost"
                        style={{ fontSize: 'var(--text-sm)' }}
                    >
                        Sair
                    </button>
                </div>
            </nav>
            {children}
        </div>
    );
}
