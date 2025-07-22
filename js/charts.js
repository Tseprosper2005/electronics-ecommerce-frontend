// frontend/js/charts.js

import { wrapLabel } from './utils.js'; // Import utility for label wrapping

// Mock sales data (will eventually come from backend API for admin dashboard)
const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    revenue: [12000, 15000, 13000, 18000, 20000, 19000, 22000, 21000, 25000, 23000, 28000, 30000],
    unitsSold: [800, 950, 850, 1100, 1200, 1150, 1300, 1250, 1500, 1400, 1700, 1800],
    categoryRevenue: {
        'Microcontrollers': 10000,
        'Diodes': 500,
        'Transistors': 700,
        'Resistors': 200,
        'Capacitors': 300,
        'Sensors': 1500,
        'Integrated Circuits': 1000,
        'Prototyping': 5000
    },
    categoryAvgPrice: {
        'Microcontrollers': 20.25,
        'Diodes': 0.12,
        'Transistors': 0.28,
        'Resistors': 0.06,
        'Capacitors': 0.09,
        'Sensors': 1.80,
        'Integrated Circuits': 0.80,
        'Prototyping': 6.50
    }
};

// Common Chart.js options for consistency
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Important for responsive canvas sizing
    plugins: {
        legend: {
            position: 'top',
            labels: {
                font: {
                    family: 'Inter'
                }
            }
        },
        tooltip: {
            callbacks: {
                title: function(context) {
                    return wrapLabel(context[0].label, 20).join('\n');
                }
            },
            bodyFont: {
                family: 'Inter'
            },
            titleFont: {
                family: 'Inter'
            }
        }
    },
    scales: {
        x: {
            ticks: {
                font: {
                    family: 'Inter'
                },
                callback: function(value, index, values) {
                    return wrapLabel(this.getLabelForValue(value), 16);
                }
            }
        },
        y: {
            ticks: {
                font: {
                    family: 'Inter'
                }
            }
        }
    }
};

let revenueChartInstance = null;
let unitsSoldChartInstance = null;
let categoryRevenueChartInstance = null;
let avgPriceChartInstance = null;

// Function to initialize and render all charts
export function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        if (revenueChartInstance) revenueChartInstance.destroy(); // Destroy old instance if exists
        revenueChartInstance = new Chart(revenueCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Monthly Revenue (USD)',
                    data: salesData.revenue,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                ...commonChartOptions,
                scales: {
                    x: { ...commonChartOptions.scales.x },
                    y: {
                        ...commonChartOptions.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (USD)',
                            font: { family: 'Inter' }
                        }
                    }
                }
            }
        });
    }

    // Units Sold Chart
    const unitsSoldCtx = document.getElementById('unitsSoldChart');
    if (unitsSoldCtx) {
        if (unitsSoldChartInstance) unitsSoldChartInstance.destroy();
        unitsSoldChartInstance = new Chart(unitsSoldCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Units Sold',
                    data: salesData.unitsSold,
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: 'rgb(139, 92, 246)',
                    borderWidth: 1
                }]
            },
            options: {
                ...commonChartOptions,
                scales: {
                    x: { ...commonChartOptions.scales.x },
                    y: {
                        ...commonChartOptions.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units',
                            font: { family: 'Inter' }
                        }
                    }
                }
            }
        });
    }

    // Category Revenue Chart (Donut)
    const categoryRevenueCtx = document.getElementById('categoryRevenueChart');
    if (categoryRevenueCtx) {
        if (categoryRevenueChartInstance) categoryRevenueChartInstance.destroy();
        categoryRevenueChartInstance = new Chart(categoryRevenueCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(salesData.categoryRevenue),
                datasets: [{
                    data: Object.values(salesData.categoryRevenue),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)',
                        'rgba(148, 163, 184, 0.8)'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                ...commonChartOptions,
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                plugins: {
                    ...commonChartOptions.plugins,
                    tooltip: {
                        callbacks: {
                            ...commonChartOptions.plugins.tooltip.callbacks,
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Average Price by Category Chart (Bar)
    const avgPriceCtx = document.getElementById('avgPriceChart');
    if (avgPriceCtx) {
        if (avgPriceChartInstance) avgPriceChartInstance.destroy();
        avgPriceChartInstance = new Chart(avgPriceCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(salesData.categoryAvgPrice),
                datasets: [{
                    label: 'Average Price (USD)',
                    data: Object.values(salesData.categoryAvgPrice),
                    backgroundColor: 'rgba(234, 179, 8, 0.6)',
                    borderColor: 'rgb(234, 179, 8)',
                    borderWidth: 1
                }]
            },
            options: {
                ...commonChartOptions,
                scales: {
                    x: { ...commonChartOptions.scales.x },
                    y: {
                        ...commonChartOptions.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Average Price (USD)',
                            font: { family: 'Inter' }
                        }
                    }
                }
            }
        });
    }
}
