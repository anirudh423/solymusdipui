import React from "react";

export default function IntentCard({ intent, onEdit, onDuplicate, onToggle, onDelete, onExport }) {
    return (
        <article className={`insurer-card fancy-card ${intent.enabled ? "card-new" : ""}`}>
            <div className="card-top">
                <div className="card-left">
                    <div className="avatar large">{(intent.name || "").split(" ").slice(0, 2).map((x) => x[0]).join("")}</div>
                    <div>
                        <div className="card-title-strong">{intent.name}</div>
                        <div className="muted small">{(intent.triggers || []).join(", ")}</div>
                    </div>
                </div>
                <div className="card-right">
                    <div className="muted small">{new Date(intent.createdAt).toLocaleString()}</div>
                    <span className={`badge ${intent.enabled ? "status-active" : "status-muted"}`}>{intent.enabled ? "enabled" : "disabled"}</span>
                </div>
            </div>

            <div className="card-body">
                <div className="muted small">Replies: {(intent.quickReplies || []).map((r) => r.title).join(", ")}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <button className="btn-outline" onClick={onEdit}>Edit</button>
                    <button className="btn-ghost" onClick={onDuplicate}>Duplicate</button>
                </div>
            </div>

            <div style={{ paddingTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="action" onClick={onExport}>Export</button>
                <button className="action" onClick={onToggle}>{intent.enabled ? "Disable" : "Enable"}</button>
                <button className="action danger" onClick={onDelete}>Delete</button>
            </div>
        </article>
    );
}
