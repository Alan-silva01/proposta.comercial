import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate unique slug for proposals
export function generateSlug() {
  return Math.random().toString(36).substring(2, 10);
}

// Calculate ROI
export function calculateROI(proposal, conservative = false) {
  const {
    leads_received,
    leads_responded,
    leads_scheduled,
    leads_showed_up,
    leads_converted,
    average_ticket,
    ltv,
    funnel_type,
    projected_response_rate,
    projected_conversion_rate,
    projected_show_rate,
  } = proposal;

  const ticketValue = ltv || average_ticket || 0;
  const divisor = conservative ? 2 : 1;

  // Current state
  const currentRevenue = (leads_converted || 0) * ticketValue;

  // Calculate actual current conversion rate if projected is not set
  const currentConversionRate = leads_responded > 0
    ? (leads_converted / leads_responded) * 100
    : 10; // Default 10%

  const conversionRateToUse = projected_conversion_rate || currentConversionRate;
  const responseRateToUse = projected_response_rate || 95;

  // Projected with AI
  let projectedLeadsResponded = Math.round((leads_received || 0) * (responseRateToUse / 100));
  let projectedConverted;

  if (funnel_type === 'scheduling') {
    const projectedScheduled = Math.round(projectedLeadsResponded * (conversionRateToUse / 100));
    const projectedShowedUp = Math.round(projectedScheduled * ((projected_show_rate || 80) / 100));
    projectedConverted = projectedShowedUp;
  } else {
    projectedConverted = Math.round(projectedLeadsResponded * (conversionRateToUse / 100));
  }

  const projectedRevenue = projectedConverted * ticketValue;
  const revenueIncrease = Math.max(0, (projectedRevenue - currentRevenue) / divisor);
  const roiPercentage = currentRevenue > 0
    ? Math.round(((projectedRevenue / currentRevenue) - 1) * 100) / divisor
    : 0;

  return {
    currentRevenue,
    projectedRevenue: currentRevenue + revenueIncrease,
    revenueIncrease,
    roiPercentage,
    projectedConverted: Math.round(projectedConverted / divisor),
    projectedLeadsResponded,
  };
}
