import React, { useState } from 'react';
import './TechnicalPanel.css';

export default function TechnicalPanel({ onIndicatorChange, selectedIndicators }) {
  const [isOpen, setIsOpen] = useState(false);

  const indicators = [
    {
      id: 'sma',
      name: 'Simple Moving Average',
      description: 'Trend-following indicator based on average price',
      periods: [20, 50, 200],
      category: 'trend'
    },
    {
      id: 'ema',
      name: 'Exponential Moving Average',
      description: 'More responsive to recent price changes',
      periods: [12, 26, 50],
      category: 'trend'
    },
    {
      id: 'rsi',
      name: 'RSI (14)',
      description: 'Momentum oscillator (0-100)',
      category: 'momentum'
    },
    {
      id: 'macd',
      name: 'MACD',
      description: 'Moving Average Convergence Divergence',
      category: 'momentum'
    },
    {
      id: 'bollinger',
      name: 'Bollinger Bands',
      description: 'Volatility indicator with upper/lower bands',
      category: 'volatility'
    },
    {
      id: 'stochastic',
      name: 'Stochastic Oscillator',
      description: 'Momentum indicator comparing closing price to price range',
      category: 'momentum'
    }
  ];

  const categories = {
    trend: { name: 'Trend Indicators', icon: '📈', color: '#22c55e' },
    momentum: { name: 'Momentum Indicators', icon: '⚡', color: '#3b82f6' },
    volatility: { name: 'Volatility Indicators', icon: '🌊', color: '#f59e0b' }
  };

  const handleIndicatorToggle = (indicatorId, period = null) => {
    const key = period ? `${indicatorId}_${period}` : indicatorId;
    const indicator = indicators.find(i => i.id === indicatorId);
    
    onIndicatorChange({
      id: indicatorId,
      period: period,
      key: key,
      name: period ? `${indicator.name} (${period})` : indicator.name,
      enabled: !selectedIndicators[key]
    });
  };

  const getActiveCount = () => {
    return Object.values(selectedIndicators).filter(Boolean).length;
  };

  return (
    <div className="technical-panel">
      <button 
        className={`tech-panel-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="tech-icon">🛠️</span>
        <span className="tech-text">Technical Analysis</span>
        {getActiveCount() > 0 && (
          <span className="active-count">{getActiveCount()}</span>
        )}
        <span className={`arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
      </button>

      {isOpen && (
        <div className="tech-panel-content">
          <div className="tech-panel-header">
            <h3>📊 Technical Indicators</h3>
            <button 
              className="clear-all-btn"
              onClick={() => onIndicatorChange({ clearAll: true })}
            >
              Clear All
            </button>
          </div>

          {Object.entries(categories).map(([categoryId, category]) => (
            <div key={categoryId} className="indicator-category">
              <h4 className="category-header">
                <span className="category-icon">{category.icon}</span>
                {category.name}
              </h4>

              <div className="indicators-grid">
                {indicators
                  .filter(indicator => indicator.category === categoryId)
                  .map(indicator => (
                    <div key={indicator.id} className="indicator-item">
                      <div className="indicator-main">
                        <div className="indicator-info">
                          <span className="indicator-name">{indicator.name}</span>
                          <span className="indicator-desc">{indicator.description}</span>
                        </div>

                        {!indicator.periods ? (
                          <button
                            className={`indicator-toggle ${selectedIndicators[indicator.id] ? 'active' : ''}`}
                            onClick={() => handleIndicatorToggle(indicator.id)}
                          >
                            {selectedIndicators[indicator.id] ? '✓' : '+'}
                          </button>
                        ) : null}
                      </div>

                      {indicator.periods && (
                        <div className="period-options">
                          {indicator.periods.map(period => (
                            <button
                              key={period}
                              className={`period-btn ${selectedIndicators[`${indicator.id}_${period}`] ? 'active' : ''}`}
                              onClick={() => handleIndicatorToggle(indicator.id, period)}
                            >
                              {period}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
