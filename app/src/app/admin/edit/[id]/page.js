'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from '../../new/new.module.css';

const BENEFITS_OPTIONS = [
    { id: '24/7', label: 'Atendimento 24/7', icon: '🕐' },
    { id: 'no_absences', label: 'Sem faltas ou atrasos', icon: '✅' },
    { id: 'instant_response', label: 'Resposta instantânea', icon: '⚡' },
    { id: 'lead_qualification', label: 'Qualificação automática', icon: '🎯' },
    { id: 'scalability', label: 'Escalabilidade ilimitada', icon: '📈' },
    { id: 'consistency', label: 'Padrão de atendimento', icon: '🎖️' },
    { id: 'data_collection', label: 'Coleta de dados', icon: '📊' },
    { id: 'integration', label: 'Integração com CRM', icon: '🔗' },
    { id: 'follow_up', label: 'Follow-up Automático', icon: '🔄' },
];

const INDUSTRIES = [
    'Clínica/Saúde',
    'E-commerce',
    'Imobiliária',
    'Advocacia',
    'Consultoria',
    'Educação',
    'Serviços',
    'Varejo',
    'Outro',
];

export default function EditProposalPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        client_name: '',
        company_name: '',
        industry: '',
        funnel_type: 'simple',
        leads_received: '',
        leads_responded: '',
        leads_scheduled: '',
        leads_showed_up: '',
        leads_converted: '',
        average_ticket: '',
        ltv: '',
        projected_response_rate: '95',
        projected_conversion_rate: '',
        projected_show_rate: '80',
        price_total: '',
        price_upfront: '',
        installments: '1',
        implementation_payment_method: 'pix_cartao',
        has_maintenance: false,
        maintenance_price: '',
        maintenance_description: '',
        maintenance_payment_method: 'pix_cartao',
        // Roadmap
        roadmap_analysis_days: '7',
        roadmap_approval_days: '7',
        roadmap_development_days: '21',
        roadmap_testing_days: '14',
        // Visual
        primary_color: '#BFFF00',
        hero_media: '',
        benefits: [],
        challenges: [],
        // Comparison
        comparison_with_ai: [],
        comparison_without_ai: [],
        market_stats: [],
        // Costs
        cost_per_conversation: '',
        estimated_monthly_cost: '',
        status: 'draft',
    });

    useEffect(() => {
        fetchProposal();
    }, [id]);

    async function fetchProposal() {
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            alert('Proposta não encontrada');
            router.push('/admin');
            return;
        }

        setFormData({
            client_name: data.client_name || '',
            company_name: data.company_name || '',
            industry: data.industry || '',
            funnel_type: data.funnel_type || 'simple',
            leads_received: data.leads_received?.toString() || '',
            leads_responded: data.leads_responded?.toString() || '',
            leads_scheduled: data.leads_scheduled?.toString() || '',
            leads_showed_up: data.leads_showed_up?.toString() || '',
            leads_converted: data.leads_converted?.toString() || '',
            average_ticket: data.average_ticket?.toString() || '',
            ltv: data.ltv?.toString() || '',
            projected_response_rate: data.projected_response_rate?.toString() || '95',
            projected_conversion_rate: data.projected_conversion_rate?.toString() || '',
            projected_show_rate: data.projected_show_rate?.toString() || '80',
            price_total: data.price_total?.toString() || '',
            price_upfront: data.price_upfront?.toString() || '',
            installments: data.installments?.toString() || '1',
            implementation_payment_method: data.implementation_payment_method || 'pix_cartao',
            has_maintenance: data.has_maintenance || false,
            maintenance_price: data.maintenance_price?.toString() || '',
            maintenance_description: data.maintenance_description || '',
            maintenance_payment_method: data.maintenance_payment_method || 'pix_cartao',
            // Roadmap
            roadmap_analysis_days: data.roadmap_analysis_days?.toString() || '7',
            roadmap_approval_days: data.roadmap_approval_days?.toString() || '7',
            roadmap_development_days: data.roadmap_development_days?.toString() || '21',
            roadmap_testing_days: data.roadmap_testing_days?.toString() || '14',
            // Visual
            primary_color: data.primary_color || '#BFFF00',
            hero_media: data.hero_media || '',
            benefits: data.benefits || [],
            challenges: data.challenges || [],
            // Comparison
            comparison_with_ai: data.comparison_with_ai || [],
            comparison_without_ai: data.comparison_without_ai || [],
            market_stats: data.market_stats || [],
            // Costs
            cost_per_conversation: data.cost_per_conversation?.toString() || '',
            estimated_monthly_cost: data.estimated_monthly_cost?.toString() || '',
            status: data.status || 'draft',
        });

        setLoading(false);
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    function toggleBenefit(benefitId) {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.includes(benefitId)
                ? prev.benefits.filter(b => b !== benefitId)
                : [...prev.benefits, benefitId],
        }));
    }

    function toggleChallenge(challenge) {
        setFormData(prev => ({
            ...prev,
            challenges: prev.challenges.includes(challenge)
                ? prev.challenges.filter(c => c !== challenge)
                : [...prev.challenges, challenge],
        }));
    }

    // Funções para Comparativo Com/Sem IA
    function updateComparisonItem(field, index, value) {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item),
        }));
    }

    function addComparisonItem(field) {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ''],
        }));
    }

    function removeComparisonItem(field, index) {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    }

    // Funções para Market Stats
    function updateMarketStat(index, field, value) {
        setFormData(prev => ({
            ...prev,
            market_stats: prev.market_stats.map((stat, i) =>
                i === index ? { ...stat, [field]: value } : stat
            ),
        }));
    }

    function addMarketStat() {
        setFormData(prev => ({
            ...prev,
            market_stats: [...prev.market_stats, { text: '', highlight: '' }],
        }));
    }

    function removeMarketStat(index) {
        setFormData(prev => ({
            ...prev,
            market_stats: prev.market_stats.filter((_, i) => i !== index),
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        const proposalData = {
            client_name: formData.client_name,
            company_name: formData.company_name,
            industry: formData.industry,
            funnel_type: formData.funnel_type,
            leads_received: parseInt(formData.leads_received) || 0,
            leads_responded: parseInt(formData.leads_responded) || 0,
            leads_scheduled: formData.funnel_type === 'scheduling' ? parseInt(formData.leads_scheduled) || null : null,
            leads_showed_up: formData.funnel_type === 'scheduling' ? parseInt(formData.leads_showed_up) || null : null,
            leads_converted: parseInt(formData.leads_converted) || 0,
            average_ticket: parseFloat(formData.average_ticket) || 0,
            ltv: formData.ltv ? parseFloat(formData.ltv) : null,
            projected_response_rate: parseFloat(formData.projected_response_rate) || 95,
            projected_conversion_rate: parseFloat(formData.projected_conversion_rate) || null,
            projected_show_rate: formData.funnel_type === 'scheduling' ? parseFloat(formData.projected_show_rate) || 80 : null,
            price_total: parseFloat(formData.price_total) || 0,
            price_upfront: formData.price_upfront ? parseFloat(formData.price_upfront) : null,
            installments: parseInt(formData.installments) || 1,
            implementation_payment_method: formData.implementation_payment_method,
            has_maintenance: formData.has_maintenance,
            maintenance_price: formData.has_maintenance ? parseFloat(formData.maintenance_price) || 0 : null,
            maintenance_description: formData.has_maintenance ? formData.maintenance_description : null,
            maintenance_payment_method: formData.has_maintenance ? formData.maintenance_payment_method : null,
            // Roadmap
            roadmap_analysis_days: parseInt(formData.roadmap_analysis_days) || 7,
            roadmap_approval_days: parseInt(formData.roadmap_approval_days) || 7,
            roadmap_development_days: parseInt(formData.roadmap_development_days) || 21,
            roadmap_testing_days: parseInt(formData.roadmap_testing_days) || 14,
            roadmap_total_days: (parseInt(formData.roadmap_analysis_days) || 7) +
                (parseInt(formData.roadmap_approval_days) || 7) +
                (parseInt(formData.roadmap_development_days) || 21) +
                (parseInt(formData.roadmap_testing_days) || 14),
            // Visual
            primary_color: formData.primary_color,
            hero_media: formData.hero_media || null,
            benefits: formData.benefits,
            challenges: formData.challenges,
            // Comparison
            comparison_with_ai: formData.comparison_with_ai.filter(item => item.trim() !== ''),
            comparison_without_ai: formData.comparison_without_ai.filter(item => item.trim() !== ''),
            market_stats: formData.market_stats.filter(stat => stat.text?.trim() !== '' || stat.highlight?.trim() !== ''),
            // Costs
            cost_per_conversation: formData.cost_per_conversation ? parseFloat(formData.cost_per_conversation) : null,
            estimated_monthly_cost: formData.estimated_monthly_cost ? parseFloat(formData.estimated_monthly_cost) : null,
            status: formData.status,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('proposals')
            .update(proposalData)
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
                                <div className="form-group">
                                    <label className="label">O que está incluso</label>
                                    <textarea
                                        name="maintenance_description"
                                        value={formData.maintenance_description}
                                        onChange={handleChange}
                                        className="input"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Custos Operacionais */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>⚡ Custos Operacionais (OpenAI)</h3>
                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Custo por Conversa (R$)</label>
                                <input
                                    type="number"
                                    name="cost_per_conversation"
                                    value={formData.cost_per_conversation}
                                    onChange={handleChange}
                                    className="input"
                                    step="0.0001"
                                    placeholder="Ex: 0.15"
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Custo Mensal Estimado (R$)</label>
                                <input
                                    type="number"
                                    name="estimated_monthly_cost"
                                    value={formData.estimated_monthly_cost}
                                    onChange={handleChange}
                                    className="input"
                                    step="0.01"
                                    placeholder="Ex: 50.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visual */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>🎨 Personalização Visual</h3>

                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Cor Principal</label>
                                <div className={styles.colorPicker}>
                                    <input type="color" name="primary_color" value={formData.primary_color} onChange={handleChange} className={styles.colorInput} />
                                    <span>{formData.primary_color}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Mídia de Fundo (Hero)</label>
                                <input
                                    type="text"
                                    name="hero_media"
                                    value={formData.hero_media}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="URL da imagem ou vídeo de fundo"
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                                    URL de imagem (.jpg, .png, .webp) ou vídeo (.mp4, .mov, .webm)
                                </small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Benefícios</label>
                            <div className={styles.benefitsGrid}>
                                {BENEFITS_OPTIONS.map(benefit => (
                                    <label key={benefit.id} className={`${styles.benefitCard} ${formData.benefits.includes(benefit.id) ? styles.selected : ''}`}>
                                        <input type="checkbox" checked={formData.benefits.includes(benefit.id)} onChange={() => toggleBenefit(benefit.id)} />
                                        <span className={styles.benefitIcon}>{benefit.icon}</span>
                                        <span className={styles.benefitLabel}>{benefit.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Gargalos Encontrados</label>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                Selecione os desafios identificados no cliente ou adicione personalizados
                            </p>
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
                                    <label
                                        key={challenge}
                                        className={`${styles.benefitCard} ${formData.challenges.includes(challenge) ? styles.selected : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.challenges.includes(challenge)}
                                            onChange={() => toggleChallenge(challenge)}
                                        />
                                        <span className={styles.benefitLabel}>{challenge}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Gargalos customizados */}
                            <div style={{ marginTop: 'var(--space-4)' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                                    Gargalos personalizados:
                                </p>
                                {formData.challenges.filter(c => ![
                                    'Perde vendas por demora no atendimento',
                                    'Atendimento limitado ao horário comercial',
                                    'Nenhum follow-up com leads que sumiram',
                                    'Investe em anúncios mas não tem comercial preparado',
                                    'Atendimento manual sobrecarregado',
                                    'Perde tempo com lead desqualificado',
                                    'Depende 100% do atendimento humano',
                                    'Más experiências com chatbot',
                                ].includes(c)).map((challenge, index) => (
                                    <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                        <input
                                            type="text"
                                            className="input"
                                            value={challenge}
                                            onChange={(e) => {
                                                const customChallenges = formData.challenges.filter(c => ![
                                                    'Perde vendas por demora no atendimento',
                                                    'Atendimento limitado ao horário comercial',
                                                    'Nenhum follow-up com leads que sumiram',
                                                    'Investe em anúncios mas não tem comercial preparado',
                                                    'Atendimento manual sobrecarregado',
                                                    'Perde tempo com lead desqualificado',
                                                    'Depende 100% do atendimento humano',
                                                    'Más experiências com chatbot',
                                                ].includes(c));
                                                const presetChallenges = formData.challenges.filter(c => [
                                                    'Perde vendas por demora no atendimento',
                                                    'Atendimento limitado ao horário comercial',
                                                    'Nenhum follow-up com leads que sumiram',
                                                    'Investe em anúncios mas não tem comercial preparado',
                                                    'Atendimento manual sobrecarregado',
                                                    'Perde tempo com lead desqualificado',
                                                    'Depende 100% do atendimento humano',
                                                    'Más experiências com chatbot',
                                                ].includes(c));
                                                customChallenges[index] = e.target.value;
                                                setFormData(prev => ({ ...prev, challenges: [...presetChallenges, ...customChallenges] }));
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    challenges: prev.challenges.filter(c => c !== challenge)
                                                }));
                                            }}
                                            className="btn btn-secondary"
                                            style={{ padding: '8px 12px' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, challenges: [...prev.challenges, ''] }))}
                                    className="btn btn-secondary"
                                    style={{ marginTop: 'var(--space-2)' }}
                                >
                                    + Adicionar gargalo personalizado
                                </button>
                            </div>
                        </div>

                        {/* Comparativo Com IA vs Sem IA */}
                        <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
                            <label className="label">Comparativo: Com Agente de IA</label>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                Liste os benefícios de ter IA (aparece no lado verde)
                            </p>
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
                                    <button
                                        type="button"
                                        onClick={() => removeComparisonItem('comparison_with_ai', index)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0 var(--space-3)' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addComparisonItem('comparison_with_ai')}
                                className="btn btn-secondary"
                                style={{ marginTop: 'var(--space-2)' }}
                            >
                                + Adicionar item
                            </button>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="label">Comparativo: Sem Agente de IA</label>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                Liste os problemas de não ter IA (aparece no lado vermelho)
                            </p>
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
                                    <button
                                        type="button"
                                        onClick={() => removeComparisonItem('comparison_without_ai', index)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0 var(--space-3)' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addComparisonItem('comparison_without_ai')}
                                className="btn btn-secondary"
                                style={{ marginTop: 'var(--space-2)' }}
                            >
                                + Adicionar item
                            </button>
                        </div>

                        {/* Dados de Mercado */}
                        <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
                            <label className="label">Dados de Mercado</label>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                Estatísticas para convencer o cliente (texto + destaque em verde)
                            </p>
                            {formData.market_stats.map((stat, index) => (
                                <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        value={stat.text || ''}
                                        onChange={(e) => updateMarketStat(index, 'text', e.target.value)}
                                        placeholder="Ex: Responder em até 1 minuto pode gerar até"
                                        style={{ flex: 2 }}
                                    />
                                    <input
                                        type="text"
                                        className="input"
                                        value={stat.highlight || ''}
                                        onChange={(e) => updateMarketStat(index, 'highlight', e.target.value)}
                                        placeholder="391% mais vendas"
                                        style={{ flex: 1, color: 'var(--brand-accent)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMarketStat(index)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0 var(--space-3)' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addMarketStat()}
                                className="btn btn-secondary"
                                style={{ marginTop: 'var(--space-2)' }}
                            >
                                + Adicionar estatística
                            </button>
                        </div>
                    </div>

                    {/* Cronograma de Entrega */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📅 Cronograma de Entrega</h3>
                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Análise de Processos (dias)</label>
                                <input type="number" name="roadmap_analysis_days" value={formData.roadmap_analysis_days} onChange={handleChange} className="input" min="1" />
                            </div>
                            <div className="form-group">
                                <label className="label">Aprovação dos Agentes (dias)</label>
                                <input type="number" name="roadmap_approval_days" value={formData.roadmap_approval_days} onChange={handleChange} className="input" min="1" />
                            </div>
                        </div>
                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Desenvolvimento IA (dias)</label>
                                <input type="number" name="roadmap_development_days" value={formData.roadmap_development_days} onChange={handleChange} className="input" min="1" />
                            </div>
                            <div className="form-group">
                                <label className="label">Testes e Implementação (dias)</label>
                                <input type="number" name="roadmap_testing_days" value={formData.roadmap_testing_days} onChange={handleChange} className="input" min="1" />
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
