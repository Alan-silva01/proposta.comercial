-- Add operational cost columns to proposals table
-- These are costs paid by the client (OpenAI tokens)

ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS cost_per_conversation DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS estimated_monthly_cost DECIMAL(10,2);

-- Comments for documentation
COMMENT ON COLUMN proposals.cost_per_conversation IS 'Average cost per conversation in tokens (OpenAI) - paid by client';
COMMENT ON COLUMN proposals.estimated_monthly_cost IS 'Estimated monthly cost based on leads_received * cost_per_conversation';
