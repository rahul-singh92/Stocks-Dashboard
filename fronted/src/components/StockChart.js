import React, { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from "chart.js";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochasticOscillator
} from '../utils/technicalIndicators';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export default function StockChart({ prices, chartType = 'line', technicalIndicators = {} }) {
    const chartData = useMemo(() => {
        if (!prices || prices.length === 0) return null;

        const labels = prices.map(p => p.Date);
        const closes = prices.map(p => p.Close);
        const opens = prices.map(p => p.Open);
        const highs = prices.map(p => p.High);
        const lows = prices.map(p => p.Low);
        const volumes = prices.map(p => p.Volume || 0);

        // Calculate technical indicators
        const indicators = {};
        
        Object.keys(technicalIndicators).forEach(key => {
            if (!technicalIndicators[key]) return;
            
            const [indicatorType, period] = key.split('_');
            
            switch (indicatorType) {
                case 'sma':
                    indicators[key] = calculateSMA(closes, parseInt(period));
                    break;
                case 'ema':
                    indicators[key] = calculateEMA(closes, parseInt(period));
                    break;
                case 'rsi':
                    indicators[key] = calculateRSI(closes);
                    break;
                case 'macd':
                    indicators[key] = calculateMACD(closes);
                    break;
                case 'bollinger':
                    indicators[key] = calculateBollingerBands(closes);
                    break;
                case 'stochastic':
                    indicators[key] = calculateStochasticOscillator(highs, lows, closes);
                    break;
                default:
                    break;
            }
        });

        return {
            labels,
            closes,
            opens,
            highs,
            lows,
            volumes,
            indicators
        };
    }, [prices, technicalIndicators]);

    if (!chartData) {
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

    const { labels, closes, indicators } = chartData;

    // Calculate overall performance
    const firstPrice = closes[0];
    const lastPrice = closes[closes.length - 1];
    const isPositive = lastPrice >= firstPrice;

    // Color utilities
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

    // Build datasets
    const datasets = [];
    const pointColors = createPointColors();

    // Main price dataset
    const mainDataset = {
        label: `${prices[0]?.symbol || 'Stock'} Price ${isPositive ? '📈' : '📉'}`,
        data: closes,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 1,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: '#ffffff',
        borderColor: function (context) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            return createGradient(ctx, chartArea, isPositive);
        },
        backgroundColor: chartType === 'area' ? function (context) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            return createGradient(ctx, chartArea, isPositive);
        } : 'rgba(34, 197, 94, 0.05)',
        fill: chartType === 'area',
        yAxisID: 'y'
    };

    datasets.push(mainDataset);

    // Add technical indicator datasets
    const indicatorColors = [
        '#3b82f6', // Blue
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ef4444', // Red
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#ec4899', // Pink
        '#6366f1'  // Indigo
    ];

    let colorIndex = 0;

    Object.entries(indicators).forEach(([key, data]) => {
        const [indicatorType, period] = key.split('_');
        const color = indicatorColors[colorIndex % indicatorColors.length];
        
        switch (indicatorType) {
            case 'sma':
            case 'ema':
                datasets.push({
                    label: `${indicatorType.toUpperCase()} (${period})`,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    fill: false,
                    yAxisID: 'y'
                });
                colorIndex++;
                break;

            case 'bollinger':
                // Upper band
                datasets.push({
                    label: 'Bollinger Upper',
                    data: data.upper,
                    borderColor: indicatorColors[colorIndex % indicatorColors.length],
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                });
                
                // Middle band (SMA)
                datasets.push({
                    label: 'Bollinger Middle',
                    data: data.middle,
                    borderColor: indicatorColors[(colorIndex + 1) % indicatorColors.length],
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                });
                
                // Lower band
                datasets.push({
                    label: 'Bollinger Lower',
                    data: data.lower,
                    borderColor: indicatorColors[colorIndex % indicatorColors.length],
                    backgroundColor: indicatorColors[colorIndex % indicatorColors.length] + '10',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: '+1',
                    yAxisID: 'y'
                });
                colorIndex += 2;
                break;

            case 'rsi':
                datasets.push({
                    label: 'RSI (14)',
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    fill: false,
                    yAxisID: 'y1'
                });
                colorIndex++;
                break;

            case 'macd':
                datasets.push({
                    label: 'MACD Line',
                    data: data.macd,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y1'
                });
                
                datasets.push({
                    label: 'Signal Line',
                    data: data.signal,
                    borderColor: indicatorColors[(colorIndex + 1) % indicatorColors.length],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y1'
                });
                colorIndex += 2;
                break;

            case 'stochastic':
                datasets.push({
                    label: '%K',
                    data: data.k,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y1'
                });
                
                datasets.push({
                    label: '%D',
                    data: data.d,
                    borderColor: indicatorColors[(colorIndex + 1) % indicatorColors.length],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y1'
                });
                colorIndex += 2;
                break;

            default:
                break;
        }
    });

    // Chart configuration
    const hasSecondaryIndicators = Object.keys(indicators).some(key => 
        key.includes('rsi') || key.includes('macd') || key.includes('stochastic')
    );

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
                type: 'linear',
                display: true,
                position: 'left',
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
            },
            ...(hasSecondaryIndicators && {
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                        color: "#a1a1aa",
                        font: { size: 11, weight: '500' }
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    border: { display: false }
                }
            })
        },
        plugins: {
            legend: {
                labels: {
                    color: "#e4e4e7",
                    font: { size: 12, weight: '500' },
                    usePointStyle: true,
                    pointStyle: 'line',
                    filter: function(item, chart) {
                        // Don't show hidden datasets in legend
                        return !item.text.includes('Hidden');
                    }
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
                displayColors: true,
                callbacks: {
                    title: function (context) {
                        return `📅 ${context[0].label}`;
                    },
                    label: function (context) {
                        const { datasetIndex, parsed } = context;
                        const dataset = datasets[datasetIndex];
                        
                        if (dataset.label.includes('Price')) {
                            const price = parsed.y;
                            const dataIndex = context.dataIndex;
                            const previousPrice = dataIndex > 0 ? closes[dataIndex - 1] : price;
                            const change = price - previousPrice;
                            const changePercent = previousPrice !== 0 ? ((change / previousPrice) * 100).toFixed(2) : 0;
                            const arrow = change >= 0 ? '↗️' : '↘️';
                            const changeColor = change >= 0 ? '+' : '';
                            
                            return `💰 ${dataset.label}: ₹${price.toLocaleString()} ${arrow} ${changeColor}${changePercent}%`;
                        }
                        
                        if (parsed.y !== null && parsed.y !== undefined) {
                            return `${dataset.label}: ${parsed.y.toFixed(2)}`;
                        }
                        
                        return null;
                    }
                }
            }
        }
    };

    const data = { labels, datasets };

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
