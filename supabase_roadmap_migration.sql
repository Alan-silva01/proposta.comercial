-- Rode este SQL no painel do Supabase (SQL Editor)
-- Adiciona campos de cronograma/roadmap, challenges e dados dinâmicos na tabela proposals

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_analysis_days INTEGER DEFAULT 7;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_approval_days INTEGER DEFAULT 7;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_development_days INTEGER DEFAULT 21;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_testing_days INTEGER DEFAULT 14;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_total_days INTEGER DEFAULT 56;

-- Adiciona coluna de desafios (array de texto)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS challenges TEXT[] DEFAULT '{}';

-- Adiciona colunas para comparativo e dados de mercado dinâmicos
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS comparison_with_ai TEXT[] DEFAULT '{}';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS comparison_without_ai TEXT[] DEFAULT '{}';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS market_stats JSONB DEFAULT '[]';
