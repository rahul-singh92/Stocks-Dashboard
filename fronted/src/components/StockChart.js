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

    const { labels, closes, opens, highs, lows, volumes, indicators } = chartData;

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

    // Generate chart data based on chart type
    const getChartData = () => {
        const datasets = [];
        const pointColors = createPointColors();

        // Main price dataset - different for each chart type
        switch (chartType) {
            case 'bar':
                datasets.push({
                    label: `${prices[0]?.symbol || 'Stock'} Price ${isPositive ? '📈' : '📉'}`,
                    data: closes,
                    backgroundColor: pointColors.map(color => color + '80'),
                    borderColor: pointColors,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                    yAxisID: 'y'
                });
                break;
                
            case 'candlestick':
                // Simplified candlestick representation using bars
                const candlestickData = closes.map((close, i) => ({
                    x: i,
                    y: close,
                    open: opens[i],
                    high: highs[i],
                    low: lows[i]
                }));
                
                datasets.push({
                    label: 'High-Low Range',
                    data: highs.map((high, i) => high - lows[i]),
                    backgroundColor: pointColors.map(color => color + '40'),
                    borderColor: pointColors,
                    borderWidth: 1,
                    yAxisID: 'y'
                });
                
                datasets.push({
                    label: `${prices[0]?.symbol || 'Stock'} Close ${isPositive ? '📈' : '📉'}`,
                    data: closes,
                    type: 'line',
                    borderColor: isPositive ? '#22c55e' : '#ef4444',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointBackgroundColor: pointColors,
                    yAxisID: 'y'
                });
                break;
                
            case 'area':
                datasets.push({
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
                    yAxisID: 'y'
                });
                break;
                
            default: // 'line'
                datasets.push({
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
                    backgroundColor: 'rgba(34, 197, 94, 0.05)',
                    fill: false,
                    yAxisID: 'y'
                });
        }

        // Add technical indicators (same for all chart types)
        const indicatorColors = [
            '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', 
            '#06b6d4', '#84cc16', '#ec4899', '#6366f1'
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
                        yAxisID: 'y',
                        type: 'line' // Force line type for indicators
                    });
                    colorIndex++;
                    break;

                case 'bollinger':
                    datasets.push(
                        {
                            label: 'Bollinger Upper',
                            data: data.upper,
                            borderColor: color,
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false,
                            yAxisID: 'y',
                            type: 'line'
                        },
                        {
                            label: 'Bollinger Middle',
                            data: data.middle,
                            borderColor: indicatorColors[(colorIndex + 1) % indicatorColors.length],
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            pointRadius: 0,
                            fill: false,
                            yAxisID: 'y',
                            type: 'line'
                        },
                        {
                            label: 'Bollinger Lower',
                            data: data.lower,
                            borderColor: color,
                            backgroundColor: color + '10',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: '+2', // Fill between upper and lower
                            yAxisID: 'y',
                            type: 'line'
                        }
                    );
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
                        yAxisID: 'y1',
                        type: 'line'
                    });
                    colorIndex++;
                    break;

                case 'macd':
                    datasets.push(
                        {
                            label: 'MACD Line',
                            data: data.macd,
                            borderColor: color,
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            yAxisID: 'y1',
                            type: 'line'
                        },
                        {
                            label: 'Signal Line',
                            data: data.signal,
                            borderColor: indicatorColors[(colorIndex + 1) % indicatorColors.length],
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            yAxisID: 'y1',
                            type: 'line'
                        }
                    );
                    colorIndex += 2;
                    break;

                case 'stochastic':
                    datasets.push(
                        {
                            label: '%K',
                            data: data.k,
                            borderColor: color,
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            yAxisID: 'y1',
                            type: 'line'
                        },
                        {
                            label: '%D',
                            data: data.d,
                            borderColor: indicatorColors[(colorIndex + 1) % indicatorColors.length],
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            yAxisID: 'y1',
                            type: 'line'
                        }
                    );
                    colorIndex += 2;
                    break;
            }
        });

        return { labels, datasets };
    };

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
                        const dataset = context.chart.data.datasets[datasetIndex];
                        
                        if (dataset.label.includes('Price') || dataset.label.includes('Close')) {
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

    // Render appropriate chart based on type
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
