import React, { useState } from 'react';

export default function MobileCompanySelector({ companies, selected, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mobile-selector">
            <button
                className="selector-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selected ? `${selected.symbol} - ${selected.name}` : "Select a company"}
                <span className={`arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
            </button>

            {isOpen && (
                <div className="dropdown">
                    {companies.map(company => (
                        <div
                            key={company.symbol}
                            className="dropdown-item"
                            onClick={() => {
                                onSelect(company);
                                setIsOpen(false);
                            }}
                        >
                            <div className="ticker">{company.symbol}</div>
                            <div className="name">{company.name}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
