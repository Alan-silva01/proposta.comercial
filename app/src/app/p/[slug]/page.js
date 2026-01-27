'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase, calculateROI } from '@/lib/supabase';
import styles from './proposal.module.css';
import funnelStyles from './funnel.module.css';
import scratchStyles from './scratch.module.css';
import confetti from 'canvas-confetti';

const BENEFITS_MAP = {
    '24/7': { label: 'Atendimento 24/7', icon: '○', desc: 'Disponibilidade total, inclusive finais de semana e feriados' },
    'no_absences': { label: 'Consistência Total', icon: '○', desc: 'Nunca falta, nunca atrasa, sempre mantém o mesmo padrão' },
    'instant_response': { label: 'Resposta em Segundos', icon: '○', desc: 'Elimina o tempo de espera e aumenta a taxa de conversão' },
    'lead_qualification': { label: 'Filtro Inteligente', icon: '○', desc: 'Qualifica leads em tempo real antes de enviar para o humano' },
    'scalability': { label: 'Escalabilidade Real', icon: '○', desc: 'Atenda milhares de leads simultaneamente sem perda de qualidade' },
    'consistency': { label: 'Padrão Executivo', icon: '○', desc: 'Garante que o script perfeito seja seguido à risca sempre' },
    'data_collection': { label: 'Inteligência de Dados', icon: '○', desc: 'Coleta e organiza dados estratégicos automaticamente' },
    'integration': { label: 'Fluxo Direto', icon: '○', desc: 'Integração perfeita com seu CRM e ferramentas atuais' },
};

const PAYMENT_METHODS = {
    'pix_cartao': 'PIX ou Cartão',
    'pix': 'PIX',
    'cartao': 'Cartão de Crédito',
    'boleto': 'Boleto',
    'todos': 'PIX, Cartão ou Boleto',
    'debito_auto': 'Débito Automático',
};

// Reveal Animation Wrapper
function RevealSection({ children, className = '', threshold = 0.1 }) {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: threshold }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return (
        <section
            ref={sectionRef}
            className={`${className} ${isVisible ? styles.revealActive : ''}`}
        >
            {children}
        </section>
    );
}

// Animated Counter Component - Casino Style (fast count up/down)
function AnimatedCounter({ value, duration = 1500, prefix = '' }) {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const lastValueRef = useRef(0);
    const animationRef = useRef(null);
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && value > 0 && !hasAnimated) {
                    setHasAnimated(true);
                    startAnimation(0, value);
                    lastValueRef.current = value;
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value, hasAnimated]);

    // Check visibility on mount with value
    useEffect(() => {
        if (!ref.current || hasAnimated || value <= 0) return;

        const rect = ref.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

        if (isVisible) {
            setHasAnimated(true);
            startAnimation(0, value);
            lastValueRef.current = value;
        }
    }, [value, hasAnimated]);

    // Re-animate when value changes (toggle conservative mode)
    useEffect(() => {
        if (hasAnimated && value !== lastValueRef.current && value > 0) {
            startAnimation(lastValueRef.current, value);
            lastValueRef.current = value;
        }
    }, [value, hasAnimated]);

    function startAnimation(from, to) {
        // Cancel any ongoing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);

            // Casino-style exponential ease-out
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(from + (to - from) * eased);
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(tick);
            } else {
                setDisplayValue(to);
            }
        }

        animationRef.current = requestAnimationFrame(tick);
    }

    const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(displayValue);

    return <span ref={ref}>{prefix}{formatted}</span>;
}

// Typewriter Effect Component
function TypewrittenText({ text, speed = 80, delay = 500 }) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let timeout;
        if (displayedText.length < text.length) {
            timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, displayedText.length + 1));
            }, displayedText.length === 0 ? delay : speed);
        } else {
            setIsComplete(true);
        }
        return () => clearTimeout(timeout);
    }, [displayedText, text, speed, delay]);

    return (
        <span className={styles.typewriterWrapper}>
            {displayedText}
            <span className={`${styles.cursor} ${isComplete ? styles.cursorHidden : ''}`}>|</span>
        </span>
    );
}


