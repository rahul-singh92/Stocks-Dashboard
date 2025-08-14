import React from "react";

export default function StatsPanel({ stats }) {
    return (
        <div className="stats">
            <div className="stat">
                <div className="label">52-Week High</div>
                <div className="value">{stats.high_52w || "—"}</div>
            </div>
            <div className="stat">
                <div className="label">52-Week Low</div>
                <div className="value">{stats.low_52w || "—"}</div>
            </div>
            <div className="stat">
                <div className="label">Avg Volume</div>
                <div className="value">{stats.avg_volume || "—"}</div>
            </div>
        </div>
    );
}
