import React from "react";

export default function CompanyList({ companies, selected, onSelect }) {
    return (
        <ul className="companies">
            {companies.map(c => (
                <li
                    key={c.symbol}
                    className={`item ${selected && selected.symbol === c.symbol ? "active" : ""}`}
                    onClick={() => onSelect(c)}
                >
                    <div className="ticker">{c.symbol}</div>
                    <div className="name">{c.name}</div>
                </li>
            ))}
        </ul>
    );
}
