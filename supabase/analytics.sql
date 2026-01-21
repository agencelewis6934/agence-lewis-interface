-- ==============================================
-- ANALYTICS VIEWS AND FUNCTIONS
-- ==============================================
-- Add this section at the end of your schema.sql file

-- Monthly Revenue Aggregation View
CREATE OR REPLACE VIEW public.analytics_monthly_revenue AS
SELECT
  DATE_TRUNC('month', i.invoice_date)::date AS month,
  SUM(i.amount) FILTER (WHERE i.status = 'paid') AS total_revenue,
  SUM(i.amount) FILTER (WHERE i.status = 'paid' AND p.tags && ARRAY['recurring']) AS recurring_revenue
FROM public.invoices i
LEFT JOIN public.projects p ON i.project_id = p.id
WHERE i.invoice_date IS NOT NULL
GROUP BY month
ORDER BY month DESC;

-- Overdue Invoices View
CREATE OR REPLACE VIEW public.analytics_overdue_invoices AS
SELECT
  i.id,
  i.client_id,
  c.company_name,
  i.amount,
  i.due_date,
  CURRENT_DATE - i.due_date AS days_overdue,
  CASE
    WHEN CURRENT_DATE - i.due_date <= 30 THEN '0-30 days'
    WHEN CURRENT_DATE - i.due_date <= 60 THEN '31-60 days'
    ELSE '60+ days'
  END AS aging_bucket
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
WHERE i.status = 'overdue'
  AND i.due_date < CURRENT_DATE;

-- Client LTV View
CREATE OR REPLACE VIEW public.analytics_client_ltv AS
SELECT
  c.id,
  c.company_name,
  c.status,
  c.ltv,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0) AS total_paid,
  COUNT(DISTINCT p.id) AS total_projects
FROM public.clients c
LEFT JOIN public.projects p ON c.id = p.client_id
LEFT JOIN public.invoices i ON p.id = i.project_id
GROUP BY c.id, c.company_name, c.status, c.ltv;

-- Project Summary View
CREATE OR REPLACE VIEW public.analytics_project_summary AS
SELECT
  status,
  COUNT(*) AS project_count,
  SUM(budget) AS total_budget,
  SUM(budget_used) AS total_spent
FROM public.projects
GROUP BY status;

-- Task Metrics View
CREATE OR REPLACE VIEW public.analytics_task_metrics AS
SELECT
  t.status,
  COUNT(*) AS task_count,
  AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - t.created_at))) AS avg_age_days,
  COUNT(*) FILTER (WHERE t.deadline < CURRENT_TIMESTAMP AND t.status != 'done') AS overdue_count
FROM public.tasks t
GROUP BY t.status;

-- Project Delays View
CREATE OR REPLACE VIEW public.analytics_project_delays AS
SELECT
  p.id,
  p.name,
  p.status,
  CASE
    WHEN p.end_date IS NOT NULL AND p.end_date < CURRENT_DATE AND p.status != 'completed'
    THEN CURRENT_DATE - p.end_date
    ELSE 0
  END AS delay_days,
  CASE
    WHEN p.end_date IS NOT NULL AND p.start_date IS NOT NULL AND p.end_date < CURRENT_DATE
    THEN ((CURRENT_DATE - p.end_date)::float / NULLIF(p.end_date - p.start_date, 0)::float) * 100
    ELSE 0
  END AS delay_percentage
FROM public.projects p
WHERE p.status IN ('in_progress', 'review');

