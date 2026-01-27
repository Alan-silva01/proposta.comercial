'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

export default function AdminPage() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProposals();
    }, []);

    async function fetchProposals() {
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching proposals:', error);
        } else {
            setProposals(data || []);
        }
        setLoading(false);
    }

    async function deleteProposal(id) {
        if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;

        const { error } = await supabase
            .from('proposals')
            .delete()
            .eq('id', id);

        if (!error) {
            setProposals(proposals.filter(p => p.id !== id));
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    function getStatusBadge(status) {
        const statusMap = {
            draft: { label: 'Rascunho', className: styles.statusDraft },
            sent: { label: 'Enviada', className: styles.statusSent },
            viewed: { label: 'Visualizada', className: styles.statusViewed },
            accepted: { label: 'Aceita', className: styles.statusAccepted },
        };
        return statusMap[status] || statusMap.draft;
    }

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Carregando propostas...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Propostas Comerciais</h1>
                    <p className={styles.subtitle}>Gerencie suas propostas de IA e automação</p>
                </div>
                <Link href="/admin/new" className="btn btn-primary">
                    + Nova Proposta
                </Link>
            </header>

            {proposals.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>Nenhuma proposta ainda</h3>
                    <p>Crie sua primeira proposta comercial</p>
                    <Link href="/admin/new" className="btn btn-primary mt-6">
                        Criar Proposta
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {proposals.map((proposal) => {
                        const statusInfo = getStatusBadge(proposal.status);
                        return (
                            <div key={proposal.id} className={`card ${styles.proposalCard}`}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.status} ${statusInfo.className}`}>
                                        {statusInfo.label}
                                    </span>
                                    <span className={styles.date}>
                                        {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <h3 className={styles.companyName}>{proposal.company_name}</h3>
                                <p className={styles.clientName}>{proposal.client_name}</p>

                                <div className={styles.cardStats}>
                                    <div>
                                        <span className={styles.statLabel}>Valor</span>
                                        <span className={styles.statValue}>{formatCurrency(proposal.price_total)}</span>
                                    </div>
                                    <div>
                                        <span className={styles.statLabel}>Tipo</span>
                                        <span className={styles.statValue}>
                                            {proposal.funnel_type === 'scheduling' ? 'Agendamento' : 'Vendas'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <Link
                                        href={`/admin/edit/${proposal.id}`}
                                        className="btn btn-primary"
                                        style={{ fontSize: 'var(--text-sm)' }}
                                    >
                                        ✏️ Editar
                                    </Link>
                                    <Link
                                        href={`/p/${proposal.slug}`}
                                        target="_blank"
                                        className="btn btn-secondary"
                                    >
                                        👁 Ver
                                    </Link>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/p/${proposal.slug}`);
                                            alert('Link copiado!');
                                        }}
                                        className="btn btn-ghost"
                                    >
                                        🔗 Copiar Link
                                    </button>
                                    <button
                                        onClick={() => deleteProposal(proposal.id)}
                                        className={`btn btn-ghost ${styles.deleteBtn}`}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
