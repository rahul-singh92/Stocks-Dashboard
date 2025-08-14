export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Add debug logging to see what's being used
console.log('🔧 CONFIG DEBUG:');
console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Final API_BASE:', API_BASE);