-- Conversion Funnel View
CREATE OR REPLACE VIEW public.analytics_conversion_funnel AS
WITH funnel_data AS (
  SELECT
    CASE
      WHEN pipeline_stage IS NULL THEN 'Unknown'
      ELSE pipeline_stage
    END AS stage,
    CASE
      WHEN pipeline_stage = 'lead' THEN 1
      WHEN pipeline_stage = 'qualified' THEN 2
      WHEN pipeline_stage = 'proposal' THEN 3
      WHEN pipeline_stage = 'negotiation' THEN 4
      WHEN pipeline_stage = 'closed_won' THEN 5
      ELSE 0
    END AS stage_order,
    COUNT(*) AS count,
    SUM(ltv) AS value
  FROM public.clients
  WHERE status IN ('prospect', 'active')
  GROUP BY pipeline_stage
)
SELECT
  stage,
  stage_order,
  count,
  value,
  ROUND((count::float / NULLIF(SUM(count) OVER (), 0)) * 100, 2) AS conversion_rate
FROM funnel_data
ORDER BY stage_order;

-- Calculate MRR Function
CREATE OR REPLACE FUNCTION public.calculate_mrr()
RETURNS NUMERIC AS $$
DECLARE
  mrr_value NUMERIC;
BEGIN
  SELECT COALESCE(SUM(i.amount) / 12, 0)
  INTO mrr_value
  FROM public.invoices i
  JOIN public.projects p ON i.project_id = p.id
  WHERE i.status = 'paid'
    AND p.tags && ARRAY['recurring']
    AND i.invoice_date >= CURRENT_DATE - INTERVAL '12 months';
  
  RETURN mrr_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate Conversion Rate Function
CREATE OR REPLACE FUNCTION public.get_conversion_rate()
RETURNS NUMERIC AS $$
DECLARE
  conversion_rate NUMERIC;
BEGIN
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE status = 'active')::float / 
     NULLIF(COUNT(*), 0)) * 100,
    2
  )
  INTO conversion_rate
  FROM public.clients
  WHERE status IN ('prospect', 'active');
  
  RETURN COALESCE(conversion_rate, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate Team Capacity Function
CREATE OR REPLACE FUNCTION public.calculate_team_capacity()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  role user_role,
  hours_logged NUMERIC,
  capacity_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
    p.role,
    COALESCE(SUM(ts.hours), 0) AS hours_logged,
    ROUND((COALESCE(SUM(ts.hours), 0) / NULLIF(160, 0)) * 100, 2) AS capacity_pct  -- 160 = monthly capacity
  FROM public.profiles p
  LEFT JOIN public.timesheets ts ON p.id = ts.user_id
    AND ts.date >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY p.id, p.full_name, p.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revenue Forecast Function
CREATE OR REPLACE FUNCTION public.get_revenue_forecast(forecast_days INTEGER DEFAULT 90)
RETURNS TABLE (
  forecast_date DATE,
  predicted_revenue NUMERIC,
  confidence_level TEXT
) AS $$
DECLARE
  avg_daily_revenue NUMERIC;
BEGIN
  -- Calculate average daily revenue from last 30 days
  SELECT COALESCE(SUM(amount) / 30, 0)
  INTO avg_daily_revenue
  FROM public.invoices
  WHERE status = 'paid'
    AND invoice_date >= CURRENT_DATE - INTERVAL '30 days';

  RETURN QUERY
  SELECT
    CURRENT_DATE + days AS forecast_date,
    avg_daily_revenue * (1 + (RANDOM() * 0.2 - 0.1)) AS predicted_revenue,  -- ±10% variance
    CASE
      WHEN days <= 30 THEN 'high'
      WHEN days <= 60 THEN 'medium'
      ELSE 'low'
    END AS confidence_level
  FROM generate_series(1, forecast_days) AS days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON public.analytics_monthly_revenue TO authenticated;
GRANT SELECT ON public.analytics_overdue_invoices TO authenticated;
GRANT SELECT ON public.analytics_client_ltv TO authenticated;
GRANT SELECT ON public.analytics_project_summary TO authenticated;
GRANT SELECT ON public.analytics_task_metrics TO authenticated;
GRANT SELECT ON public.analytics_project_delays TO authenticated;
GRANT SELECT ON public.analytics_conversion_funnel TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_mrr() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_team_capacity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_forecast(INTEGER) TO authenticated;
