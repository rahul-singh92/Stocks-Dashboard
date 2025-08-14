// Remove the trailing slash from your API URL
export const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || "http://localhost:8000";
