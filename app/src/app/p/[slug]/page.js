'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase, calculateROI } from '@/lib/supabase';
import styles from './proposal.module.css';
import slideStyles from './slides.module.css';
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

// Reveal Animation Wrapper - Adapted for Slides (triggers on slide active)
function RevealSection({ children, className = '', isActive = false }) {
    // In slide mode, we just use the active state to trigger animations
    return (
        <section
            className={`${className} ${isActive ? styles.revealActive : ''}`}
        >
            {children}
        </section>
    );
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 1500, prefix = '', isActive }) {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const animationRef = useRef(null);

    useEffect(() => {
        if (isActive && value > 0 && !hasAnimated) {
            setHasAnimated(true);
            startAnimation(0, value);
        }
    }, [isActive, value, hasAnimated]);

    function startAnimation(from, to) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
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

    return <span>{prefix}{formatted}</span>;
}

// Typewriter Effect Component
function TypewrittenText({ text, speed = 80, delay = 500, isActive }) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (isActive && !hasStarted) {
            setHasStarted(true);
        }
    }, [isActive, hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        let timeout;
        if (displayedText.length < text.length) {
            timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, displayedText.length + 1));
            }, displayedText.length === 0 ? delay : speed);
        } else {
            setIsComplete(true);
        }
        return () => clearTimeout(timeout);
    }, [displayedText, text, speed, delay, hasStarted]);

    return (
        <span className={styles.typewriterWrapper}>
            {displayedText}
            <span className={`${styles.cursor} ${isComplete ? styles.cursorHidden : ''}`}></span>
        </span>
    );
}

