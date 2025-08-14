import React from "react";

export default function CompanyList({ companies, selected, onSelect }) {
    // DEBUG: Enhanced logging
    console.log('📋 CompanyList rendered with:', {
        companiesType: typeof companies,
        companiesLength: companies?.length || 0,
        isArray: Array.isArray(companies),
        selectedSymbol: selected?.symbol || 'none',
        companies: companies
    });

    // Enhanced safety checks
    if (!companies) {
        console.log('⚠️ Companies is null/undefined');
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
        console.log('❌ Companies is not an array, type:', typeof companies);
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
        console.log('📭 Companies array is empty');
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
        const isValid = company &&
            typeof company === 'object' &&
            company.symbol &&
            company.name;
        if (!isValid) {
            console.warn('⚠️ Invalid company object:', company);
        }
        return isValid;
    });

    if (validCompanies.length === 0) {
        console.log('❌ No valid company objects found');
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

    console.log(`✅ Rendering ${validCompanies.length} valid companies`);

    return (
        <ul className="companies">
            {validCompanies.map((c, index) => {
                console.log(`🏢 Rendering company ${index + 1}:`, c.symbol, c.name);

                // Additional validation per company
                if (!c.symbol || !c.name) {
                    console.warn('⚠️ Skipping invalid company:', c);
                    return null;
                }

                return (
                    <li
                        key={c.symbol}
                        className={`item ${selected && selected.symbol === c.symbol ? "active" : ""}`}
                        onClick={() => {
                            console.log('🎯 Company clicked:', c.symbol, c.name);
                            console.log('📱 Click event details:', {
                                symbol: c.symbol,
                                name: c.name,
                                timestamp: new Date().toISOString(),
                                userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
                            });

                            // Ensure onSelect is a function before calling
                            if (typeof onSelect === 'function') {
                                onSelect(c);
                            } else {
                                console.error('❌ onSelect is not a function:', typeof onSelect);
                            }
                        }}
                        // Add touch-friendly attributes for mobile
                        style={{
                            cursor: 'pointer',
                            touchAction: 'manipulation' // Prevent zoom on double-tap
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
