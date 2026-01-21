// Utility functions for analytics calculations and formatting
import { format } from 'date-fns';

/**
 * Format a number as EUR currency
 */
export function formatCurrency(value: number, locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format a number as a percentage with +/- sign
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    const formatted = value.toFixed(decimals);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
}

/**
 * Calculate percentage change between two values
 */
export function calculateTrend(current: number, previous: number): {
    change: number;
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
} {
    const change = current - previous;
    const percentage = previous !== 0 ? (change / previous) * 100 : 0;

    return {
        change,
        percentage,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
}

/**
 * Calculate weighted forecast based on opportunity values and probabilities
 */
export function calculateWeightedForecast(
    opportunities: Array<{ value: number; probability: number }>
): number {
    return opportunities.reduce((sum, opp) => {
        return sum + (opp.value * (opp.probability / 100));
    }, 0);
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
): void {
    if (data.length === 0) return;

    // Determine columns
    const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

    // Create CSV header
    const header = cols.map(col => col.label).join(',');

    // Create CSV rows
    const rows = data.map(row => {
        return cols.map(col => {
            const value = row[col.key];
            // Escape values containing commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generate PDF from a DOM element
 */
export async function generatePDF(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
    }

    // Dynamically import jspdf and html2canvas for code splitting
    const { default: jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Capture element as canvas
    const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
}

/**
 * Format a number with abbreviation (K, M, B)
 */
export function formatCompactNumber(value: number): string {
    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B';
    }
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0);
}

/**
 * Get color based on percentage value
 */
export function getPercentageColor(percentage: number, reversed: boolean = false): string {
    if (reversed) {
        // For metrics where lower is better (e.g., delay percentage)
        if (percentage > 20) return '#EF4444'; // red-500
        if (percentage > 10) return '#F59E0B'; // amber-500
        return '#10B981'; // green-500
    } else {
        // For metrics where higher is better (e.g., capacity, revenue)
        if (percentage < -10) return '#EF4444'; // red-500
        if (percentage < 0) return '#F59E0B'; // amber-500
        return '#10B981'; // green-500
    }
}

/**
 * Get color for capacity heatmap
 */
export function getCapacityColor(percentage: number): string {
    if (percentage > 100) return '#DC2626'; // red-600 (overallocated)
    if (percentage >= 90) return '#F59E0B'; // amber-500 (nearly full)
    if (percentage >= 70) return '#10B981'; // green-500 (healthy)
    if (percentage >= 50) return '#3B82F6'; // blue-500 (moderate)
    return '#6B7280'; // gray-500 (underutilized)
}

/**
 * Calculate moving average for trend smoothing
 */
export function calculateMovingAverage(
    data: Array<{ value: number }>,
    window: number = 7
): number[] {
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - window + 1);
        const slice = data.slice(start, i + 1);
        const average = slice.reduce((sum, item) => sum + item.value, 0) / slice.length;
        result.push(average);
    }

    return result;
}

/**
 * Group data by time period
 */
export function groupByPeriod<T>(
    data: T[],
    dateField: keyof T,
    period: 'day' | 'week' | 'month'
): Record<string, T[]> {
    return data.reduce((acc, item) => {
        const date = new Date(item[dateField] as any);
        let key: string;

        switch (period) {
            case 'day':
                key = format(date, 'yyyy-MM-dd');
                break;
            case 'week':
                key = format(date, 'yyyy-ww');
                break;
            case 'month':
                key = format(date, 'yyyy-MM');
                break;
        }

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);

        return acc;
    }, {} as Record<string, T[]>);
}

/**
 * Determine if a value is an outlier using IQR method
 */
export function isOutlier(value: number, dataset: number[]): boolean {
    const sorted = [...dataset].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return value < lowerBound || value > upperBound;
}
