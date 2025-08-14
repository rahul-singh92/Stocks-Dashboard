import React from "react";

export default function CompanyList({ companies, selected, onSelect }) {
    // DEBUG: Log component render
    console.log('📋 CompanyList rendered with:', {
        companiesLength: companies?.length || 0,
        selectedSymbol: selected?.symbol || 'none',
        companies: companies
    });

    if (!companies || companies.length === 0) {
        console.log('⚠️ No companies to display'); // DEBUG: Empty state
        return (
            <div style={{
                color: 'orange',
                padding: '10px',
                background: 'rgba(255,165,0,0.1)',
                margin: '10px 0',
                borderRadius: '4px'
            }}>
                {companies === null || companies === undefined ?
                    '🔄 Loading companies...' :
                    '❌ No companies found'
                }
            </div>
        );
    }

    return (
        <ul className="companies">
            {companies.map(c => {
                console.log('🏢 Rendering company:', c.symbol, c.name); // DEBUG: Individual company render
                return (
                    <li
                        key={c.symbol}
                        className={`item ${selected && selected.symbol === c.symbol ? "active" : ""}`}
                        onClick={() => {
                            console.log('🎯 Company clicked:', c.symbol, c.name); // DEBUG: Click event
                            onSelect(c);
                        }}
                    >
                        <div className="ticker">{c.symbol}</div>
                        <div className="name">{c.name}</div>
                    </li>
                );
            })}
        </ul>
    );
}