// Interactive Funnel Component
function FunnelComparison({ proposal, roi, formatCurrency, formatPercent, isActive }) {
    const [visibleToday, setVisibleToday] = useState(0);
    const [visibleAI, setVisibleAI] = useState(0);
    const [funnelState, setFunnelState] = useState('normal');

    const isScheduling = proposal.funnel_type === 'scheduling';

    const layersToday = [
        { label: 'Leads', value: proposal.leads_received, metric: '100%' },
        { label: 'Respondidos', value: proposal.leads_responded, metric: formatPercent((proposal.leads_responded / proposal.leads_received) * 100) },
        ...(isScheduling ? [{ label: 'Agendados', value: proposal.leads_scheduled || 0, metric: formatPercent((proposal.leads_scheduled / proposal.leads_received) * 100) }] : []),
        { label: 'Vendas', value: proposal.leads_converted, metric: formatPercent((proposal.leads_converted / proposal.leads_received) * 100) }
    ];

    const projectedResponded = Math.round(proposal.leads_received * (proposal.projected_response_rate / 100));
    const schedulingConversionRate = proposal.projected_conversion_rate || 20;
    const projectedScheduled = isScheduling ? Math.round(projectedResponded * (schedulingConversionRate / 100)) : 0;
    const projectedSales = roi?.projectedConverted || 0;

    const layersAI = [
        { label: 'Leads', value: proposal.leads_received, metric: '100%' },
        { label: 'Respondidos', value: projectedResponded, metric: formatPercent(proposal.projected_response_rate) },
        ...(isScheduling ? [{ label: 'Agendados', value: projectedScheduled, metric: formatPercent(schedulingConversionRate) }] : []),
        { label: 'Vendas', value: projectedSales, metric: formatPercent((projectedSales / proposal.leads_received) * 100) }
    ];

    useEffect(() => {
        if (!isActive) {
            setVisibleToday(0);
            setVisibleAI(0);
            setFunnelState('normal');
        }
    }, [isActive]);

    const handleTodayClick = () => {
        if (visibleToday < layersToday.length) setVisibleToday(prev => prev + 1);
    };

    const handleAIClick = () => {
        if (visibleAI < layersAI.length) setVisibleAI(prev => prev + 1);
    };

    useEffect(() => {
        if (visibleAI === layersAI.length && funnelState === 'normal') {
            const handleClick = () => {
                setFunnelState('collapsing');
                setTimeout(() => setFunnelState('destroyed'), 3500);
            };
            document.addEventListener('click', handleClick, { once: true });
            return () => document.removeEventListener('click', handleClick);
        }
    }, [visibleAI, layersAI.length, funnelState]);

    return (
        <RevealSection className={funnelStyles.funnelComparisonSection} isActive={isActive}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>Comparativo Visual</span>
                <h2>Funil de Conversão</h2>
                <p className={styles.sectionSubtitle}>Clique nos funis para revelar as etapas</p>
            </div>

            <div className={funnelStyles.funnelGrid}>
                <div className={`${funnelStyles.funnelColumn} ${funnelStyles[funnelState]}`}>
                    <h3 className={funnelStyles.funnelTitle}>Hoje</h3>
                    {funnelState === 'destroyed' && (
                        <div className={funnelStyles.wreckageOverlay}><span className={funnelStyles.wreckageIcon}>❌</span></div>
                    )}
                    <div className={funnelStyles.funnelContainer} onClick={handleTodayClick}>
                        {layersToday.map((layer, index) => (
                            <div key={index} className={`${funnelStyles.funnelLayer} ${index < visibleToday ? funnelStyles.visible : ''}`} style={{ zIndex: layersToday.length - index }}>
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

                <div className={`${funnelStyles.funnelColumn} ${funnelStyles.ai}`}>
                    <h3 className={funnelStyles.funnelTitle}>Com IA</h3>
                    <div className={funnelStyles.funnelContainer} onClick={handleAIClick}>
                        {layersAI.map((layer, index) => (
                            <div key={index} className={`${funnelStyles.funnelLayer} ${index < visibleAI ? funnelStyles.visible : ''}`} style={{ zIndex: layersAI.length - index }}>
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
function ScratchCard({ children, onReveal }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;

        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#121212');
        gradient.addColorStop(0.5, '#1E1E1E');
        gradient.addColorStop(1, '#121212');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#BFFF00';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("RASPE O RESULTADO", canvas.width / 2, canvas.height / 2);

        ctx.globalCompositeOperation = 'destination-out';
    }, []);

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const scratch = (x, y) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, 2 * Math.PI);
        ctx.fill();
        checkReveal();
    };

    const checkReveal = () => {
        if (isRevealed) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let transparentPixels = 0;
        for (let i = 3; i < pixels.length; i += 40) {
            if (pixels[i] === 0) transparentPixels++;
        }
        if ((transparentPixels / (pixels.length / 40)) * 100 > 50) {
            setIsRevealed(true);
            canvas.style.transition = 'opacity 0.5s ease';
            canvas.style.opacity = '0';
            const end = Date.now() + 3000;
            (function frame() {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#00C853', '#00B0FF', '#6200EA'] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#00C853', '#00B0FF', '#6200EA'] });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
            setTimeout(() => { if (canvas) canvas.style.display = 'none'; if (onReveal) onReveal(); }, 500);
        }
    };

    return (
        <div className={`${scratchStyles.scratchCanvasContainer} ${isRevealed ? scratchStyles.revealed : ''}`} ref={containerRef}>
            <canvas
                ref={canvasRef}
                className={scratchStyles.scratchCanvas}
                onMouseDown={(e) => { setIsDrawing(true); scratch(getMousePos(e).x, getMousePos(e).y); }}
                onMouseMove={(e) => { if (isDrawing) scratch(getMousePos(e).x, getMousePos(e).y); }}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={(e) => { setIsDrawing(true); scratch(getMousePos(e).x, getMousePos(e).y); }}
                onTouchMove={(e) => { if (isDrawing) scratch(getMousePos(e).x, getMousePos(e).y); }}
                onTouchEnd={() => setIsDrawing(false)}
            />
            <div className={scratchStyles.scratchContent}>{children}</div>
        </div>
    );
}

export default function ProposalPage() {
    const { slug } = useParams();
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [conservative, setConservative] = useState(false);
    const [roi, setRoi] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slidesCount = 9; // Hero, Solution, Diagnosis, Funnel, Impacto, Potencial, Roadmap, Pricing, CTA

    useEffect(() => {
        fetchProposal();
    }, [slug]);

    useEffect(() => {
        if (proposal) {
            setRoi(calculateROI(proposal, conservative));
        }
    }, [proposal, conservative]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

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
            if (data.status === 'sent') {
                await supabase.from('proposals').update({ status: 'viewed', updated_at: new Date().toISOString() }).eq('id', data.id);
            }
        }
        setLoading(false);
    }

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, slidesCount - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
    }

    function formatPercent(value) {
        return `${Math.round(value || 0)}%`;
    }

    if (loading) return <div className={styles.loading}><div className={styles.spinner}></div><p>Carregando proposta...</p></div>;
    if (!proposal) return <div className={styles.error}><h1>Proposta não encontrada</h1><p>O link pode estar incorreto ou a proposta foi removida.</p></div>;

    const benefits = proposal.benefits || [];
    const currentResponseRate = proposal.leads_received > 0 ? (proposal.leads_responded / proposal.leads_received) * 100 : 0;
    const currentConversionRate = proposal.leads_responded > 0 ? (proposal.leads_converted / proposal.leads_responded) * 100 : 0;

    return (
        <div className={slideStyles.slidesContainer} style={{ '--primary-color': proposal.primary_color || '#BFFF00' }}>

            {/* Navigation Overlay */}
            <div className={slideStyles.controlsOverlay}>
                <div className={slideStyles.progressDots}>
                    {Array.from({ length: slidesCount }).map((_, i) => (
                        <button
                            key={i}
                            className={`${slideStyles.dot} ${currentSlide === i ? slideStyles.active : ''}`}
                            onClick={() => setCurrentSlide(i)}
                            aria-label={`Ir para slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>

            <button className={`${slideStyles.navButton} ${slideStyles.prevButton}`} onClick={prevSlide} disabled={currentSlide === 0}>←</button>
            <button className={`${slideStyles.navButton} ${slideStyles.nextButton}`} onClick={nextSlide} disabled={currentSlide === slidesCount - 1}>→</button>

            {/* Slides Track */}
            <div className={slideStyles.slidesTrack} style={{ transform: `translateX(-${currentSlide * 100}vw)` }}>

                {/* SLIDE 1: HERO */}
                <div className={`${slideStyles.slide} ${currentSlide === 0 ? slideStyles.activeSlide : ''}`}>
                    <div className={styles.heroMediaBackground}>
                        {proposal.hero_media && (
                            proposal.hero_media.match(/\.(mp4|webm|mov)$/) ?
                                <video autoPlay muted loop playsInline className={styles.heroMediaVideo}><source src={proposal.hero_media} /></video> :
                                <img src={proposal.hero_media} className={styles.heroMediaImage} alt="" />
                        )}
                    </div>
                    <div className={`${slideStyles.slideContent} ${styles.heroContent}`} style={{ textAlign: 'center', zIndex: 1 }}>
                        <span className={styles.tag}>Proposta Comercial</span>
                        <h1 className={styles.heroTitle}>
                            <TypewrittenText text={proposal.company_name} isActive={currentSlide === 0} />
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Olá, <strong>{proposal.client_name}</strong>! Preparamos uma solução de IA para transformar seu atendimento.
                        </p>
                    </div>
                </div>

                {/* SLIDE 2: SOLUTION */}
                <div className={`${slideStyles.slide} ${currentSlide === 1 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark)' }}>
                    <div className={slideStyles.slideContent}>
                        <RevealSection isActive={currentSlide === 1}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTag} style={{ fontSize: '1.2rem', marginBottom: 'var(--space-6)' }}>Solução Personalizada</span>
                                <h2 style={{ fontSize: '4.5rem', fontWeight: 900 }}>A Solução</h2>
                            </div>
                            <div className={styles.benefitsGrid}>
                                {(proposal.benefits && proposal.benefits.length > 0) ? (
                                    proposal.benefits.map(benefitId => {
                                        const mapped = BENEFITS_MAP[benefitId];
                                        return (
                                            <div key={benefitId} className={styles.benefitCard}>
                                                <h4 className={styles.benefitTitle}>{mapped ? mapped.label : benefitId}</h4>
                                                {mapped && <p className={styles.benefitDesc}>{mapped.desc}</p>}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className={styles.benefitCard} style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                                        <h4 className={styles.benefitTitle}>Configuração em andamento</h4>
                                        <p className={styles.benefitDesc}>Definindo os melhores benefícios para sua operação.</p>
                                    </div>
                                )}
                            </div>
                        </RevealSection>
                    </div>
                </div>

                {/* SLIDE 3: DIAGNOSIS / CHALLENGES */}
                <div className={`${slideStyles.slide} ${currentSlide === 2 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark-2)' }}>
                    <div className={slideStyles.slideContent}>
                        <RevealSection isActive={currentSlide === 2}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTag}>Diagnóstico</span>
                                <h2>O cenário atual</h2>
                                <p className={styles.sectionSubtitle}>Identificamos oportunidades de melhoria</p>
                            </div>

                            <div className={styles.vsCards}>
                                <div className={`${styles.vsCard} ${styles.withoutAI}`}>
                                    <h3>Gargalos Encontrados</h3>
                                    <ul className={styles.vsList}>
                                        {(proposal.challenges && proposal.challenges.length > 0 ? proposal.challenges : [
                                            'Tempo de resposta elevado', 'Perda de leads fora do horário', 'Falta de padronização', 'Dificuldade em escalar'
                                        ]).map((item, i) => (
                                            <li key={i}><span className={styles.crossIcon}>—</span> {item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={styles.statCard} style={{ maxWidth: '400px', margin: '0 auto', border: '1px solid var(--brand-neon)' }}>
                                    <span className={styles.statValue}>{proposal.leads_received}</span>
                                    <span className={styles.statLabel}>Leads Gerados/Mês</span>
                                    <span className={styles.statPercent} style={{ color: 'var(--brand-neon)', fontWeight: 'bold' }}>Base para análise</span>
                                </div>
                            </div>
                        </RevealSection>
                    </div>
                </div>

                {/* SLIDE 4: FUNNEL COMPARISON */}
                <div className={`${slideStyles.slide} ${currentSlide === 3 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark-2)' }}>
                    <div className={slideStyles.slideContent}>
                        <FunnelComparison
                            proposal={proposal}
                            roi={roi}
                            formatCurrency={formatCurrency}
                            formatPercent={formatPercent}
                            isActive={currentSlide === 3}
                        />
                    </div>
                </div>

                {/* SLIDE 5: REVENUE COMPARISON (IMPACTO) */}
                <div className={`${slideStyles.slide} ${currentSlide === 4 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark)' }}>
                    <div className={slideStyles.slideContent}>
                        <RevealSection isActive={currentSlide === 4}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTag}>Viabilidade Final</span>
                                <h2>Impacto Financeiro</h2>
                            </div>

                            <div className={styles.revenueComparisonGrid}>
                                <div className={styles.revenueCol}>
                                    <span className={styles.revenueColTag}>Cenário Atual</span>
                                    <div className={styles.revenueMainValue}>{formatCurrency(roi?.currentRevenue)}</div>
                                    <div className={styles.revenueSubDetail}>Conversão: {formatPercent(currentConversionRate)}</div>
                                    <div className={styles.revenueSubDetail}>{proposal.leads_received} leads/mês</div>
                                </div>

                                <div className={styles.revenueVS}>VS</div>

                                <div className={styles.revenueCol} style={{ border: '1px solid var(--brand-neon)' }}>
                                    <span className={styles.revenueColTag} style={{ color: 'var(--brand-neon)' }}>Com Nossa IA</span>
                                    <div className={styles.revenueMainValue}>{formatCurrency(roi?.projectedRevenue)}</div>
                                    <div className={styles.revenueSubDetail}>Nova Conversão: {formatPercent(proposal.projected_conversion_rate || (currentConversionRate * 1.5))}</div>
                                    <div className={styles.revenueSubDetail}>Atendimento {conservative ? 'Conservador' : '24/7 Total'}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                <button
                                    onClick={() => setConservative(!conservative)}
                                    className={styles.conservativeToggle}
                                    style={{
                                        background: conservative ? 'var(--brand-neon)' : 'transparent',
                                        color: conservative ? 'black' : 'var(--brand-neon)',
                                        border: '1px solid var(--brand-neon)',
                                        padding: '12px 24px',
                                        borderRadius: '30px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {conservative ? '↩ Ver Projeção Total' : '✂ Ver Projeção Conservadora (-50%)'}
                                </button>
                                <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--brand-muted)' }}>
                                    {conservative
                                        ? 'Exibindo estimativa com apenas 50% do ganho real projetado.'
                                        : 'Baseado em atendimento instantâneo e recuperação de 100% dos leads.'}
                                </p>
                            </div>
                        </RevealSection>
                    </div>
                </div>


                {/* SLIDE 6: ROI PROJECTION (Potencial) */}
                <div className={`${slideStyles.slide} ${currentSlide === 5 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark)' }}>
                    <div className={slideStyles.slideContent}>
                        <RevealSection isActive={currentSlide === 5} className={styles.roiSection}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTag}>Potencial Anual</span>
                                <h2>Crescimento Estimado</h2>
                            </div>

                            <div className={styles.roiHighlight}>
                                <div className={styles.roiNumber}>
                                    <span className={styles.roiPlus}>+</span>
                                    <span className={styles.roiValue}>
                                        <AnimatedCounter value={roi?.revenueIncrease || 0} duration={2500} isActive={currentSlide === 5} />
                                    </span>
                                </div>
                                <span className={styles.roiLabel}>Faturamento adicional mensal {conservative && '(Conservador)'}</span>
                            </div>

                            <div className={scratchStyles.annualRevenueGrid} style={{ marginTop: '40px' }}>
                                <div className={`${scratchStyles.revenueCard} ${scratchStyles.highlight}`} style={{ background: 'var(--brand-dark-2)', border: '1px solid var(--brand-neon)' }}>
                                    <span className={scratchStyles.revenueCardTitle} style={{ color: 'var(--brand-muted)' }}>ROI Estimado em 12 Meses</span>
                                    <ScratchCard>
                                        <span className={scratchStyles.revenueCardValue} style={{ color: 'var(--brand-neon)' }}>{formatCurrency(roi?.revenueIncrease * 12)}</span>
                                    </ScratchCard>
                                </div>
                            </div>
                        </RevealSection>
                    </div>
                </div>

                {/* SLIDE 7: ROADMAP */}
                <div className={`${slideStyles.slide} ${currentSlide === 6 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark-2)' }}>
                    <div className={slideStyles.slideContent}>
                        <RevealSection isActive={currentSlide === 6} className={styles.roadmapSection}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTag}>Cronograma</span>
                                <h2>Plano de Entrega</h2>
                            </div>
                            {(() => {
                                const totalDays = proposal.delivery_days || 30;
                                const totalWeeks = Math.ceil(totalDays / 7);
                                return (
                                    <>
                                        <div className={styles.roadmapContainer}>
                                            <div className={styles.roadmapHeader} style={{ gridTemplateColumns: `180px repeat(${totalWeeks}, 1fr)`, display: 'grid', marginBottom: '20px', color: 'var(--brand-muted)', fontSize: '0.8rem' }}>
                                                <div></div>
                                                {Array.from({ length: totalWeeks }).map((_, i) => (
                                                    <div key={i}>Sem {i + 1}</div>
                                                ))}
                                            </div>
                                            <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${totalWeeks}, 1fr)`, display: 'grid', alignItems: 'center', marginBottom: '12px' }}>
                                                <div className={styles.roadmapPhaseLabel} style={{ fontWeight: 'bold' }}>Análise</div>
                                                <div className={styles.roadmapBar} style={{ gridColumn: `2 / 3` }}></div>
                                            </div>
                                            <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${totalWeeks}, 1fr)`, display: 'grid', alignItems: 'center', marginBottom: '12px' }}>
                                                <div className={styles.roadmapPhaseLabel} style={{ fontWeight: 'bold' }}>Setup</div>
                                                <div className={styles.roadmapBar} style={{ gridColumn: `2 / ${Math.max(3, Math.ceil(totalWeeks * 0.6))}` }}></div>
                                            </div>
                                            <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${totalWeeks}, 1fr)`, display: 'grid', alignItems: 'center', marginBottom: '12px' }}>
                                                <div className={styles.roadmapPhaseLabel} style={{ fontWeight: 'bold' }}>Testes</div>
                                                <div className={styles.roadmapBar} style={{ gridColumn: `${Math.ceil(totalWeeks * 0.6)} / ${totalWeeks}` }}></div>
                                            </div>
                                            <div className={styles.roadmapRow} style={{ gridTemplateColumns: `180px repeat(${totalWeeks}, 1fr)`, display: 'grid', alignItems: 'center', marginBottom: '12px' }}>
                                                <div className={styles.roadmapPhaseLabel} style={{ fontWeight: 'bold' }}>Go-Live</div>
                                                <div className={styles.roadmapBar} style={{ gridColumn: `${totalWeeks} / ${totalWeeks + 1}` }}></div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '1.2rem', color: 'var(--brand-muted)' }}>Prazo estimado: <strong style={{ color: 'var(--brand-neon)' }}>{totalDays} dias</strong> para operação total.</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </RevealSection>
                    </div>
                </div>

                {/* SLIDE 8: INVESTMENT */}
                <div className={`${slideStyles.slide} ${currentSlide === 7 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark)' }}>
                    <div className={slideStyles.slideContent}>
                        <RevealSection isActive={currentSlide === 7} className={styles.pricingSection}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTag}>Investimento</span>
                                <h2>Condições Especiais</h2>
                            </div>
                            <div className={styles.pricingGrid}>
                                <div className={styles.pricingCard}>
                                    <div className={styles.pricingHeader}><h3>Implementação</h3></div>
                                    <div className={styles.pricingValue}>{formatCurrency(proposal.price_total)}</div>
                                    <div className={styles.pricingLabel} style={{ marginBottom: '20px' }}>pagamento único</div>
                                    <div className={styles.pricingIncluded}>
                                        <ul>
                                            <li>Configuração Total</li>
                                            <li>Treinamento da IA</li>
                                            <li>Garantia de 30 dias</li>
                                        </ul>
                                    </div>
                                </div>
                                {proposal.has_maintenance && (
                                    <div className={`${styles.pricingCard} ${styles.maintenanceCard}`}>
                                        <div className={styles.pricingHeader}><h3>Mensalidade</h3></div>
                                        <div className={styles.pricingValue}>{formatCurrency(proposal.maintenance_price)}</div>
                                        <div className={styles.pricingLabel} style={{ marginBottom: '20px' }}>por mês</div>
                                        <div className={styles.pricingIncluded}>
                                            <ul>
                                                <li>Manutenção contínua</li>
                                                <li>Ajustes ilimitados</li>
                                                <li>Relatórios mensais</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </RevealSection>
                    </div>
                </div>

                {/* SLIDE 9: CTA */}
                <div className={`${slideStyles.slide} ${currentSlide === 8 ? slideStyles.activeSlide : ''}`} style={{ background: 'var(--brand-dark)' }}>
                    <div className={slideStyles.slideContent} style={{ textAlign: 'center' }}>
                        <RevealSection isActive={currentSlide === 8}>
                            <h2 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '2rem', lineHeight: '1.1' }}>Vamos transformar seus resultados?</h2>
                            <p style={{ fontSize: '1.5rem', color: 'var(--brand-muted)', marginBottom: '4rem', maxWidth: '800px', margin: '0 auto 4rem' }}>
                                Esta proposta está alinhada com os objetivos da <strong style={{ color: 'white' }}>{proposal.company_name}</strong>?
                            </p>
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                <a
                                    href={`https://wa.me/?text=Olá! Gostei da proposta para ${proposal.company_name}, vamos fechar?`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.ctaButton}
                                >
                                    Aceitar Proposta Agora
                                </a>
                            </div>
                            <div style={{ marginTop: '5rem', color: 'var(--brand-muted)', fontSize: '0.9rem' }}>
                                <p>Proposta válida por 15 dias • Pagamento via {PAYMENT_METHODS[proposal.payment_method] || 'PIX'}</p>
                            </div>
                        </RevealSection>
                    </div>
                </div>
            </div>
        </div>
    );
}
