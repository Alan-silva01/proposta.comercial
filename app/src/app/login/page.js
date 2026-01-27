'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (isSignUp) {
            // Sign Up
            if (password !== confirmPassword) {
                setError('As senhas não coincidem');
                setLoading(false);
                return;
            }

            if (password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setSuccess('Conta criada! Verifique seu email para confirmar (ou faça login se a confirmação estiver desativada).');
            setLoading(false);
            setIsSignUp(false);
            setPassword('');
            setConfirmPassword('');
        } else {
            // Sign In
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            router.push('/admin');
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <span className={styles.icon}>{isSignUp ? '👤' : '🔐'}</span>
                    <h1>{isSignUp ? 'Criar Conta' : 'Admin Login'}</h1>
                    <p>{isSignUp ? 'Crie sua conta de administrador' : 'Acesse o painel de propostas'}</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className={styles.success}>
                            {success}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {isSignUp && (
                        <div className="form-group">
                            <label className="label">Confirmar Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`btn btn-primary ${styles.submitBtn}`}
                        disabled={loading}
                    >
                        {loading
                            ? (isSignUp ? 'Criando...' : 'Entrando...')
                            : (isSignUp ? 'Criar Conta' : 'Entrar')
                        }
                    </button>
                </form>

                <div className={styles.toggle}>
                    {isSignUp ? (
                        <p>
                            Já tem uma conta?{' '}
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
                                className={styles.toggleBtn}
                            >
                                Fazer Login
                            </button>
                        </p>
                    ) : (
                        <p>
                            Não tem conta?{' '}
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
                                className={styles.toggleBtn}
                            >
                                Criar Conta
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
