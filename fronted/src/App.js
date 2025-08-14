import React, {useEffect, useState} from "react";
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

  useEffect(() => {
    fetch(`${API_BASE}/companies`)
    .then(res => res.json())
    .then(data => {
      setCompanies(data);
      if (data.length) selectCompany(data[0]);
    });
  },[]
  );

  const selectCompany = (company) => {
    setSelected(company);
    Promise.all([
      fetch(`${API_BASE}/prices/${company.symbol}?period=1y&interval=1d`).then(r => r.json()),
      fetch(`${API_BASE}/stats/${company.symbol}`).then(r => r.json()),
      fetch(`${API_BASE}/predict/${company.symbol}`).then(r => r.json())
    ]).then(([p, s, pred]) => {
      setPrices(p);
      setStats(s);
      setPrediction(pred);
    }).catch(console.error);
  };

  return (
    <div className="app">
      <aside>
        <div className="brand">📈 Stocks</div>
        <CompanyList companies={companies} selected={selected} onSelect={selectCompany} />
      </aside>
      <main>
        <div className="topbar">
          <div className="title">{selected ? `${selected.name} • ${selected.symbol}` : "Select a company"}</div>
          <div className="pill">{prediction ? `Next-day: ₹${prediction.predicted_close}` : "—"}</div>
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
