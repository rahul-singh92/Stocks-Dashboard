// Technical Indicators Calculations

export const calculateSMA = (data, period) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

export const calculateEMA = (data, period) => {
  const result = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
    result.push(i === period - 1 ? sum / period : null);
  }
  
  // Calculate EMA for remaining points
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] * multiplier) + (result[i - 1] * (1 - multiplier));
    result.push(ema);
  }
  
  return result;
};

export const calculateRSI = (prices, period = 14) => {
  const changes = [];
  const gains = [];
  const losses = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    changes.push(change);
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const result = [null]; // First value is null
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  result.push(rsi);
  
  // Calculate RSI for remaining points using Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
  }
  
  // Fill remaining nulls
  while (result.length < prices.length) {
    result.unshift(null);
  }
  
  return result;
};

export const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  
  const macdLine = emaFast.map((fast, i) => 
    fast !== null && emaSlow[i] !== null ? fast - emaSlow[i] : null
  );
  
  const validMacdValues = macdLine.filter(val => val !== null);
  const signalLine = calculateEMA(validMacdValues, signalPeriod);
  
  // Align signal line with macd line
  const alignedSignalLine = [];
  let signalIndex = 0;
  
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      alignedSignalLine.push(signalLine[signalIndex] || null);
      signalIndex++;
    } else {
      alignedSignalLine.push(null);
    }
  }
  
  const histogram = macdLine.map((macd, i) => 
    macd !== null && alignedSignalLine[i] !== null ? macd - alignedSignalLine[i] : null
  );
  
  return {
    macd: macdLine,
    signal: alignedSignalLine,
    histogram: histogram
  };
};

export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  const sma = calculateSMA(prices, period);
  const upperBand = [];
  const lowerBand = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upperBand.push(null);
      lowerBand.push(null);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upperBand.push(mean + (standardDeviation * stdDev));
      lowerBand.push(mean - (standardDeviation * stdDev));
    }
  }
  
  return {
    upper: upperBand,
    middle: sma,
    lower: lowerBand
  };
};

export const calculateStochasticOscillator = (highs, lows, closes, kPeriod = 14, dPeriod = 3) => {
  const kValues = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(null);
    } else {
      const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      const currentClose = closes[i];
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
  }
  
  const dValues = calculateSMA(kValues.filter(val => val !== null), dPeriod);
  
  // Align D values with K values
  const alignedDValues = [];
  let dIndex = 0;
  
  for (let i = 0; i < kValues.length; i++) {
    if (kValues[i] !== null) {
      alignedDValues.push(dValues[dIndex] || null);
      dIndex++;
    } else {
      alignedDValues.push(null);
    }
  }
  
  return {
    k: kValues,
    d: alignedDValues
  };
};
