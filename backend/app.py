from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import logging
from typing import List, Dict, Any
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stocks API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stocks-dashboard-frontend.onrender.com",  # Replace with your ACTUAL frontend URL
        "https://your-actual-frontend-name.onrender.com",  # Add your real URL here
        "http://localhost:3000",
        "*"  # Keep this for now, remove later for security
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static list of companies (NSE symbols)
COMPANIES = [
    {"symbol": "RELIANCE.NS",   "name": "Reliance Industries"},
    {"symbol": "TCS.NS",        "name": "TCS"},
    {"symbol": "INFY.NS",       "name": "Infosys"},
    {"symbol": "HDFCBANK.NS",   "name": "HDFC Bank"},
    {"symbol": "ICICIBANK.NS",  "name": "ICICI Bank"},
    {"symbol": "ITC.NS",        "name": "ITC"},
    {"symbol": "LT.NS",         "name": "Larsen & Toubro"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel"},
    {"symbol": "SBIN.NS",       "name": "State Bank of India"},
    {"symbol": "KOTAKBANK.NS",  "name": "Kotak Mahindra Bank"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints"},
]

@app.get("/companies")
def get_companies():
    """Get list of available companies"""
    return COMPANIES

# Fetch stock history helper with comprehensive error handling
def fetch_history(symbol: str, period="1y", interval="1d", max_retries=3) -> pd.DataFrame:
    """
    Fetch stock history with robust error handling and retry logic
    """
    if not symbol or not isinstance(symbol, str):
        raise HTTPException(status_code=400, detail="Invalid symbol provided")
    
    # Validate period and interval
    valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
    valid_intervals = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]
    
    if period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"Invalid period. Must be one of: {valid_periods}")
    
    if interval not in valid_intervals:
        raise HTTPException(status_code=400, detail=f"Invalid interval. Must be one of: {valid_intervals}")
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Fetching data for {symbol}, attempt {attempt + 1}")
            
            # Add delay between retries
            if attempt > 0:
                time.sleep(1 * attempt)
            
            # FIXED: Removed show_errors parameter and added multi_level_index=False
            df = yf.download(
                symbol, 
                period=period, 
                interval=interval, 
                auto_adjust=False, 
                progress=False,
                multi_level_index=False  # This fixes the MultiIndex issue
            )
            
            if df is None or df.empty:
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"No data found for symbol {symbol}. Please check if the symbol is correct."
                    )
                continue
            
            # Check if we have the required columns
            required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Missing required columns: {missing_columns}"
                )
            
            # Reset index and process data
            df = df.reset_index()
            
            # Handle different date column names
            date_column = None
            for col in ['Date', 'Datetime']:
                if col in df.columns:
                    date_column = col
                    break
            
            if date_column is None:
                raise HTTPException(status_code=500, detail="Date column not found in data")
            
            # Rename columns to title case
            df = df.rename(columns=str.title)
            
            # Ensure Date column exists after renaming
            if 'Date' not in df.columns and 'Datetime' in df.columns:
                df = df.rename(columns={'Datetime': 'Date'})
            
            # Convert date to string format
            try:
                df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
            except Exception as e:
                logger.error(f"Date conversion error: {e}")
                raise HTTPException(status_code=500, detail="Error processing date column")
            
            # Clean and validate numeric columns
            numeric_columns = ["Open", "High", "Low", "Close", "Volume"]
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                    # Replace NaN with 0 for Volume, but use forward fill for price columns
                    if col == "Volume":
                        df[col] = df[col].fillna(0)
                    else:
                        df[col] = df[col].fillna(method='ffill').fillna(0)
                else:
                    logger.warning(f"Column {col} not found in data")
                    df[col] = 0
            
            # Validate that we have some valid data
            if len(df) == 0:
                raise HTTPException(status_code=404, detail=f"No valid data points found for {symbol}")
            
            # Check if all price data is zero (invalid data)
            price_columns = ["Open", "High", "Low", "Close"]
            if all(df[col].sum() == 0 for col in price_columns if col in df.columns):
                raise HTTPException(
                    status_code=404, 
                    detail=f"All price data is zero for {symbol}. This might indicate an invalid symbol or data issue."
                )
            
            return df[["Date", "Open", "High", "Low", "Close", "Volume"]]
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Error fetching data for {symbol} (attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1:
                # Last attempt failed
                error_msg = str(e)
                if "No data found" in error_msg or "404" in error_msg:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Symbol {symbol} not found or no data available"
                    )
                elif "timed out" in error_msg.lower() or "timeout" in error_msg.lower():
                    raise HTTPException(
                        status_code=503, 
                        detail="Service temporarily unavailable. Please try again later."
                    )
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Failed to fetch data for {symbol}: {error_msg}"
                    )
    
    # This should never be reached due to the loop logic above
    raise HTTPException(status_code=500, detail="Unexpected error in data fetching")

