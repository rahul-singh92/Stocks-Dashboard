import React from "react";

export default function CompanyList({ companies, selected, onSelect }) {
    // Enhanced safety checks
    if (!companies) {
        return (
            <div style={{
                color: '#fbbf24',
                padding: '15px',
                background: 'rgba(251, 191, 36, 0.1)',
                margin: '10px 0',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(251, 191, 36, 0.2)'
            }}>
                🔄 Loading companies...
            </div>
        );
    }

    if (!Array.isArray(companies)) {
        return (
            <div style={{
                color: '#ef4444',
                padding: '15px',
                background: 'rgba(239, 68, 68, 0.1)',
                margin: '10px 0',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                ❌ Error: Invalid data format
                <br />
                <small style={{ fontSize: '12px', opacity: 0.8 }}>
                    Expected array, got {typeof companies}
                </small>
            </div>
        );
    }

    if (companies.length === 0) {
        return (
            <div style={{
                color: '#64748b',
                padding: '20px',
                background: 'rgba(100, 116, 139, 0.1)',
                margin: '10px 0',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(100, 116, 139, 0.2)'
            }}>
                📭 No companies found
                <br />
                <small style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px', display: 'block' }}>
                    Please check your connection or try refreshing
                </small>
            </div>
        );
    }

    // Validate company objects
    const validCompanies = companies.filter(company => {
        return company &&
            typeof company === 'object' &&
            company.symbol &&
            company.name;
    });

    if (validCompanies.length === 0) {
        return (
            <div style={{
                color: '#ef4444',
                padding: '15px',
                background: 'rgba(239, 68, 68, 0.1)',
                margin: '10px 0',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                ❌ Invalid company data
                <br />
                <small style={{ fontSize: '12px', opacity: 0.8 }}>
                    Companies missing required fields (symbol, name)
                </small>
            </div>
        );
    }

    return (
        <ul className="companies">
            {validCompanies.map((c) => {
                // Skip invalid companies
                if (!c.symbol || !c.name) {
                    return null;
                }

                return (
                    <li
                        key={c.symbol}
                        className={`item ${selected && selected.symbol === c.symbol ? "active" : ""}`}
                        onClick={() => {
                            if (typeof onSelect === 'function') {
                                onSelect(c);
                            }
                        }}
                        style={{
                            cursor: 'pointer',
                            touchAction: 'manipulation'
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
