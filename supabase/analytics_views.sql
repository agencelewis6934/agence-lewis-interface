-- Analytics Views and Functions for Growth Analytics Engine
-- This file creates materialized views and functions for efficient KPI calculations

-- ============================================================================
-- FINANCIAL METRICS
-- ============================================================================

-- View: Monthly Revenue Comparison
CREATE OR REPLACE VIEW analytics_monthly_revenue AS
SELECT
  DATE_TRUNC('month', invoice_date) as month,
  SUM(amount) as total_revenue,
  COUNT(*) as invoice_count,
  SUM(CASE WHEN is_recurring THEN amount ELSE 0 END) as recurring_revenue,
  SUM(CASE WHEN NOT is_recurring THEN amount ELSE 0 END) as one_time_revenue
FROM public.invoices
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

-- View: Overdue Invoices by Age
CREATE OR REPLACE VIEW analytics_overdue_invoices AS
SELECT
  i.id,
  i.client_id,
  c.company_name,
  i.amount,
  i.due_date,
  CURRENT_DATE - i.due_date as days_overdue,
  CASE
    WHEN CURRENT_DATE - i.due_date BETWEEN 1 AND 30 THEN '0-30 days'
    WHEN CURRENT_DATE - i.due_date BETWEEN 31 AND 60 THEN '31-60 days'
    WHEN CURRENT_DATE - i.due_date > 60 THEN '60+ days'
  END as aging_bucket
FROM public.invoices i
LEFT JOIN public.clients c ON i.client_id = c.id
WHERE i.status IN ('sent', 'overdue')
  AND i.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- View: Client LTV by Status
CREATE OR REPLACE VIEW analytics_client_ltv AS
SELECT
  c.id,
  c.company_name,
  c.status,
  c.ltv,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects,
  COALESCE(SUM(i.amount), 0) as total_invoiced,
  COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as total_paid
FROM public.clients c
LEFT JOIN public.projects p ON c.id = p.client_id
LEFT JOIN public.invoices i ON c.id = i.client_id
GROUP BY c.id, c.company_name, c.status, c.ltv;

-- ============================================================================
-- OPERATIONAL METRICS
-- ============================================================================

-- View: Project Status Summary
CREATE OR REPLACE VIEW analytics_project_summary AS
SELECT
  status,
  COUNT(*) as project_count,
  SUM(budget) as total_budget,
  SUM(budget_used) as total_spent,
  AVG(CASE 
    WHEN end_date IS NOT NULL AND start_date IS NOT NULL 
    THEN EXTRACT(day FROM end_date - start_date) 
  END) as avg_duration_days
FROM public.projects
GROUP BY status;

-- View: Team Capacity (Hours)
CREATE OR REPLACE VIEW analytics_team_capacity AS
SELECT
  p.id as user_id,
  p.full_name,
  p.role,
  COALESCE(SUM(t.hours), 0) as hours_this_month,
  COALESCE(SUM(CASE 
    WHEN t.date >= CURRENT_DATE - INTERVAL '7 days' 
    THEN t.hours 
    ELSE 0 
  END), 0) as hours_this_week,
  -- Assuming 160 hours/month capacity (40 hrs/week * 4 weeks)
  ROUND((COALESCE(SUM(t.hours), 0) / 160.0) * 100, 2) as capacity_percentage
FROM public.profiles p
LEFT JOIN public.timesheets t 
  ON p.id = t.user_id 
  AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
WHERE p.role IN ('dev', 'designer', 'pm')
GROUP BY p.id, p.full_name, p.role;

-- View: Task Metrics
CREATE OR REPLACE VIEW analytics_task_metrics AS
SELECT
  t.status,
  COUNT(*) as task_count,
  AVG(EXTRACT(day FROM CURRENT_TIMESTAMP - t.created_at)) as avg_age_days,
  AVG(t.spent_hours) as avg_hours_spent,
  COUNT(CASE WHEN t.deadline < CURRENT_TIMESTAMP AND t.status != 'done' THEN 1 END) as overdue_count
FROM public.tasks t
GROUP BY t.status;

-- View: Project Delay Analysis
CREATE OR REPLACE VIEW analytics_project_delays AS
SELECT
  p.id,
  p.name,
  p.status,
  p.start_date,
  p.end_date,
  p.actual_end_date,
  CASE
    WHEN p.actual_end_date IS NOT NULL AND p.end_date IS NOT NULL
    THEN EXTRACT(day FROM p.actual_end_date - p.end_date)
    WHEN p.status NOT IN ('completed', 'cancelled') AND p.end_date < CURRENT_DATE
    THEN EXTRACT(day FROM CURRENT_DATE - p.end_date)
    ELSE 0
  END as delay_days,
  CASE
    WHEN p.end_date IS NOT NULL AND p.start_date IS NOT NULL
    THEN ROUND(
      (EXTRACT(day FROM 
        COALESCE(p.actual_end_date, CURRENT_DATE) - p.end_date
      ) / NULLIF(EXTRACT(day FROM p.end_date - p.start_date), 0)) * 100,
      2
    )
    ELSE 0
  END as delay_percentage
FROM public.projects p
WHERE p.status NOT IN ('cancelled');

-- ============================================================================
-- PIPELINE METRICS
-- ============================================================================

-- View: Conversion Funnel
CREATE OR REPLACE VIEW analytics_conversion_funnel AS
WITH funnel_data AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'prospect') as prospects,
    COUNT(*) FILTER (WHERE status IN ('prospect', 'active')) as qualified,
    COUNT(*) FILTER (WHERE status = 'active') as active,
    COUNT(*) FILTER (WHERE status = 'active' AND ltv > 0) as paying
  FROM public.clients
)
SELECT
  'Prospects' as stage,
  1 as stage_order,
  prospects as count,
  prospects as value,
  100.0 as conversion_rate
