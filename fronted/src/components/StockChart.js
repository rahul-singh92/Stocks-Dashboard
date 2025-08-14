import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function StockChart({ prices }) {
    const labels = prices.map(p => p.Date);
    const closes = prices.map(p => p.Close);

    // Calculate overall performance for main color
    const firstPrice = closes[0];
    const lastPrice = closes[closes.length - 1];
    const isPositive = lastPrice >= firstPrice;

    // Create color array for each data point
    const createPointColors = () => {
        const colors = [];

        for (let i = 0; i < closes.length; i++) {
            if (i === 0) {
                colors.push('#64748b'); // Neutral color for first point
            } else {
                const current = closes[i];
                const previous = closes[i - 1];
                colors.push(current >= previous ? '#22c55e' : '#ef4444');
            }
        }
        return colors;
    };

    const pointColors = createPointColors();

    // Create gradient for the overall trend
    const createGradient = (ctx, chartArea) => {
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

    const data = {
        labels,
        datasets: [{
            label: `${prices[0]?.symbol || 'Stock'} Price ${isPositive ? '📈' : '📉'}`, // Single label
            data: closes,
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 2, // Show small points to see color changes
            pointBackgroundColor: pointColors, // Dynamic point colors
            pointBorderColor: pointColors,
            pointHoverRadius: 8,
            pointHoverBorderWidth: 3,
            pointHoverBorderColor: '#ffffff',
            borderColor: function (context) {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                return createGradient(ctx, chartArea);
            },
            backgroundColor: function (context) {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                return 'rgba(34, 197, 94, 0.05)'; // Light fill
            },
            fill: true,
        }]
    };

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
                    font: { size: 11, weight: '500' }
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
                        const previousPrice = context.dataIndex > 0 ?
                            context.dataset.data[context.dataIndex - 1] : price;
                        const change = price - previousPrice;
                        const changePercent = previousPrice !== 0 ?
                            ((change / previousPrice) * 100).toFixed(2) : 0;

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

    return (
        <div className="card" style={{
            position: 'relative',
            height: '500px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}>
            <Line data={data} options={options} />
        </div>
    );
}
