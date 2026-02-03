'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, generateSlug } from '@/lib/supabase';
import styles from './new.module.css';

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

export default function NewProposalPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        // Cliente
        client_name: '',
        company_name: '',
        industry: '',
        funnel_type: 'simple',

        // Dados atuais
        leads_received: '',
        leads_responded: '',
        leads_scheduled: '',
        leads_showed_up: '',
        leads_converted: '',
        average_ticket: '',
        ltv: '',

        // Projeções
        projected_response_rate: '95',
        projected_conversion_rate: '',
        projected_show_rate: '80',

        // Preço Implementação
        price_total: '',
        price_upfront: '',
        installments: '1',
        implementation_payment_method: 'pix_cartao',
        implementation_features: [
            'Configuração Total',
            'Treinamento da IA',
            'Garantia de 30 dias',
        ],

        // Manutenção
        has_maintenance: false,
        maintenance_price: '',
        maintenance_description: 'Suporte técnico, ajustes de fluxo, pequenas melhorias e atualizações mensais',
        maintenance_features: [
            'Manutenção contínua',
            'Ajustes ilimitados',
            'Relatórios mensais',
        ],

        // Custos Operacionais (OpenAI)
        cost_per_conversation: '',
        estimated_monthly_cost: '',
        maintenance_payment_method: 'pix_cartao',

        // Cronograma de Entrega
        roadmap_analysis_days: '7',
        roadmap_approval_days: '7',
        roadmap_development_days: '21',
        roadmap_testing_days: '14',

        // Visual
        primary_color: '#BFFF00',
        benefits: ['24/7', 'instant_response', 'lead_qualification', 'no_absences'],

        // Desafios do Cliente
        challenges: [],

        // Comparativo Com IA vs Sem IA
        comparison_with_ai: [
            'Responde em segundos (24/7/365)',
            'Faz follow-up automático',
            'Atende vários leads ao mesmo tempo',
            'Usa linguagem humanizada e personalizada',
            'ROI de 3,5x sobre o investimento',
        ],
        comparison_without_ai: [
            'Demora de 1h ou mais',
            'Sem follow-up ou esquecido',
            'Limitado à capacidade da equipe',
            'Atendimento inconsistente',
            'Alto custo por lead perdido',
        ],

        // Dados de Mercado
        market_stats: [
            { text: 'Responder em até 1 minuto pode gerar até', highlight: '391% mais vendas' },
            { text: 'A cada 5 minutos sem resposta, suas chances de fechar', highlight: 'caem em 80%' },
            { text: 'Empresas que usam IA no atendimento', highlight: 'vendem até 3x mais' },
            { text: 'Follow-up automatizado aumenta em', highlight: '47% as conversões' },
            { text: 'Empresas com IA no atendimento', highlight: 'crescem 2x mais rápido' },
        ],
        diagnosis_text: '',
    });

    function handleChange(e) {
        const { name, value, type } = e.target;

        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: type === 'number' ? value : value,
            };

            // Cálculo automático do custo mensal estimado
            if (name === 'leads_received' || name === 'cost_per_conversation') {
                const leads = name === 'leads_received' ? (parseFloat(value) || 0) : (parseFloat(prev.leads_received) || 0);
                const costPerConv = name === 'cost_per_conversation' ? (parseFloat(value) || 0) : (parseFloat(prev.cost_per_conversation) || 0);
                newState.estimated_monthly_cost = (leads * costPerConv).toFixed(2);
            }

            return newState;
        });
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

    // Comparison helpers
    function addComparisonItem(type) {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], ''],
        }));
    }

    function updateComparisonItem(type, index, value) {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].map((item, i) => i === index ? value : item),
        }));
    }

    function removeComparisonItem(type, index) {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index),
        }));
    }

    // Market stats helpers
    function addMarketStat() {
        setFormData(prev => ({
            ...prev,
            market_stats: [...prev.market_stats, { text: '', highlight: '' }],
        }));
    }

    function updateMarketStat(index, field, value) {
        setFormData(prev => ({
            ...prev,
            market_stats: prev.market_stats.map((stat, i) =>
                i === index ? { ...stat, [field]: value } : stat
            ),
        }));
    }

    function removeMarketStat(index) {
        setFormData(prev => ({
            ...prev,
            market_stats: prev.market_stats.filter((_, i) => i !== index),
        }));
    }

    // Funções para Implementation/Maintenance Features
    function updateFeature(field, index, value) {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item),
        }));
    }

    function addFeature(field) {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ''],
        }));
    }

    function removeFeature(field, index) {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const slug = generateSlug();

        const proposalData = {
            slug,
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
            maintenance_features: formData.has_maintenance ? formData.maintenance_features.filter(f => f.trim() !== '') : [],
            maintenance_payment_method: formData.has_maintenance ? formData.maintenance_payment_method : null,
            implementation_features: formData.implementation_features.filter(f => f.trim() !== ''),
            roadmap_analysis_days: parseInt(formData.roadmap_analysis_days) || 7,
            roadmap_approval_days: parseInt(formData.roadmap_approval_days) || 7,
            roadmap_development_days: parseInt(formData.roadmap_development_days) || 21,
            roadmap_testing_days: parseInt(formData.roadmap_testing_days) || 14,
            roadmap_total_days: (parseInt(formData.roadmap_analysis_days) || 7) +
                (parseInt(formData.roadmap_approval_days) || 7) +
                (parseInt(formData.roadmap_development_days) || 21) +
                (parseInt(formData.roadmap_testing_days) || 14),
            primary_color: formData.primary_color,
            benefits: formData.benefits,
            challenges: formData.challenges,
            comparison_with_ai: formData.comparison_with_ai.filter(item => item.trim() !== ''),
            comparison_without_ai: formData.comparison_without_ai.filter(item => item.trim() !== ''),
            market_stats: formData.market_stats.filter(stat => stat.text.trim() !== '' || (stat.highlight && stat.highlight.trim() !== '')),
            cost_per_conversation: formData.cost_per_conversation ? parseFloat(formData.cost_per_conversation) : null,
            estimated_monthly_cost: formData.estimated_monthly_cost ? parseFloat(formData.estimated_monthly_cost) : null,
            diagnosis_text: formData.diagnosis_text,
            status: 'draft',
        };

        const { data, error } = await supabase
            .from('proposals')
            .insert([proposalData])
            .select()
            .single();

        if (error) {
            console.error('Error creating proposal:', error);
            alert('Erro ao criar proposta: ' + error.message);
            setLoading(false);
            return;
        }

        router.push('/admin');
    }

    function nextStep() {
        if (step < 4) setStep(step + 1);
    }

    function prevStep() {
        if (step > 1) setStep(step - 1);
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin" className={styles.backLink}>
                    ← Voltar
                </Link>
                <h1>Nova Proposta</h1>
            </header>

            <div className={styles.progress}>
                {[1, 2, 3, 4].map(s => (
                    <div
                        key={s}
                        className={`${styles.progressStep} ${s === step ? styles.active : ''} ${s < step ? styles.completed : ''}`}
                    >
                        <span className={styles.stepNumber}>{s}</span>
                        <span className={styles.stepLabel}>
                            {s === 1 && 'Cliente'}
                            {s === 2 && 'Dados Atuais'}
                            {s === 3 && 'Projeções'}
                            {s === 4 && 'Investimento'}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Step 1: Cliente */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2>Dados do Cliente</h2>

                        <div className="form-group">
                            <label className="label">Nome do Contato *</label>
                            <input
                                type="text"
                                name="client_name"
                                value={formData.client_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ex: João Silva"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Nome da Empresa *</label>
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ex: Clínica Dr. Silva"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Segmento</label>
                            <select
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                className="select"
                            >
                                <option value="">Selecione...</option>
                                {INDUSTRIES.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">Tipo de Funil *</label>
                            <div className={styles.radioGroup}>
                                <label className={`${styles.radioCard} ${formData.funnel_type === 'simple' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="funnel_type"
                                        value="simple"
                                        checked={formData.funnel_type === 'simple'}
                                        onChange={handleChange}
                                    />
                                    <span className={styles.radioIcon}>🎯</span>
                                    <span className={styles.radioTitle}>Vendas Diretas</span>
                                    <span className={styles.radioDesc}>Lead → Resposta → Venda</span>
                                </label>

                                <label className={`${styles.radioCard} ${formData.funnel_type === 'scheduling' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="funnel_type"
                                        value="scheduling"
                                        checked={formData.funnel_type === 'scheduling'}
                                        onChange={handleChange}
                                    />
                                    <span className={styles.radioIcon}>📅</span>
                                    <span className={styles.radioTitle}>Com Agendamento</span>
                                    <span className={styles.radioDesc}>Lead → Agendamento → Comparecimento → Venda</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Dados Atuais */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <h2>Situação Atual</h2>
                        <p className={styles.stepDesc}>Dados do atendimento atual do cliente</p>

                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Leads Recebidos/Mês *</label>
                                <input
                                    type="number"
                                    name="leads_received"
                                    value={formData.leads_received}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: 100"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Leads Respondidos *</label>
                                <input
                                    type="number"
                                    name="leads_responded"
                                    value={formData.leads_responded}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: 60"
                                    required
                                />
                            </div>
                        </div>

                        {formData.funnel_type === 'scheduling' && (
                            <div className={styles.gridTwo}>
                                <div className="form-group">
                                    <label className="label">Agendamentos Realizados</label>
                                    <input
                                        type="number"
                                        name="leads_scheduled"
                                        value={formData.leads_scheduled}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Ex: 40"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Compareceram</label>
                                    <input
                                        type="number"
                                        name="leads_showed_up"
                                        value={formData.leads_showed_up}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Ex: 30"
                                    />
                                </div>
                            </div>
                        )}

                        <div className={styles.gridTwo}>
                            <div className="form-group">
                                <label className="label">Conversões/Vendas *</label>
                                <input
                                    type="number"
                                    name="leads_converted"
                                    value={formData.leads_converted}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: 10"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Ticket Médio (R$) *</label>
                                <input
                                    type="number"
                                    name="average_ticket"
                                    value={formData.average_ticket}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: 500"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">LTV - Valor Vitalício (R$) <span className={styles.optional}>Opcional</span></label>
                            <input
                                type="number"
                                name="ltv"
                                value={formData.ltv}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ex: 2000 (se cliente compra recorrente)"
                                step="0.01"
                            />
                        </div>


                    </div>
                )}

                {/* Step 3: Projeções */}
                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h2>Projeções com IA</h2>
                        <p className={styles.stepDesc}>Defina as taxas esperadas com a solução</p>

                        <div className="form-group">
                            <label className="label">Taxa de Resposta Projetada (%)</label>
                            <input
                                type="number"
                                name="projected_response_rate"
                                value={formData.projected_response_rate}
                                onChange={handleChange}
                                className="input"
                                placeholder="95"
                                min="0"
                                max="100"
                            />
                            <small className={styles.hint}>IA responde em segundos, 24/7. Padrão: 95%</small>
                        </div>

                        <div className="form-group">
                            <label className="label">Taxa de Conversão Projetada (%) *</label>
                            <input
                                type="number"
                                name="projected_conversion_rate"
                                value={formData.projected_conversion_rate}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ex: 20"
                                min="0"
                                max="100"
                                required
                            />
                            <small className={styles.hint}>
                                {formData.funnel_type === 'scheduling'
                                    ? 'Taxa de agendamento dos leads respondidos'
                                    : 'Taxa de conversão dos leads respondidos'}
                            </small>
                        </div>

                        {formData.funnel_type === 'scheduling' && (
                            <div className="form-group">
                                <label className="label">Taxa de Comparecimento Projetada (%)</label>
                                <input
                                    type="number"
                                    name="projected_show_rate"
                                    value={formData.projected_show_rate}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="80"
                                    min="0"
                                    max="100"
                                />
                                <small className={styles.hint}>Com lembretes automáticos. Padrão: 80%</small>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Investimento */}
                {step === 4 && (
                    <div className={styles.stepContent}>
                        <h2>Investimento</h2>

                        {/* Implementação */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>💼 Implementação</h3>

                            <div className={styles.gridTwo}>
                                <div className="form-group">
                                    <label className="label">Valor Total (R$) *</label>
                                    <input
                                        type="number"
                                        name="price_total"
                                        value={formData.price_total}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Ex: 3000"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Entrada (R$) <span className={styles.optional}>Opcional</span></label>
                                    <input
                                        type="number"
                                        name="price_upfront"
                                        value={formData.price_upfront}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Ex: 1000"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className={styles.gridTwo}>
                                <div className="form-group">
                                    <label className="label">Parcelas do Restante</label>
                                    <select
                                        name="installments"
                                        value={formData.installments}
                                        onChange={handleChange}
                                        className="select"
                                    >
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
                                    <select
                                        name="implementation_payment_method"
                                        value={formData.implementation_payment_method}
                                        onChange={handleChange}
                                        className="select"
                                    >
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
                                            <label className="label">Valor Mensal (R$) *</label>
                                            <input
                                                type="number"
                                                name="maintenance_price"
                                                value={formData.maintenance_price}
                                                onChange={handleChange}
                                                className="input"
                                                placeholder="Ex: 297"
                                                step="0.01"
                                                required={formData.has_maintenance}
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

                        {/* Cronograma de Entrega */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>📅 Cronograma de Entrega</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                                Defina o prazo em dias para cada fase do projeto
                            </p>

                            <div className={styles.gridTwo}>
                                <div className="form-group">
                                    <label className="label">Análise de Processos (dias)</label>
                                    <input
                                        type="number"
                                        name="roadmap_analysis_days"
                                        value={formData.roadmap_analysis_days}
                                        onChange={handleChange}
                                        className="input"
                                        min="1"
                                        max="30"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Aprovação dos Agentes (dias)</label>
                                    <input
                                        type="number"
                                        name="roadmap_approval_days"
                                        value={formData.roadmap_approval_days}
                                        onChange={handleChange}
                                        className="input"
                                        min="1"
                                        max="30"
                                    />
                                </div>
                            </div>

                            <div className={styles.gridTwo}>
                                <div className="form-group">
                                    <label className="label">Desenvolvimento IA (dias)</label>
                                    <input
                                        type="number"
                                        name="roadmap_development_days"
                                        value={formData.roadmap_development_days}
                                        onChange={handleChange}
                                        className="input"
                                        min="1"
                                        max="60"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Testes e Implementação (dias)</label>
                                    <input
                                        type="number"
                                        name="roadmap_testing_days"
                                        value={formData.roadmap_testing_days}
                                        onChange={handleChange}
                                        className="input"
                                        min="1"
                                        max="30"
                                    />
                                </div>
                            </div>

                            <div className={styles.roadmapSummary}>
                                <span>⏱️ Prazo Total Estimado: </span>
                                <strong>
                                    {(parseInt(formData.roadmap_analysis_days) || 0) +
                                        (parseInt(formData.roadmap_approval_days) || 0) +
                                        (parseInt(formData.roadmap_development_days) || 0) +
                                        (parseInt(formData.roadmap_testing_days) || 0)} dias
                                </strong>
                            </div>
                        </div>

                        {/* Visual */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>🎨 Personalização Visual</h3>

                            <div className="form-group">
                                <label className="label">Cor Principal</label>
                                <div className={styles.colorPicker}>
                                    <input
                                        type="color"
                                        name="primary_color"
                                        value={formData.primary_color}
                                        onChange={handleChange}
                                        className={styles.colorInput}
                                    />
                                    <span>{formData.primary_color}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="label">Benefícios para Exibir</label>
                                <div className={styles.benefitsGrid}>
                                    {BENEFITS_OPTIONS.map(benefit => (
                                        <label
                                            key={benefit.id}
                                            className={`${styles.benefitCard} ${formData.benefits.includes(benefit.id) ? styles.selected : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.benefits.includes(benefit.id)}
                                                onChange={() => toggleBenefit(benefit.id)}
                                            />
                                            <span className={styles.benefitIcon}>{benefit.icon}</span>
                                            <span className={styles.benefitLabel}>{benefit.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="label">Gargalos Encontrados (opcional)</label>
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
                                                placeholder="Digite o gargalo personalizado..."
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

                            <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
                                <label className="label">Análise do Diagnóstico (Opcional)</label>
                                <textarea
                                    name="diagnosis_text"
                                    value={formData.diagnosis_text}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: Identificamos que por falta de atendimento na hora que o cliente entra em contato..."
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                />
                                <small className={styles.hint}>Esta análise aparecerá no slide de diagnóstico, ao lado dos gargalos encontrados.</small>
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
                                            style={{ flex: 1 }}
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
                    </div>
                )}

                <div className={styles.actions}>
                    {step > 1 && (
                        <button type="button" onClick={prevStep} className="btn btn-secondary">
                            ← Voltar
                        </button>
                    )}

                    {step < 4 ? (
                        <button type="button" onClick={nextStep} className="btn btn-primary">
                            Continuar →
                        </button>
                    ) : (
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Criando...' : '✓ Criar Proposta'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