// Interactive Funnel Component
function FunnelComparison({ proposal, roi, formatCurrency, formatPercent }) {
    const [visibleToday, setVisibleToday] = useState(0);
    const [visibleAI, setVisibleAI] = useState(0);
    const [funnelState, setFunnelState] = useState('normal'); // 'normal', 'collapsing', 'destroyed'

    const isScheduling = proposal.funnel_type === 'scheduling';

    // Define layers for Today
    const layersToday = [
        { label: 'Leads', value: proposal.leads_received, metric: '100%' },
        { label: 'Respondidos', value: proposal.leads_responded, metric: formatPercent((proposal.leads_responded / proposal.leads_received) * 100) },
        ...(isScheduling ? [{ label: 'Agendados', value: proposal.leads_scheduled || 0, metric: formatPercent((proposal.leads_scheduled / proposal.leads_received) * 100) }] : []),
        { label: 'Vendas', value: proposal.leads_converted, metric: formatPercent((proposal.leads_converted / proposal.leads_received) * 100) }
    ];

    // Define layers for With AI
    const projectedResponded = Math.round(proposal.leads_received * (proposal.projected_response_rate / 100));
    const projectedScheduled = isScheduling ? Math.round(proposal.leads_received * 0.6) : 0; // Est. 60%
    const projectedSales = roi?.projectedConverted || 0;

    const layersAI = [
        { label: 'Leads', value: proposal.leads_received, metric: '100%' },
        { label: 'Respondidos', value: projectedResponded, metric: formatPercent(proposal.projected_response_rate) },
        ...(isScheduling ? [{ label: 'Agendados', value: projectedScheduled, metric: '60%' }] : []),
        { label: 'Vendas', value: projectedSales, metric: formatPercent((projectedSales / proposal.leads_received) * 100) }
    ];

    const handleTodayClick = () => {
        if (visibleToday < layersToday.length) setVisibleToday(prev => prev + 1);
    };

    const handleAIClick = () => {
        if (visibleAI < layersAI.length) setVisibleAI(prev => prev + 1);
    };

    // Trigger collapse when AI funnel is fully revealed AND user clicks
    useEffect(() => {
        if (visibleAI === layersAI.length && funnelState === 'normal') {
            const handleClick = () => {
                setFunnelState('collapsing');

                // After animation completes (Last item delay 1.5s + Duration 2s = 3.5s)
                setTimeout(() => {
                    setFunnelState('destroyed');
                }, 3500);
            };

            // Add click listener to document
            document.addEventListener('click', handleClick, { once: true });

            return () => document.removeEventListener('click', handleClick);
        }
    }, [visibleAI, layersAI.length, funnelState]);

    return (
        <RevealSection className={funnelStyles.funnelComparisonSection}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>Comparativo Visual</span>
                <h2>Funil de Conversão</h2>
                <p className={styles.sectionSubtitle}>Clique nos funis para revelar as etapas</p>
            </div>

            <div className={funnelStyles.funnelGrid}>
                {/* Column Today */}
                <div className={`${funnelStyles.funnelColumn} ${funnelStyles[funnelState]}`}>
                    <h3 className={funnelStyles.funnelTitle}>Hoje</h3>
                    {funnelState === 'destroyed' && (
                        <div className={funnelStyles.wreckageOverlay}>
                            <span className={funnelStyles.wreckageIcon}>❌</span>
                        </div>
                    )}
                    <div className={funnelStyles.funnelContainer} onClick={handleTodayClick}>
                        {layersToday.map((layer, index) => (
                            <div
                                key={index}
                                className={`${funnelStyles.funnelLayer} ${index < visibleToday ? funnelStyles.visible : ''}`}
                                style={{ zIndex: layersToday.length - index }}
                            >
                                <div className={funnelStyles.funnelShape}>
                                    <div className={funnelStyles.funnelContent}>
                                        <span className={funnelStyles.funnelValue}>{layer.value}</span>
                                        <span className={funnelStyles.funnelLabel}>{layer.label}</span>
                                    </div>
                                    <div className={funnelStyles.funnelMetric}>{layer.metric}</div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* Column With AI */}
                <div className={`${funnelStyles.funnelColumn} ${funnelStyles.ai}`}>
                    <h3 className={funnelStyles.funnelTitle}>Com IA</h3>
                    <div className={funnelStyles.funnelContainer} onClick={handleAIClick}>
                        {layersAI.map((layer, index) => (
                            <div
                                key={index}
                                className={`${funnelStyles.funnelLayer} ${index < visibleAI ? funnelStyles.visible : ''}`}
                                style={{ zIndex: layersAI.length - index }}
                            >
                                <div className={funnelStyles.funnelShape}>
                                    <div className={funnelStyles.funnelContent}>
                                        <span className={funnelStyles.funnelValue}>{layer.value}</span>
                                        <span className={funnelStyles.funnelLabel}>{layer.label}</span>
                                    </div>
                                    <div className={funnelStyles.funnelMetric}>{layer.metric}</div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </div>
        </RevealSection>
    );
}


// Scratch Card Component
function ScratchCard({ children, width = 300, height = 200, onReveal }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;

        // Set canvas size to match container
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        // Fill with silver gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#E0E0E0');
        gradient.addColorStop(0.5, '#F5F5F5');
        gradient.addColorStop(1, '#E0E0E0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add "Raspe Aqui" text directly to canvas
        ctx.fillStyle = '#999999';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("RASPE AQUI", canvas.width / 2, canvas.height / 2);

        ctx.globalCompositeOperation = 'destination-out';
    }, []);

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const scratch = (x, y) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(x, y, 35, 0, 2 * Math.PI); // Tuned brush size
        ctx.fill();

        checkReveal();
    };

    const checkReveal = () => {
        if (isRevealed) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        // Optimized counting (check every 10th pixel)
        for (let i = 3; i < pixels.length; i += 40) {
            if (pixels[i] === 0) transparentPixels++;
        }

        const totalChecked = pixels.length / 40;
        const percent = (transparentPixels / totalChecked) * 100;

        if (percent > 50) { // Harder reveal threshold (50%)
            setIsRevealed(true);
            canvas.style.transition = 'opacity 0.5s ease';
            canvas.style.opacity = '0';

            // Fire Confetti!
            const duration = 3000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 }, // Bottom Left
                    colors: ['#00C853', '#00B0FF', '#6200EA'] // Brand colors
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 }, // Bottom Right
                    colors: ['#00C853', '#00B0FF', '#6200EA']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());

            setTimeout(() => {
                if (canvas) canvas.style.display = 'none';
                if (onReveal) onReveal();
            }, 500);
        }
    };

    const handleMouseDown = (e) => {
        setIsDrawing(true);
        const { x, y } = getMousePos(e);
        scratch(x, y);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const { x, y } = getMousePos(e);
        scratch(x, y);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    return (
        <div className={`${scratchStyles.scratchCanvasContainer} ${isRevealed ? scratchStyles.revealed : ''}`} ref={containerRef}>
            <canvas
                ref={canvasRef}
                className={scratchStyles.scratchCanvas}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            />
            <div className={scratchStyles.scratchContent}>
                {children}
            </div>
        </div>
    );
}


export default function ProposalPage() {
    const { slug } = useParams();
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [conservative, setConservative] = useState(false);
    const [roi, setRoi] = useState(null);

    useEffect(() => {
        fetchProposal();
    }, [slug]);

    useEffect(() => {
        if (proposal) {
            const calculatedRoi = calculateROI(proposal, conservative);
            setRoi(calculatedRoi);
        }
    }, [proposal, conservative]);

    async function fetchProposal() {
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            console.error('Proposal not found:', error);
        } else {
            setProposal(data);

            // Mark as viewed
            if (data.status === 'sent') {
                await supabase
                    .from('proposals')
                    .update({ status: 'viewed', updated_at: new Date().toISOString() })
                    .eq('id', data.id);
            }
        }
        setLoading(false);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    }

    function formatPercent(value) {
        return `${Math.round(value || 0)}%`;
    }



    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Carregando proposta...</p>
            </div>
        );
    }

    if (!proposal) {
        return (
            <div className={styles.error}>
                <h1>Proposta não encontrada</h1>
                <p>O link pode estar incorreto ou a proposta foi removida.</p>
            </div>
        );
    }

    const primaryColor = proposal.primary_color || '#007AFF';
    const benefits = proposal.benefits || [];

    // Current conversion rate
    const currentResponseRate = proposal.leads_received > 0
        ? (proposal.leads_responded / proposal.leads_received) * 100
        : 0;
    const currentConversionRate = proposal.leads_responded > 0
        ? (proposal.leads_converted / proposal.leads_responded) * 100
        : 0;

    return (
        <div className={styles.container} style={{ '--primary-color': primaryColor }}>
            {/* Hero Section */}
            <RevealSection className={styles.hero}>
                {/* Background Media Layer */}
                {proposal.hero_media && (
                    <div className={styles.heroMediaBackground}>
                        {proposal.hero_media.includes('.mp4') || proposal.hero_media.includes('.webm') || proposal.hero_media.includes('.mov') ? (
                            <video
                                autoPlay
                                muted
                                loop
                                playsInline
                                className={styles.heroMediaVideo}
                            >
                                <source src={proposal.hero_media} type="video/mp4" />
                            </video>
                        ) : (
                            <img
                                src={proposal.hero_media}
                                alt=""
                                className={styles.heroMediaImage}
                            />
                        )}
                    </div>
                )}
                <div className={styles.heroContent}>
                    <span className={styles.tag}>Proposta Comercial</span>
                    <h1 className={styles.heroTitle}>
                        <TypewrittenText text={proposal.company_name} />
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Olá, <strong>{proposal.client_name}</strong>! Preparamos uma solução
                        de IA personalizada para transformar seu atendimento.
                    </p>
                </div>
            </RevealSection>

            {/* Com IA vs Sem IA Comparison - show if has comparison data or challenges */}
            {((proposal.comparison_with_ai && proposal.comparison_with_ai.length > 0) ||
                (proposal.challenges && proposal.challenges.length > 0)) && (
                    <RevealSection className={`${styles.section} ${styles.comparisonSection}`} threshold={0.83}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionTag}>Comparativo</span>
                            <h2>Sem IA <span className={styles.vsText}>vs</span> Com IA</h2>
                            <p className={styles.sectionSubtitle}>no setor comercial (WhatsApp)</p>
                        </div>

                        <div className={styles.vsCards}>
                            <div className={`${styles.vsCard} ${styles.withoutAI}`}>
                                <h3 className={styles.vsCardTitle}>Sem Agente de IA</h3>
                                <ul className={styles.vsList}>
                                    {(proposal.comparison_without_ai || [
                                        'Demora de 1h ou mais',
                                        'Sem follow-up ou esquecido',
                                        'Limitado à capacidade da equipe',
                                        'Atendimento inconsistente',
                                        'Alto custo por lead perdido',
                                    ]).map((item, index) => (
                                        <li key={index}><span className={styles.crossIcon}>—</span> {item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className={`${styles.vsCard} ${styles.withAI}`}>
                                <h3 className={styles.vsCardTitle}>Com Agente de IA</h3>
                                <ul className={styles.vsList}>
                                    {(proposal.comparison_with_ai || [
                                        'Responde em segundos (24/7/365)',
                                        'Faz follow-up automático',
                                        'Atende vários leads ao mesmo tempo',
                                        'Usa linguagem humanizada e personalizada',
                                        'ROI de 3,5x sobre o investimento',
                                    ]).map((item, index) => (
                                        <li key={index}><span className={styles.checkIcon}>○</span> {item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </RevealSection>
                )}

            {/* Challenges Section - only show if has challenges */}
            {proposal.challenges && proposal.challenges.length > 0 && (
                <RevealSection className={`${styles.section} ${styles.challengesSection}`}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>Análise</span>
                        <h2>Desafios Identificados</h2>
                    </div>

                    <div className={styles.challengesGrid}>
                        {proposal.challenges.map((challenge, index) => (
                            <div key={index} className={styles.challengeItem}>
                                <span className={styles.challengeNumber}>{String(index + 1).padStart(2, '0')}</span>
                                <span className={styles.challengeText}>{challenge}</span>
                            </div>
                        ))}
                    </div>
                </RevealSection>
            )}

            {/* Benefits Section */}
            <RevealSection className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>Vantagens</span>
                    <h2>Por que IA</h2>
                </div>

                <div className={styles.benefitsGrid}>
                    {benefits.map(benefitId => {
                        const benefit = BENEFITS_MAP[benefitId];
                        if (!benefit) return null;
                        return (
                            <div key={benefitId} className={styles.benefitCard}>
                                <h4 className={styles.benefitTitle}>{benefit.label}</h4>
                                <p className={styles.benefitDesc}>{benefit.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </RevealSection>

            {/* Market Stats Section - always show */}
            <RevealSection className={`${styles.section} ${styles.statsSection}`}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>Dados de Mercado</span>
                    <h2>IA no WhatsApp</h2>
                </div>

                <div className={styles.marketStatsCard}>
                    <ul className={styles.marketStatsList}>
                        {(proposal.market_stats || [
                            { text: 'Responder em até 1 minuto pode gerar até', highlight: '391% mais vendas' },
                            { text: 'A cada 5 minutos sem resposta, suas chances de fechar', highlight: 'caem em 80%' },
                            { text: 'Empresas que usam IA no atendimento', highlight: 'vendem até 3x mais' },
                            { text: 'Follow-up automatizado aumenta em', highlight: '47% as conversões' },
                            { text: 'Empresas com IA no atendimento', highlight: 'crescem 2x mais rápido' },
                        ]).map((stat, index) => (
                            <li key={index}>
                                <span className={styles.checkIcon}>○</span>
                                {stat.text} <strong>{stat.highlight}</strong>.
                            </li>
                        ))}
                    </ul>
                    <span className={styles.statsSource}>Fonte: SBS, MIT, HBR</span>
                </div>
            </RevealSection>

            {/* Current State Section */}
            <RevealSection className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>Diagnóstico</span>
                    <h2>Situação Atual</h2>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{proposal.leads_received}</span>
                        <span className={styles.statLabel}>Leads Gerados</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{proposal.leads_responded}</span>
                        <span className={styles.statLabel}>Respondidos</span>
                        <span className={styles.statPercent}>{formatPercent(currentResponseRate)}</span>
                    </div>
                    {proposal.funnel_type === 'scheduling' && (
                        <>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{proposal.leads_scheduled || 0}</span>
                                <span className={styles.statLabel}>Agendados</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{proposal.leads_showed_up || 0}</span>
                                <span className={styles.statLabel}>Show-up</span>
                            </div>
                        </>
                    )}
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{proposal.leads_converted}</span>
                        <span className={styles.statLabel}>Vendas</span>
                        <span className={styles.statPercent}>{formatPercent(currentConversionRate)}</span>
                    </div>
                </div>

                <div className={styles.revenueCard}>
                    <span className={styles.revenueLabel}>Faturamento Atual Estimado</span>
                    <span className={styles.revenueValue}>
                        {roi && formatCurrency(roi.currentRevenue)}
                    </span>
                    <span className={styles.revenueDetail}>
                        {proposal.leads_converted} vendas × {formatCurrency(proposal.ltv || proposal.average_ticket)}
                        {proposal.ltv ? ' (LTV)' : ' (ticket)'}
                    </span>
                </div>
            </RevealSection>

            {/* Funnel Comparison Section */}
            <FunnelComparison
                proposal={proposal}
                roi={roi}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
            />

            {/* ROI Projection Section */}
            <RevealSection className={`${styles.section} ${styles.roiSection}`}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>Projeção</span>
                    <h2>Crescimento com IA</h2>
                </div>

                <div className={styles.toggleContainer}>
                    <span className={conservative ? '' : styles.activeLabel}>Padrão</span>
                    <button
                        className={`${styles.toggle} ${conservative ? styles.active : ''}`}
                        onClick={() => setConservative(!conservative)}
                    >
                        <span className={styles.toggleKnob}></span>
                    </button>
                    <span className={conservative ? styles.activeLabel : ''}>Conservador</span>
                </div>

                <div className={styles.comparison}>
                    <div className={styles.comparisonCard}>
                        <span className={styles.comparisonLabel}>Situação Hoje</span>
                        <span className={styles.comparisonValue}>{formatCurrency(roi?.currentRevenue)}</span>
                    </div>

                    <div className={styles.comparisonArrow}>→</div>

                    <div className={`${styles.comparisonCard} ${styles.highlight}`}>
                        <span className={styles.comparisonLabel}>Com IA</span>
                        <span className={styles.comparisonValue}>{formatCurrency(roi?.projectedRevenue)}</span>
                    </div>
                </div>

                {/* Animated ROI Highlight - Casino Style Counter */}
                <div className={styles.roiHighlight}>
                    <div className={styles.roiNumber}>
                        <span className={styles.roiPlus}>+</span>
                        <span className={styles.roiValue}>
                            <AnimatedCounter value={roi?.revenueIncrease || 0} duration={2500} />
                        </span>
                    </div>
                    <span className={styles.roiLabel}>Aumento projetado no faturamento mensal</span>
                    {roi?.roiPercentage > 0 && (
                        <span className={styles.roiPercent}>+{formatPercent(roi.roiPercentage)} de crescimento</span>
                    )}
                </div>

                {/* Annual Revenue Comparison - Scratch Card */}
                <div className={scratchStyles.annualRevenueGrid}>
                    <div className={scratchStyles.revenueCard}>
                        <span className={scratchStyles.revenueCardTitle}>Faturamento Anual Atual</span>
                        <span className={scratchStyles.revenueCardValue}>{formatCurrency(roi?.currentRevenue * 12)}</span>
                    </div>

                    <div className={`${scratchStyles.revenueCard} ${scratchStyles.highlight}`}>
                        <span className={scratchStyles.revenueCardTitle}>Potencial Anual com IA</span>
                        <ScratchCard>
                            <span className={scratchStyles.revenueCardValue}>{formatCurrency(roi?.projectedRevenue * 12)}</span>
                        </ScratchCard>
                    </div>
                </div>

                <div className={styles.projectionDetails}>
                    <div className={styles.projectionItem}>
                        <span className={styles.projectionLabel}>Taxa de Resposta</span>
                        <div className={styles.projectionComparison}>
                            <span className={styles.projectionOld}>{formatPercent(currentResponseRate)}</span>
                            <span className={styles.projectionArrow}>→</span>
                            <span className={styles.projectionNew}>{formatPercent(proposal.projected_response_rate)}</span>
                        </div>
                    </div>
                    <div className={styles.projectionItem}>
                        <span className={styles.projectionLabel}>Vendas</span>
                        <div className={styles.projectionComparison}>
                            <span className={styles.projectionOld}>{proposal.leads_converted}/mês</span>
                            <span className={styles.projectionArrow}>→</span>
                            <span className={styles.projectionNew}>{roi?.projectedConverted}/mês</span>
                        </div>
                    </div>
                </div>
            </RevealSection>

            {/* Roadmap Section */}
            <RevealSection className={`${styles.section} ${styles.roadmapSection}`}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>Entrega</span>
                    <h2>Cronograma</h2>
                </div>

                {(() => {
                    // ... (Calculations stay the same) ...
                    const analysisDays = proposal.roadmap_analysis_days || 7;
                    const approvalDays = proposal.roadmap_approval_days || 7;
                    const developmentDays = proposal.roadmap_development_days || 21;
                    const testingDays = proposal.roadmap_testing_days || 14;
                    const totalDays = analysisDays + approvalDays + developmentDays + testingDays;
                    const totalWeeks = Math.ceil(totalDays / 7);
                    const weeks = Array.from({ length: totalWeeks + 1 }, (_, i) => i + 1);
                    const daysPerWeek = 7;
                    const analysisEnd = Math.ceil(analysisDays / daysPerWeek) + 1;
                    const approvalEnd = Math.ceil((analysisDays + approvalDays) / daysPerWeek) + 1;
                    const devEnd = Math.ceil((analysisDays + approvalDays + developmentDays) / daysPerWeek) + 1;
                    const testEnd = Math.ceil((analysisDays + approvalDays + developmentDays + testingDays) / daysPerWeek) + 1;

                    return (
                        <>
                            <div className={styles.roadmapContainer}>
                                <div className={styles.roadmapHeader} style={{ gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)` }}>
                                    <div className={styles.roadmapPhaseLabel}></div>
                                    {weeks.map(week => (
                                        <div key={week} className={styles.roadmapWeek}>Sem {week}</div>
                                    ))}
                                </div>

                                <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)` }}>
                                    <div className={styles.roadmapPhaseLabel}>Análise</div>
                                    <div className={`${styles.roadmapBar} ${styles.roadmapBar1}`} style={{ gridColumn: `2 / ${analysisEnd}` }}></div>
                                </div>

                                <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)` }}>
                                    <div className={styles.roadmapPhaseLabel}>Definição</div>
                                    <div className={`${styles.roadmapBar} ${styles.roadmapBar2}`} style={{ gridColumn: `2 / ${approvalEnd}` }}></div>
                                </div>

                                <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)` }}>
                                    <div className={styles.roadmapPhaseLabel}>Desenvolvimento</div>
                                    <div className={`${styles.roadmapBar} ${styles.roadmapBar3}`} style={{ gridColumn: `${analysisEnd} / ${devEnd}` }}></div>
                                </div>

                                <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)` }}>
                                    <div className={styles.roadmapPhaseLabel}>Implementação</div>
                                    <div className={`${styles.roadmapBar} ${styles.roadmapBar4}`} style={{ gridColumn: `${devEnd} / ${testEnd}` }}></div>
                                </div>

                                <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)` }}>
                                    <div className={styles.roadmapPhaseLabel}>Lançamento</div>
                                    <div className={`${styles.roadmapBar} ${styles.roadmapBar5}`} style={{ gridColumn: `${testEnd} / ${testEnd + 1}` }}></div>
                                </div>
                            </div>

                            <div className={styles.roadmapNote}>
                                <span>Prazo estimado: <strong>{totalDays} dias</strong> ({totalWeeks} semanas) para operação total.</span>
                            </div>
                        </>
                    );
                })()}
            </RevealSection>

            {/* Pricing Section */}
            <RevealSection className={`${styles.section} ${styles.pricingSection}`}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>Investimento</span>
                    <h2>Condições</h2>
                </div>

                <div className={styles.pricingGrid}>
                    <div className={styles.pricingCard}>
                        <div className={styles.pricingHeader}>
                            <h3>Implementação</h3>
                        </div>
                        <div className={styles.pricingMain}>
                            <span className={styles.pricingValue}>{formatCurrency(proposal.price_total)}</span>
                            <span className={styles.pricingLabel}>pagamento único</span>
                        </div>

                        {proposal.price_upfront && proposal.installments > 1 && (
                            <div className={styles.pricingDetails}>
                                <div className={styles.pricingLine}>
                                    <span>Entrada</span>
                                    <span>{formatCurrency(proposal.price_upfront)}</span>
                                </div>
                                <div className={styles.pricingLine}>
                                    <span>Parcelado em {proposal.installments}x</span>
                                    <span>
                                        {formatCurrency((proposal.price_total - proposal.price_upfront) / proposal.installments)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className={styles.paymentMethod}>
                            <span>Método: {PAYMENT_METHODS[proposal.implementation_payment_method] || 'PIX ou Cartão'}</span>
                        </div>

                        <div className={styles.pricingIncluded}>
                            <span className={styles.includedTitle}>Incluso:</span>
                            <ul>
                                <li>Configuração completa</li>
                                <li>Integração WhatsApp</li>
                                <li>Inteligência personalizada</li>
                                <li>Suporte na ativação</li>
                            </ul>
                        </div>
                    </div>

                    {proposal.has_maintenance && (
                        <div className={`${styles.pricingCard} ${styles.maintenanceCard}`}>
                            <div className={styles.pricingHeader}>
                                <h3>Suporte e Manutenção</h3>
                            </div>
                            <div className={styles.pricingMain}>
                                <span className={styles.pricingValue}>{formatCurrency(proposal.maintenance_price)}</span>
                                <span className={styles.pricingLabel}>por mês</span>
                            </div>

                            <div className={styles.paymentMethod}>
                                <span>Método: {PAYMENT_METHODS[proposal.maintenance_payment_method] || 'PIX ou Cartão'}</span>
                            </div>

                            {proposal.maintenance_description && (
                                <div className={styles.pricingIncluded}>
                                    <span className={styles.includedTitle}>Incluso:</span>
                                    <p className={styles.maintenanceDesc}>{proposal.maintenance_description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.pricingRoi}>
                    <p>
                        Estimativa de retorno do investimento (Payback) em aproximadamente <strong>{Math.ceil((proposal.price_total / (roi?.revenueIncrease || 1)) * 30)} dias</strong> após a operação.
                    </p>
                </div>

                <div className={styles.ctaContainer}>
                    <a
                        href={`https://wa.me/?text=Olá! Tenho interesse na proposta para ${proposal.company_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.ctaButton}
                    >
                        Aceitar Proposta
                    </a>
                </div>
            </RevealSection>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>Proposta gerada especialmente para {proposal.company_name}</p>
                <p className={styles.footerDate}>
                    {new Date(proposal.created_at).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </footer>
        </div>
    );
}
