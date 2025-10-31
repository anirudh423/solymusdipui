import React, { useState, useEffect } from "react";



export default function IntentEditorDrawer({ intent, onClose, onSave, onAddQuickReply, onUpdateQuickReply, onRemoveQuickReply, onMoveReply }) {
    const [local, setLocal] = useState(() => ({ ...intent }));

    useEffect(() => setLocal({ ...intent }), [intent]);

    if (!intent) return null;

    function handleSave(close = false) {
        const sanitized = { ...local, triggers: (local.triggers || []).map((t) => String(t).trim()).filter(Boolean) };
        onSave(sanitized);
        if (close) onClose();
    }

    return (
        <div className="detail-drawer panel-drop" role="dialog" aria-modal>
            <div className="drawer-head">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div className="avatar large drawer-avatar">{(local.name || "").split(" ").slice(0, 2).map((x) => x[0]).join("")}</div>
                    <div>
                        <div className="drawer-title">{local.name}</div>
                        <div className="muted small">{new Date(local.createdAt).toLocaleString()}</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="action" onClick={() => { onClose(); }}>Close</button>
                </div>
            </div>

            <div className="drawer-body">
                <div className="drawer-grid">
                    <div>
                        <div className="field-label">Name</div>
                        <input value={local.name || ""} onChange={(e) => setLocal((s) => ({ ...s, name: e.target.value }))} />
                    </div>

                    <div>
                        <div className="field-label">Enabled</div>
                        <select value={String(!!local.enabled)} onChange={(e) => setLocal((s) => ({ ...s, enabled: e.target.value === "true" }))}>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                        <div className="field-label">Triggers (comma separated)</div>
                        <input value={(local.triggers || []).join(", ")} onChange={(e) => setLocal((s) => ({ ...s, triggers: e.target.value.split(",").map(x => x.trim()).filter(Boolean) }))} />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                        <div className="field-label">Notes</div>
                        <textarea rows={3} value={local.notes || ""} onChange={(e) => setLocal((s) => ({ ...s, notes: e.target.value }))} />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div className="field-label">Quick replies</div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn-outline" onClick={() => onAddQuickReply(local.id, "New reply", "")}>＋ Add reply</button>
                            </div>
                        </div>

                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                            {(local.quickReplies || []).map((r, idx) => (
                                <div key={r.id} className="file-row" style={{ display: "grid", gridTemplateColumns: "1fr 160px 80px", gap: 8, alignItems: "center" }}>
                                    <div>
                                        <input value={r.title} onChange={(e) => onUpdateQuickReply(local.id, r.id, { title: e.target.value })} placeholder="Button text" />
                                        <input value={r.payload} onChange={(e) => onUpdateQuickReply(local.id, r.id, { payload: e.target.value })} placeholder="Payload (path or command)" style={{ marginTop: 6 }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                        <button className="btn-ghost" onClick={() => onMoveReply(local.id, idx, -1)} title="Move up">↑</button>
                                        <button className="btn-ghost" onClick={() => onMoveReply(local.id, idx, 1)} title="Move down">↓</button>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                        <button className="btn-outline" onClick={() => onRemoveQuickReply(local.id, r.id)}>Remove</button>
                                    </div>
                                </div>
                            ))}
                            {(local.quickReplies || []).length === 0 && <div className="muted small">No quick replies yet — add one to surface action buttons in chat.</div>}
                        </div>
                    </div>

                    <div className="drawer-actions" style={{ gridColumn: "1 / -1" }}>
                        <div>
                            <button className="btn-ghost" onClick={() => { onClose(); }}>Cancel</button>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn-outline" onClick={() => handleSave(false)}>Save</button>
                            <button className="btn-primary" onClick={() => handleSave(true)}>Save & Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
