"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './edit.module.css';

const INDUSTRIES = [
    'Saúde/Clínicas',
    'Educação',
    'Imobiliário',
    'E-commerce',
    'Serviços B2B',
    'Infoprodutos',
    'Varejo Local',
    'Outros'
];

const PAYMENT_METHODS = {
    pix_cartao: 'PIX ou Cartão',
    pix: 'Apenas PIX',
    cartao: 'Apenas Cartão',
    boleto: 'Boleto',
    todos: 'Todos os meios'
};

export default function EditProposal() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        client_name: '',
        company_name: '',
        industry: '',
        status: 'draft',
        funnel_type: 'simple',
        leads_received: 0,
        leads_responded: 0,
        leads_scheduled: 0,
        leads_showed_up: 0,
        leads_converted: 0,
        average_ticket: 0,
        ltv: 0,
        projected_response_rate: 95,
        projected_conversion_rate: 0,
        projected_show_rate: 80,
        price_total: 0,
        price_upfront: 0,
        installments: '1',
        implementation_payment_method: 'pix_cartao',
        has_maintenance: true,
        maintenance_price: 297,
        maintenance_payment_method: 'pix_cartao',
        primary_color: '#00D1FF',
        roadmap_analysis_days: 2,
        roadmap_approval_days: 1,
        roadmap_development_days: 7,
        roadmap_testing_days: 2,
        implementation_features: ['Configuração Total', 'Treinamento da IA', 'Garantia de 30 dias'],
        maintenance_features: ['Manutenção contínua', 'Ajustes ilimitados', 'Relatórios mensais'],
        benefits: ['atendimento_24h', 'escalabilidade', 'reducao_custo', 'qualificacao_leads'],
        challenges: [],
        comparison_with_ai: ['Responde em segundos', 'Atendimento 24/7', 'Não esquece de fazer follow-up'],
        comparison_without_ai: ['Demora 1h ou mais', 'Perde vendas no final de semana', 'Esquece de retornar para o lead'],
        market_stats: [
            { text: 'Contatar um lead nos primeiros 5 mins aumenta em', highlight: '9x as chances de conversão' },
            { text: 'O atendimento por IA reduz o custo de aquisição em até', highlight: '40%' }
        ],
        diagnosis_text: '',
        cost_per_conversation: 0,
        estimated_monthly_cost: 0
    });

    useEffect(() => {
        if (id) {
            fetchProposal();
        }
    }, [id]);

    async function fetchProposal() {
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar proposta');
            router.push('/admin');
            return;
        }

        if (data) {
            setFormData({
                ...formData,
                ...data,
                // Garantir que campos de lista não sejam nulos
                implementation_features: data.implementation_features || [],
                maintenance_features: data.maintenance_features || [],
                benefits: data.benefits || [],
                challenges: data.challenges || [],
                comparison_with_ai: data.comparison_with_ai || [],
                comparison_without_ai: data.comparison_without_ai || [],
                market_stats: data.market_stats || []
            });
        }
        setLoading(false);
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
            };

            // Cálculo automático do custo mensal estimado
            if (name === 'leads_received' || name === 'cost_per_conversation') {
                const leads = name === 'leads_received' ? (parseFloat(value) || 0) : (parseFloat(prev.leads_received) || 0);
                const costPerConv = name === 'cost_per_conversation' ? (parseFloat(value) || 0) : (parseFloat(prev.cost_per_conversation) || 0);
                newState.estimated_monthly_cost = parseFloat((leads * costPerConv).toFixed(2));
            }

            return newState;
        });
    }

    function updateFeature(type, index, value) {
        setFormData(prev => {
            const newList = [...prev[type]];
            newList[index] = value;
            return { ...prev, [type]: newList };
        });
    }

    function addFeature(type) {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], '']
        }));
    }

    function removeFeature(type, index) {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    }

    function toggleBenefit(id) {
        setFormData(prev => {
            const benefits = prev.benefits.includes(id)
                ? prev.benefits.filter(b => b !== id)
                : [...prev.benefits, id];
            return { ...prev, benefits };
        });
    }

    function toggleChallenge(id) {
        setFormData(prev => {
            const challenges = prev.challenges.includes(id)
                ? prev.challenges.filter(c => c !== id)
                : [...prev.challenges, id];
            return { ...prev, challenges };
        });
    }

    const updateComparisonItem = (field, index, value) => {
        const newList = [...formData[field]];
        newList[index] = value;
        setFormData(prev => ({ ...prev, [field]: newList }));
    };

    const addComparisonItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeComparisonItem = (field, index) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    const updateMarketStat = (index, field, value) => {
        const newList = [...formData.market_stats];
        newList[index] = { ...newList[index], [field]: value };
        setFormData(prev => ({ ...prev, market_stats: newList }));
    };

    const addMarketStat = () => {
        setFormData(prev => ({ ...prev, market_stats: [...prev.market_stats, { text: '', highlight: '' }] }));
    };

    const removeMarketStat = (index) => {
        setFormData(prev => ({ ...prev, market_stats: prev.market_stats.filter((_, i) => i !== index) }));
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        const { payment_method, ...dataToSave } = formData;

        const { error } = await supabase
            .from('proposals')
            .update({
                ...dataToSave,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            alert('Erro ao salvar: ' + error.message);
            setSaving(false);
            return;
        }

        router.push('/admin');
    }

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <p>Carregando proposta...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin" className={styles.backLink}>
                    ← Voltar
                </Link>
                <h1>Editar Proposta</h1>
            </header>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Cliente */}
                <section className={styles.stepContent}>
                    <h2>Dados do Cliente</h2>

                    <div className="form-group">
                        <label className="label">Nome do Contato</label>
                        <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} className="input" required />
                    </div>

                    <div className="form-group">
                        <label className="label">Nome da Empresa</label>
                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="input" required />
                    </div>

                    <div className={styles.gridTwo}>
                        <div className="form-group">
                            <label className="label">Segmento</label>
                            <select name="industry" value={formData.industry} onChange={handleChange} className="select">
                                <option value="">Selecione...</option>
                                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="select">
                                <option value="draft">Rascunho</option>
                                <option value="sent">Enviada</option>
                                <option value="viewed">Visualizada</option>
                                <option value="accepted">Aceita</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Tipo de Funil</label>
                        <div className={styles.radioGroup}>
                            <label className={`${styles.radioCard} ${formData.funnel_type === 'simple' ? styles.selected : ''}`}>
                                <input type="radio" name="funnel_type" value="simple" checked={formData.funnel_type === 'simple'} onChange={handleChange} />
                                <span className={styles.radioIcon}>🎯</span>
                                <span className={styles.radioTitle}>Vendas Diretas</span>
                            </label>
                            <label className={`${styles.radioCard} ${formData.funnel_type === 'scheduling' ? styles.selected : ''}`}>
                                <input type="radio" name="funnel_type" value="scheduling" checked={formData.funnel_type === 'scheduling'} onChange={handleChange} />
                                <span className={styles.radioIcon}>📅</span>
                                <span className={styles.radioTitle}>Com Agendamento</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Dados Atuais */}
                <section className={styles.stepContent} style={{ marginTop: 'var(--space-8)' }}>
                    <h2>Situação Atual</h2>

                    <div className={styles.gridTwo}>
                        <div className="form-group">
                            <label className="label">Leads Recebidos/Mês</label>
                            <input type="number" name="leads_received" value={formData.leads_received} onChange={handleChange} className="input" />
                        </div>
                        <div className="form-group">
                            <label className="label">Leads Respondidos</label>
                            <input type="number" name="leads_responded" value={formData.leads_responded} onChange={handleChange} className="input" />
                        </div>
                    </div>

                    {formData.funnel_type === 'scheduling' && (
                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Agendamentos</label>
                                <input type="number" name="leads_scheduled" value={formData.leads_scheduled} onChange={handleChange} className="input" />
                            </div>
                            <div className="form-group">
                                <label className="label">Compareceram</label>
                                <input type="number" name="leads_showed_up" value={formData.leads_showed_up} onChange={handleChange} className="input" />
                            </div>
                        </div>
                    )}

                    <div className={styles.gridTwo}>
                        <div className="form-group">
                            <label className="label">Conversões/Vendas</label>
                            <input type="number" name="leads_converted" value={formData.leads_converted} onChange={handleChange} className="input" />
                        </div>
                        <div className="form-group">
                            <label className="label">Ticket Médio (R$)</label>
                            <input type="number" name="average_ticket" value={formData.average_ticket} onChange={handleChange} className="input" step="0.01" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">LTV (R$)</label>
                        <input type="number" name="ltv" value={formData.ltv} onChange={handleChange} className="input" step="0.01" />
                    </div>
                </section>

                {/* Projeções */}
                <section className={styles.stepContent} style={{ marginTop: 'var(--space-8)' }}>
                    <h2>Projeções</h2>

                    <div className={styles.gridTwo}>
                        <div className="form-group">
                            <label className="label">Taxa de Resposta (%)</label>
                            <input type="number" name="projected_response_rate" value={formData.projected_response_rate} onChange={handleChange} className="input" min="0" max="100" />
                        </div>
                        <div className="form-group">
                            <label className="label">Taxa de Conversão (%)</label>
                            <input type="number" name="projected_conversion_rate" value={formData.projected_conversion_rate} onChange={handleChange} className="input" min="0" max="100" />
                        </div>
                    </div>

                    {formData.funnel_type === 'scheduling' && (
                        <div className="form-group">
                            <label className="label">Taxa de Comparecimento (%)</label>
                            <input type="number" name="projected_show_rate" value={formData.projected_show_rate} onChange={handleChange} className="input" min="0" max="100" />
                        </div>
                    )}
                </section>

                {/* Investimento */}
                <section className={styles.stepContent} style={{ marginTop: 'var(--space-8)' }}>
                    <h2>Investimento</h2>

                    {/* Implementação */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>💼 Implementação</h3>

                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Valor Total (R$)</label>
                                <input type="number" name="price_total" value={formData.price_total} onChange={handleChange} className="input" step="0.01" />
                            </div>
                            <div className="form-group">
                                <label className="label">Entrada (R$)</label>
                                <input type="number" name="price_upfront" value={formData.price_upfront} onChange={handleChange} className="input" step="0.01" />
                            </div>
                        </div>

                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Parcelas</label>
                                <select name="installments" value={formData.installments} onChange={handleChange} className="select">
                                    <option value="1">À vista</option>
                                    <option value="2">2x</option>
                                    <option value="3">3x</option>
                                    <option value="4">4x</option>
                                    <option value="5">5x</option>
                                    <option value="6">6x</option>
                                    <option value="10">10x</option>
                                    <option value="12">12x</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Formas de Pagamento</label>
                                <select name="implementation_payment_method" value={formData.implementation_payment_method} onChange={handleChange} className="select">
                                    <option value="pix_cartao">PIX ou Cartão</option>
                                    <option value="pix">Apenas PIX</option>
                                    <option value="cartao">Apenas Cartão</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="todos">Todos os meios</option>
                                </select>
                            </div>
                        </div>

                        {/* Itens inclusos na Implementação */}
                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="label">Itens Inclusos na Implementação</label>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                O que está incluído no valor de implementação
                            </p>
                            {formData.implementation_features.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        value={item}
                                        onChange={(e) => updateFeature('implementation_features', index, e.target.value)}
                                        placeholder="Ex: Configuração Total"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFeature('implementation_features', index)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0 var(--space-3)' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addFeature('implementation_features')}
                                className="btn btn-secondary"
                                style={{ marginTop: 'var(--space-2)' }}
                            >
                                + Adicionar item
                            </button>
                        </div>
                    </div>

                    {/* Manutenção */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>🔧 Manutenção Mensal</h3>
                            <label className={styles.toggleSwitch}>
                                <input
                                    type="checkbox"
                                    name="has_maintenance"
                                    checked={formData.has_maintenance}
                                    onChange={(e) => setFormData(prev => ({ ...prev, has_maintenance: e.target.checked }))}
                                />
                                <span className={styles.toggleSlider}></span>
                            </label>
                        </div>

                        {formData.has_maintenance && (
                            <>
                                <div className={styles.gridTwo}>
                                    <div className="form-group">
                                        <label className="label">Valor Mensal (R$)</label>
                                        <input
                                            type="number"
                                            name="maintenance_price"
                                            value={formData.maintenance_price}
                                            onChange={handleChange}
                                            className="input"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Formas de Pagamento</label>
                                        <select
                                            name="maintenance_payment_method"
                                            value={formData.maintenance_payment_method}
                                            onChange={handleChange}
                                            className="select"
                                        >
                                            <option value="pix_cartao">PIX ou Cartão</option>
                                            <option value="pix">Apenas PIX</option>
                                            <option value="cartao">Apenas Cartão</option>
                                            <option value="debito_auto">Débito Automático</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Itens inclusos na Manutenção */}
                                <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                                    <label className="label">Itens Inclusos na Manutenção</label>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                        O que está incluído na manutenção mensal
                                    </p>
                                    {formData.maintenance_features.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                            <input
                                                type="text"
                                                className="input"
                                                value={item}
                                                onChange={(e) => updateFeature('maintenance_features', index, e.target.value)}
                                                placeholder="Ex: Manutenção contínua"
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeature('maintenance_features', index)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0 var(--space-3)' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addFeature('maintenance_features')}
                                        className="btn btn-secondary"
                                        style={{ marginTop: 'var(--space-2)' }}
                                    >
                                        + Adicionar item
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Custos Operacionais - OpenAI */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>⚡ Custos Operacionais (OpenAI)</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                            Custos de tokens pagos pelo cliente
                        </p>

                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Custo Médio por Conversa (R$)</label>
                                <input
                                    type="number"
                                    name="cost_per_conversation"
                                    value={formData.cost_per_conversation}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: 0.15"
                                    step="0.0001"
                                />
                                <small className={styles.hint}>Custo médio de tokens por conversa. Cálculo: leads × custo/conversa</small>
                            </div>

                            <div className="form-group">
                                <label className="label">Custo Mensal Estimado (R$)</label>
                                <input
                                    type="number"
                                    name="estimated_monthly_cost"
                                    value={formData.estimated_monthly_cost}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: 50.00"
                                    step="0.01"
                                />
                                <small className={styles.hint}>Estimativa calculada com base no volume de leads e custo por conversa</small>
                            </div>
                        </div>
                    </div>

                    {/* Visual & Diagnóstico */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>🎨 Personalização & Diagnóstico</h3>

                        <div className="form-group">
                            <label className="label">Cor Principal</label>
                            <div className={styles.colorPicker}>
                                <input type="color" name="primary_color" value={formData.primary_color} onChange={handleChange} className={styles.colorInput} />
                                <span>{formData.primary_color}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Gargalos Encontrados</label>
                            <div className={styles.benefitsGrid}>
                                {[
                                    'Perde vendas por demora no atendimento',
                                    'Atendimento limitado ao horário comercial',
                                    'Nenhum follow-up com leads que sumiram',
                                    'Investe em anúncios mas não tem comercial preparado',
                                    'Atendimento manual sobrecarregado',
                                    'Perde tempo com lead desqualificado',
                                    'Depende 100% do atendimento humano',
                                    'Más experiências com chatbot',
                                ].map(challenge => (
                                    <label key={challenge} className={`${styles.benefitCard} ${formData.challenges.includes(challenge) ? styles.selected : ''}`}>
                                        <input type="checkbox" checked={formData.challenges.includes(challenge)} onChange={() => toggleChallenge(challenge)} />
                                        <span className={styles.benefitLabel}>{challenge}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="label">Análise do Diagnóstico (Opcional)</label>
                            <textarea
                                name="diagnosis_text"
                                value={formData.diagnosis_text}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ex: Identificamos que por falta de atendimento na hora que o cliente entra em contato..."
                                style={{ minHeight: '100px', resize: 'vertical' }}
                            />
                            <small className={styles.hint}>Texto que aparecerá no slide de diagnóstico para complementar os gargalos.</small>
                        </div>
                    </div>

                    {/* Comparativo Com IA vs Sem IA */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>🆚 Comparativo</h3>

                        <div className="form-group">
                            <label className="label">Com Agente de IA</label>
                            {formData.comparison_with_ai.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        value={item}
                                        onChange={(e) => updateComparisonItem('comparison_with_ai', index, e.target.value)}
                                        placeholder="Ex: Responde em segundos"
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" onClick={() => removeComparisonItem('comparison_with_ai', index)} className="btn btn-secondary" style={{ padding: '0 var(--space-3)' }}>✕</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addComparisonItem('comparison_with_ai')} className="btn btn-secondary">+ Adicionar item</button>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="label">Sem Agente de IA</label>
                            {formData.comparison_without_ai.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        value={item}
                                        onChange={(e) => updateComparisonItem('comparison_without_ai', index, e.target.value)}
                                        placeholder="Ex: Demora 1h ou mais"
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" onClick={() => removeComparisonItem('comparison_without_ai', index)} className="btn btn-secondary" style={{ padding: '0 var(--space-3)' }}>✕</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addComparisonItem('comparison_without_ai')} className="btn btn-secondary">+ Adicionar item</button>
                        </div>
                    </div>

                    {/* Dados de Mercado */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📊 Dados de Mercado</h3>
                        {formData.market_stats.map((stat, index) => (
                            <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={stat.text}
                                    onChange={(e) => updateMarketStat(index, 'text', e.target.value)}
                                    placeholder="Texto normal..."
                                    style={{ flex: 2 }}
                                />
                                <input
                                    type="text"
                                    className="input"
                                    value={stat.highlight}
                                    onChange={(e) => updateMarketStat(index, 'highlight', e.target.value)}
                                    placeholder="Destaque verde"
                                    style={{ flex: 1, color: 'var(--brand-accent)' }}
                                />
                                <button type="button" onClick={() => removeMarketStat(index)} className="btn btn-secondary" style={{ padding: '0 var(--space-3)' }}>✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addMarketStat()} className="btn btn-secondary">+ Adicionar estatística</button>
                    </div>

                    {/* Cronograma de Entrega */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📅 Cronograma de Entrega</h3>
                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Análise (dias)</label>
                                <input type="number" name="roadmap_analysis_days" value={formData.roadmap_analysis_days} onChange={handleChange} className="input" min="1" />
                            </div>
                            <div className="form-group">
                                <label className="label">Setup (dias)</label>
                                <input type="number" name="roadmap_development_days" value={formData.roadmap_development_days} onChange={handleChange} className="input" min="1" />
                            </div>
                        </div>
                        <div style={{ padding: 'var(--space-4)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                            <span>⏱️ Prazo Total: </span>
                            <strong>
                                {(parseInt(formData.roadmap_analysis_days) || 0) +
                                    (parseInt(formData.roadmap_approval_days) || 0) +
                                    (parseInt(formData.roadmap_development_days) || 0) +
                                    (parseInt(formData.roadmap_testing_days) || 0)} dias
                            </strong>
                        </div>
                    </div>
                </section>

                <div className={styles.actions}>
                    <Link href="/admin" className="btn btn-secondary">Cancelar</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? 'Salvando...' : '✓ Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