FROM funnel_data
UNION ALL
SELECT
  'Qualified',
  2,
  qualified,
  qualified,
  ROUND((qualified::decimal / NULLIF(prospects, 0)) * 100, 2)
FROM funnel_data
UNION ALL
SELECT
  'Active Clients',
  3,
  active,
  active,
  ROUND((active::decimal / NULLIF(qualified, 0)) * 100, 2)
FROM funnel_data
UNION ALL
SELECT
  'Paying Clients',
  4,
  paying,
  paying,
  ROUND((paying::decimal / NULLIF(active, 0)) * 100, 2)
FROM funnel_data
ORDER BY stage_order;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate MRR (Monthly Recurring Revenue)
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS NUMERIC AS $$
DECLARE
  mrr_value NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO mrr_value
  FROM public.invoices
  WHERE is_recurring = TRUE
    AND status = 'paid'
    AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN mrr_value;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Revenue Forecast
CREATE OR REPLACE FUNCTION get_revenue_forecast(forecast_days INT)
RETURNS TABLE(
  forecast_date DATE,
  predicted_revenue NUMERIC,
  confidence_level TEXT
) AS $$
BEGIN
  -- Simple linear forecast based on last 90 days average
  -- In production, this could use more sophisticated time series analysis
  RETURN QUERY
  WITH historical_avg AS (
    SELECT AVG(daily_sum) as avg_daily_revenue
    FROM (
      SELECT DATE(invoice_date) as day, SUM(amount) as daily_sum
      FROM public.invoices
      WHERE status = 'paid'
        AND invoice_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY DATE(invoice_date)
    ) daily_revenue
  )
  SELECT
    CURRENT_DATE + gs.day as forecast_date,
    (SELECT avg_daily_revenue FROM historical_avg) as predicted_revenue,
    CASE
      WHEN gs.day <= 30 THEN 'high'
      WHEN gs.day <= 60 THEN 'medium'
      ELSE 'low'
    END as confidence_level
  FROM generate_series(1, forecast_days) as gs(day);
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Team Capacity Percentage
CREATE OR REPLACE FUNCTION calculate_team_capacity()
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  role user_role,
  hours_logged NUMERIC,
  capacity_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.role,
    COALESCE(SUM(t.hours), 0) as hours_logged,
    ROUND((COALESCE(SUM(t.hours), 0) / 160.0) * 100, 2) as capacity_pct
  FROM public.profiles p
  LEFT JOIN public.timesheets t 
    ON p.id = t.user_id 
    AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
  WHERE p.role IN ('dev', 'designer', 'pm')
  GROUP BY p.id, p.full_name, p.role
  ORDER BY capacity_pct DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Conversion Rate (Prospects to Active Clients)
CREATE OR REPLACE FUNCTION get_conversion_rate()
RETURNS NUMERIC AS $$
DECLARE
  conversion_rate NUMERIC;
BEGIN
  WITH counts AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'prospect') as prospects,
      COUNT(*) FILTER (WHERE status = 'active') as active_clients
    FROM public.clients
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  )
  SELECT
    CASE 
      WHEN prospects > 0 
      THEN ROUND((active_clients::decimal / prospects) * 100, 2)
      ELSE 0
    END
  INTO conversion_rate
  FROM counts;
  
  RETURN conversion_rate;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes on frequently queried date columns
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_recurring ON public.invoices(status, is_recurring);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON public.timesheets(date);
CREATE INDEX IF NOT EXISTS idx_timesheets_user_date ON public.timesheets(user_id, date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- ============================================================================
-- GRANTS (RLS still applies, these are for view access)
-- ============================================================================

GRANT SELECT ON analytics_monthly_revenue TO authenticated;
GRANT SELECT ON analytics_overdue_invoices TO authenticated;
GRANT SELECT ON analytics_client_ltv TO authenticated;
GRANT SELECT ON analytics_project_summary TO authenticated;
GRANT SELECT ON analytics_team_capacity TO authenticated;
GRANT SELECT ON analytics_task_metrics TO authenticated;
GRANT SELECT ON analytics_project_delays TO authenticated;
GRANT SELECT ON analytics_conversion_funnel TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calculate_mrr() TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_forecast(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_team_capacity() TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_rate() TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW analytics_monthly_revenue IS 'Monthly revenue aggregation with recurring vs one-time breakdown';
COMMENT ON VIEW analytics_overdue_invoices IS 'Overdue invoices grouped by aging buckets (0-30, 31-60, 60+ days)';
COMMENT ON VIEW analytics_client_ltv IS 'Client lifetime value with project and payment summary';
COMMENT ON VIEW analytics_project_summary IS 'Project status summary with budget and duration metrics';
COMMENT ON VIEW analytics_team_capacity IS 'Team member hours and capacity utilization';
COMMENT ON VIEW analytics_task_metrics IS 'Task metrics by status with age and hours analysis';
COMMENT ON VIEW analytics_project_delays IS 'Project delay analysis with percentage calculations';
COMMENT ON VIEW analytics_conversion_funnel IS 'Sales funnel conversion metrics';

COMMENT ON FUNCTION calculate_mrr() IS 'Calculate Monthly Recurring Revenue for current month';
COMMENT ON FUNCTION get_revenue_forecast(INT) IS 'Generate revenue forecast for specified number of days';
COMMENT ON FUNCTION calculate_team_capacity() IS 'Calculate team capacity utilization percentage';
COMMENT ON FUNCTION get_conversion_rate() IS 'Calculate prospect to active client conversion rate (last 90 days)';
