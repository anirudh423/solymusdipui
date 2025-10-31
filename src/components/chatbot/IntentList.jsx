import React from "react";
import IntentCard from "./IntentCard";

export default function IntentList({ pageItems = [], viewMode = "table", onOpenEditor, onCreate, onDuplicate, onToggleEnable, onRemove, onExport }) {
    return (
        <section className="bento-card table-card powerful" aria-live="polite">
            <div className="card-head">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div className="card-title">Intents</div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button className="btn-ghost" onClick={onCreate}>＋ New</button>
                    <button className="btn-outline" onClick={() => onExport()}>Export all</button>
                </div>
            </div>

            <div className="card-body">
                {viewMode === "table" ? (
                    <div className="table-wrap">
                        <table className="hosp-table">
                            <thead>
                                <tr>
                                    <th>Intent</th>
                                    <th>Triggers</th>
                                    <th>Replies</th>
                                    <th>Enabled</th>
                                    <th style={{ width: 220 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((it) => (
                                    <tr key={it.id} className="hosp-row">
                                        <td>
                                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                <div className="avatar" title={it.name}>{(it.name || "").split(" ").slice(0, 2).map(x => x[0]).join("")}</div>
                                                <div>
                                                    <div className="row-title">{it.name}</div>
                                                    <div className="row-sub muted small">{new Date(it.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="small">{(it.triggers || []).join(", ")}</td>
                                        <td>{(it.quickReplies || []).map((q) => <span key={q.id} className="tag pill">{q.title}</span>)}</td>
                                        <td className="small">{it.enabled ? "Yes" : "No"}</td>
                                        <td>
                                            <div className="post-actions">
                                                <button className="action" onClick={() => onOpenEditor(it)}>Edit</button>
                                                <button className="action" onClick={() => onDuplicate(it.id)}>Duplicate</button>
                                                <button className="action" onClick={() => onToggleEnable(it.id)}>{it.enabled ? "Disable" : "Enable"}</button>
                                                <button className="action" onClick={() => onExport(it.id)}>Export</button>
                                                <div className="divider" />
                                                <button className="action danger" onClick={() => onRemove(it.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="cards-grid">
                        {pageItems.map((it) => (
                            <IntentCard
                                key={it.id}
                                intent={it}
                                onEdit={() => onOpenEditor(it)}
                                onDuplicate={() => onDuplicate(it.id)}
                                onToggle={() => onToggleEnable(it.id)}
                                onDelete={() => onRemove(it.id)}
                                onExport={() => onExport(it.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
