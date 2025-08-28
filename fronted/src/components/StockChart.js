import React from "react";
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export default function StockChart({ prices, chartType = 'line' }) {
    if (!prices || prices.length === 0) {
        return (
            <div className="card" style={{
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
                borderRadius: '12px',
                color: '#a1a1aa'
            }}>
                <p>No data available</p>
            </div>
        );
    }

    const labels = prices.map(p => p.Date);
    const closes = prices.map(p => p.Close);
    const opens = prices.map(p => p.Open);
    const highs = prices.map(p => p.High);
    const lows = prices.map(p => p.Low);

    // Calculate overall performance
    const firstPrice = closes[0];
    const lastPrice = closes[closes.length - 1];
    const isPositive = lastPrice >= firstPrice;

    // Create point colors for line charts
    const createPointColors = () => {
        const colors = [];
        for (let i = 0; i < closes.length; i++) {
            if (i === 0) {
                colors.push('#64748b');
            } else {
                const current = closes[i];
                const previous = closes[i - 1];
                colors.push(current >= previous ? '#22c55e' : '#ef4444');
            }
        }
        return colors;
    };

    // Create gradient
    const createGradient = (ctx, chartArea, isPositive) => {
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        if (isPositive) {
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.1)');
            gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.4)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.8)');
        } else {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
            gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.8)');
        }
        return gradient;
    };

    // Generate chart data based on type
    const getChartData = () => {
        const pointColors = createPointColors();
        
        switch (chartType) {
            case 'line':
                return {
                    labels,
                    datasets: [{
                        label: `${prices[0]?.symbol || 'Stock'} Price ${isPositive ? '📈' : '📉'}`,
                        data: closes,
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: pointColors,
                        pointBorderColor: pointColors,
                        pointHoverRadius: 8,
                        pointHoverBorderWidth: 3,
                        pointHoverBorderColor: '#ffffff',
                        borderColor: function (context) {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return null;
                            return createGradient(ctx, chartArea, isPositive);
                        },
                        backgroundColor: 'rgba(34, 197, 94, 0.05)',
                        fill: false,
                    }]
                };

            case 'area':
                return {
                    labels,
                    datasets: [{
                        label: `${prices[0]?.symbol || 'Stock'} Price ${isPositive ? '📈' : '📉'}`,
                        data: closes,
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        borderColor: isPositive ? '#22c55e' : '#ef4444',
                        backgroundColor: function (context) {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return null;
                            return createGradient(ctx, chartArea, isPositive);
                        },
                        fill: true,
                    }]
                };

            case 'bar':
                return {
                    labels,
                    datasets: [{
                        label: `${prices[0]?.symbol || 'Stock'} Daily Close ${isPositive ? '📈' : '📉'}`,
                        data: closes,
                        backgroundColor: pointColors.map(color => color + '80'), // Add transparency
                        borderColor: pointColors,
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false,
                    }]
                };

            case 'candlestick':
                // For candlestick, we'll show High-Low range with Open-Close overlay
                return {
                    labels,
                    datasets: [
                        {
                            label: 'High-Low Range',
                            data: highs.map((high, i) => ({ x: i, y: [lows[i], high] })),
                            backgroundColor: 'rgba(100, 116, 139, 0.3)',
                            borderColor: '#64748b',
                            borderWidth: 1,
                            type: 'bar'
                        },
                        {
                            label: 'Open-Close',
                            data: closes,
                            borderColor: pointColors,
                            backgroundColor: pointColors.map(color => color + '60'),
                            borderWidth: 2,
                            pointRadius: 4,
                            pointStyle: 'rect'
                        }
                    ]
                };

            default:
                return getChartData();
        }
    };

    // Chart options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                ticks: {
                    color: "#a1a1aa",
                    font: { size: 11, weight: '500' },
                    maxTicksLimit: 10
                },
                grid: {
                    color: "rgba(255,255,255,0.05)",
                    drawBorder: false
                },
                border: { display: false }
            },
            y: {
                ticks: {
                    color: "#a1a1aa",
                    font: { size: 11, weight: '500' },
                    callback: function (value) {
                        return '₹' + value.toLocaleString();
                    }
                },
                grid: {
                    color: "rgba(255,255,255,0.05)",
                    drawBorder: false
                },
                border: { display: false }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: "#e4e4e7",
                    font: { size: 13, weight: '600' },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#f3f4f6',
                borderColor: isPositive ? '#22c55e' : '#ef4444',
                borderWidth: 2,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    title: function (context) {
                        return `📅 ${context[0].label}`;
                    },
                    label: function (context) {
                        const price = context.parsed.y;
                        const dataIndex = context.dataIndex;
                        
                        if (chartType === 'candlestick' && prices[dataIndex]) {
                            const { Open, High, Low, Close } = prices[dataIndex];
                            return [
                                `💰 Open: ₹${Open?.toLocaleString()}`,
                                `📈 High: ₹${High?.toLocaleString()}`,
                                `📉 Low: ₹${Low?.toLocaleString()}`,
                                `🔒 Close: ₹${Close?.toLocaleString()}`
                            ];
                        }
                        
                        const previousPrice = dataIndex > 0 ? context.dataset.data[dataIndex - 1] : price;
                        const change = price - previousPrice;
                        const changePercent = previousPrice !== 0 ? ((change / previousPrice) * 100).toFixed(2) : 0;
                        const arrow = change >= 0 ? '↗️' : '↘️';
                        const changeColor = change >= 0 ? '+' : '';
                        const dayDirection = change >= 0 ? 'Up' : 'Down';

                        return [
                            `💰 Close: ₹${price.toLocaleString()}`,
                            `${arrow} Day ${dayDirection}: ${changeColor}₹${change.toFixed(2)} (${changeColor}${changePercent}%)`
                        ];
                    }
                }
            }
        }
    };

    // Render appropriate chart component
    const renderChart = () => {
        const data = getChartData();
        
        switch (chartType) {
            case 'bar':
            case 'candlestick':
                return <Bar data={data} options={options} />;
            default:
                return <Line data={data} options={options} />;
        }
    };

    return (
        <div className="card" style={{
            position: 'relative',
            height: '500px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}>
            {renderChart()}
        </div>
    );
}