# Prices endpoint with error handling
@app.get("/prices/{symbol}")
def prices(symbol: str, period: str = "1y", interval: str = "1d"):
    """Get historical prices for a symbol"""
    try:
        df = fetch_history(symbol, period=period, interval=interval)
        
        # Convert to clean JSON serializable list
        records = []
        for _, row in df.iterrows():
            try:
                record = {
                    "Date": str(row["Date"]),
                    "Open": float(row["Open"]) if pd.notna(row["Open"]) else 0.0,
                    "High": float(row["High"]) if pd.notna(row["High"]) else 0.0,
                    "Low": float(row["Low"]) if pd.notna(row["Low"]) else 0.0,
                    "Close": float(row["Close"]) if pd.notna(row["Close"]) else 0.0,
                    "Volume": int(row["Volume"]) if pd.notna(row["Volume"]) else 0
                }
                records.append(record)
            except (ValueError, TypeError) as e:
                logger.warning(f"Error processing row: {e}")
                continue
        
        if not records:
            raise HTTPException(status_code=404, detail="No valid price data found")
        
        return records
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in prices endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Prediction endpoint with enhanced error handling
@app.get("/predict/{symbol}")
def predict_next_day(symbol: str):
    """Predict next day's closing price"""
    try:
        df = fetch_history(symbol, period="1y", interval="1d")
        
        # Ensure numeric closes
        closes = pd.to_numeric(df["Close"], errors="coerce").fillna(0).values.astype(float)
        
        # Remove any infinite values
        closes = closes[np.isfinite(closes)]
        
        if len(closes) == 0:
            raise HTTPException(status_code=404, detail="No valid closing price data found")
        
        last_close = float(closes[-1])
        
        if len(closes) < 2 or np.all(closes == 0):
            # Not enough data or all zeros, fallback
            pred = last_close
            method = "Fallback: last close"
        elif len(closes) < 10:
            # SMA fallback
            n = min(5, len(closes))
            pred = float(np.mean(closes[-n:]))
            method = f"SMA({n})"
        else:
            # Linear Regression on last 30 closes
            window = min(30, len(closes))
            y = closes[-window:]
            X = np.arange(window).reshape(-1, 1)
            
            if len(np.unique(y)) == 1:
                # All closes identical, use SMA
                pred = float(np.mean(y))
                method = f"SMA({window})"
            else:
                try:
                    model = LinearRegression()
                    model.fit(X, y)
                    pred = float(model.predict([[window]])[0])
                    method = f"LinearRegression(last {window} days)"
                    
                    # Sanity check for prediction
                    if not np.isfinite(pred) or pred <= 0:
                        pred = float(np.mean(y))
                        method = f"SMA({window}) - LR prediction invalid"
                        
                except Exception as e:
                    logger.warning(f"Linear regression failed: {e}")
                    pred = float(np.mean(y))
                    method = f"SMA({window}) - LR failed"
        
        return {
            "symbol": symbol,
            "last_close": round(last_close, 2),
            "predicted_close": round(pred, 2),
            "change": round(pred - last_close, 2),
            "change_percent": round(((pred - last_close) / last_close) * 100, 2) if last_close != 0 else 0,
            "method": method,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in predict endpoint: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed due to internal error")

# Stats endpoint with error handling
@app.get("/stats/{symbol}")
def stats(symbol: str):
    """Get statistical information for a symbol"""
    try:
        df = fetch_history(symbol, period="1y", interval="1d")
        
        # Calculate stats with error handling
        try:
            high_values = pd.to_numeric(df["High"], errors="coerce").dropna()
            low_values = pd.to_numeric(df["Low"], errors="coerce").dropna()
            volume_values = pd.to_numeric(df["Volume"], errors="coerce").dropna()
            close_values = pd.to_numeric(df["Close"], errors="coerce").dropna()
            
            high_52w = float(high_values.max()) if len(high_values) > 0 else 0.0
            low_52w = float(low_values.min()) if len(low_values) > 0 else 0.0
            avg_vol = float(volume_values.mean()) if len(volume_values) > 0 else 0.0
            current_price = float(close_values.iloc[-1]) if len(close_values) > 0 else 0.0
            
            # Calculate additional stats
            price_change_1d = 0.0
            if len(close_values) >= 2:
                price_change_1d = float(close_values.iloc[-1] - close_values.iloc[-2])
            
            volatility = float(close_values.std()) if len(close_values) > 1 else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating stats: {e}")
            raise HTTPException(status_code=500, detail="Error calculating statistics")
        
        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "high_52w": round(high_52w, 2),
            "low_52w": round(low_52w, 2),
            "price_change_1d": round(price_change_1d, 2),
            "avg_volume": int(avg_vol),
            "volatility": round(volatility, 2),
            "total_data_points": len(df)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in stats endpoint: {e}")
        raise HTTPException(status_code=500, detail="Statistics calculation failed")

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Stock API is running"}

# Root endpoint
@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Stock API",
        "version": "1.0.0",
        "endpoints": {
            "companies": "/companies",
            "prices": "/prices/{symbol}?period=1y&interval=1d",
            "predict": "/predict/{symbol}",
            "stats": "/stats/{symbol}",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
