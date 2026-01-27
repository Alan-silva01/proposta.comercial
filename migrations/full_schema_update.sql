-- ==================================================================================
-- CONSOLIDATED DATABASE SCHEMA UPDATES (Jan 2026)
-- Use this file to update the 'proposals' table with all recent features.
-- ==================================================================================

-- 1. HERO MEDIA
-- URL for background image or video (jpg, png, webp, mp4, mov, webm)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS hero_media TEXT;
COMMENT ON COLUMN proposals.hero_media IS 'URL for background image or video in the hero section';

-- 2. OPERATIONAL COSTS (OpenAI Tokens)
-- Costs paid by the client
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cost_per_conversation DECIMAL(10,4);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS estimated_monthly_cost DECIMAL(10,2);
COMMENT ON COLUMN proposals.cost_per_conversation IS 'Average cost per conversation in tokens (OpenAI)';
COMMENT ON COLUMN proposals.estimated_monthly_cost IS 'Estimated monthly cost based on leads * cost';

-- 3. ROADMAP / CHRONOGRAM
-- Integer fields for delivery days
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_analysis_days INTEGER DEFAULT 7;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_approval_days INTEGER DEFAULT 7;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_development_days INTEGER DEFAULT 21;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_testing_days INTEGER DEFAULT 14;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS roadmap_total_days INTEGER DEFAULT 56;

-- 4. CHALLENGES, COMPARISON & MARKET STATS
-- Challenges as a text array
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS challenges TEXT[] DEFAULT '{}';
-- Funnel comparison layers
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS comparison_with_ai TEXT[] DEFAULT '{}';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS comparison_without_ai TEXT[] DEFAULT '{}';
-- Market statistics as JSON
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS market_stats JSONB DEFAULT '[]';
