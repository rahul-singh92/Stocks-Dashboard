import React, { useEffect, useState } from "react";
import { API_BASE } from "./config";
import CompanyList from "./components/CompanyList"
import StockChart from "./components/StockChart"
import StatsPanel from "./components/StatsPanel"
import './App.css';

function App() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prices, setPrices] = useState([]);
  const [stats, setStats] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Add mobile sidebar toggle

  useEffect(() => {
    console.log('🔍 Fetching companies from:', `${API_BASE}/companies`); // DEBUG: API URL
    console.log('📱 User agent:', navigator.userAgent); // DEBUG: Device info

    fetch(`${API_BASE}/companies`)
      .then(res => {
        console.log('📡 API Response status:', res.status); // DEBUG: Response status
        console.log('📡 API Response headers:', res.headers); // DEBUG: Headers
        return res.json();
      })
      .then(data => {
        console.log('✅ Companies loaded successfully:', data); // DEBUG: Data received
        console.log('📊 Number of companies:', data.length); // DEBUG: Count
        setCompanies(data);
        if (data.length) {
          console.log('🎯 Auto-selecting first company:', data[0]); // DEBUG: Auto-selection
          selectCompany(data[0]);
        }
      })
      .catch(error => {
        console.error('❌ Error loading companies:', error); // DEBUG: Errors
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      });
  }, []);

  const selectCompany = (company) => {
    console.log('🏢 Company selected:', company); // DEBUG: Company selection
    setSelected(company);
    setSidebarOpen(false); // Close sidebar after selection on mobile
    console.log('📱 Sidebar closed after selection'); // DEBUG: Sidebar state

    Promise.all([
      fetch(`${API_BASE}/prices/${company.symbol}?period=1y&interval=1d`).then(r => r.json()),
      fetch(`${API_BASE}/stats/${company.symbol}`).then(r => r.json()),
      fetch(`${API_BASE}/predict/${company.symbol}`).then(r => r.json())
    ]).then(([p, s, pred]) => {
      console.log('📈 Data loaded for', company.symbol, {
        prices: p?.length || 0,
        stats: Object.keys(s || {}).length,
        prediction: pred
      }); // DEBUG: Data loading
      setPrices(p);
      setStats(s);
      setPrediction(pred);
    }).catch(error => {
      console.error('❌ Error loading company data:', error); // DEBUG: Data errors
    });
  };

  // DEBUG: Log current state on every render
  console.log('🔄 App render - Current state:', {
    companiesCount: companies.length,
    selectedCompany: selected?.symbol || 'none',
    sidebarOpen,
    pricesCount: prices.length,
    hasStats: Object.keys(stats).length > 0,
    hasPrediction: !!prediction
  });

  return (
    <div className="app">
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() => {
            console.log('📱 Overlay clicked - closing sidebar'); // DEBUG: Overlay click
            setSidebarOpen(false);
          }}
        ></div>
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">📈 Stocks</div>

        {/* DEBUG: Temporary debug info panel */}
        <div style={{
          color: 'yellow',
          fontSize: '12px',
          padding: '10px',
          background: 'rgba(255,255,0,0.1)',
          margin: '10px 0',
          borderRadius: '4px'
        }}>
          <div>🔧 DEBUG INFO:</div>
          <div>Companies: {companies.length}</div>
          <div>API_BASE: {API_BASE}</div>
          <div>Sidebar: {sidebarOpen ? 'OPEN' : 'CLOSED'}</div>
          <div>Selected: {selected?.symbol || 'None'}</div>
          <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
        </div>

        <CompanyList companies={companies} selected={selected} onSelect={selectCompany} />
      </aside>

      <main>
        <div className="topbar">
          {/* Mobile hamburger menu */}
          <button
            className="mobile-menu-btn"
            onClick={() => {
              console.log('🍔 Hamburger clicked, current sidebar state:', sidebarOpen); // DEBUG: Menu click
              setSidebarOpen(!sidebarOpen);
              console.log('🍔 Sidebar state after click:', !sidebarOpen); // DEBUG: New state
            }}
          >
            ☰
          </button>

          <div className="title">
            {selected ? `${selected.name} • ${selected.symbol}` : "Select a company"}
          </div>
          <div className="pill">
            {prediction ? `Next-day: ₹${prediction.predicted_close}` : "—"}
          </div>
        </div>
        <div className="content">
          <StockChart prices={prices} />
          <StatsPanel stats={stats} />
        </div>
      </main>
    </div>
  );
}

export default App;
