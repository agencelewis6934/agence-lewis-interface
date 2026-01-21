// TypeScript types for Analytics data structures

export interface FinancialKPIs {
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    revenueChange: number;
    revenueChangePercentage: number;
    mrr: number;
    mrrTrend: number;
    overdueInvoices: {
        total: number;
        totalAmount: number;
        by_age: {
            '0-30': { count: number; amount: number };
            '31-60': { count: number; amount: number };
            '60+': { count: number; amount: number };
        };
    };
    conversionRate: number;
    avgLTV: number;
    ltvByClientType: Record<string, number>;
}

export interface OperationalKPIs {
    activeProjects: number;
    completedThisMonth: number;
    teamCapacity: {
        overall: number;
        byRole: Record<string, number>;
        byPerson: Array<{
            userId: string;
            fullName: string;
            role: string;
            hoursLogged: number;
            capacityPercentage: number;
        }>;
    };
    avgTaskAge: number;
    avgProjectDelay: number;
    tasksOverdue: number;
}

export interface PipelineKPIs {
    opportunitiesByStage: Record<string, { count: number; value: number }>;
    weightedForecast: number;
    forecast30Days: number;
    forecast60Days: number;
    forecast90Days: number;
}

export interface TrendDataPoint {
    date: string;
    value: number;
    label?: string;
}

export interface TrendData {
    revenue: TrendDataPoint[];
    mrr: TrendDataPoint[];
    projectsCompleted: TrendDataPoint[];
    teamCapacity: TrendDataPoint[];
}

export interface HeatmapCell {
    userId: string;
    userName: string;
    projectId: string;
    projectName: string;
    hours: number;
    capacityPercentage: number;
}

export interface HeatmapData {
    users: Array<{ id: string; name: string; role: string }>;
    projects: Array<{ id: string; name: string }>;
    cells: HeatmapCell[];
}

export interface FunnelStage {
    stage: string;
    stageOrder: number;
    count: number;
    value: number;
    conversionRate: number;
}

export interface ForecastDataPoint {
    date: string;
    actual?: number;
    predicted: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    upperBound?: number;
    lowerBound?: number;
}

export interface OverdueInvoice {
    id: string;
    clientId: string;
    companyName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    agingBucket: '0-30 days' | '31-60 days' | '60+ days';
}

export interface ProjectAtRisk {
    id: string;
    name: string;
    status: string;
    delayDays: number;
    delayPercentage: number;
    budgetUsedPercentage: number;
}

export interface TopClient {
    id: string;
    companyName: string;
    totalRevenue: number;
    projectCount: number;
    ltv: number;
    status: string;
}

export interface AnalyticsFilters {
    dateRange: {
        start: Date;
        end: Date;
        preset?: '7d' | '30d' | '90d' | 'custom';
    };
    clientType?: string[];
    projectStatus?: string[];
    teamMember?: string[];
}

export interface AnalyticsDashboardData {
    financial: FinancialKPIs;
    operational: OperationalKPIs;
    pipeline: PipelineKPIs;
    trends: TrendData;
    heatmap: HeatmapData;
    funnel: FunnelStage[];
    forecast: ForecastDataPoint[];
    filters: AnalyticsFilters;
    lastUpdated: string;
}

// API Response types
export interface AnalyticsAPIResponse<T> {
    data: T;
    timestamp: string;
    cached: boolean;
}

// Database view types (matching SQL views)
export interface MonthlyRevenue {
    month: string;
    total_revenue: number;
    invoice_count: number;
    recurring_revenue: number;
    one_time_revenue: number;
}

export interface TeamCapacityRecord {
    user_id: string;
    full_name: string;
    role: string;
    hours_logged: number;
    capacity_pct: number;
}

export interface ProjectSummary {
    status: string;
    project_count: number;
    total_budget: number;
    total_spent: number;
    avg_duration_days: number;
}
