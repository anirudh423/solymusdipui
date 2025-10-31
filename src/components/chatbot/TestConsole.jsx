import React, { useState } from "react";


export default function TestConsole({ intents = [] }) {
    const [input, setInput] = useState("");
    const [result, setResult] = useState(null);

    function runTest() {
        const msg = (input || "").toLowerCase().trim();
        if (!msg) {
            setResult(null);
            return;
        }
        const matched = intents.find((it) => it.enabled && (it.triggers || []).some((t) => msg.includes(t.toLowerCase())));
        if (matched) setResult({ intent: matched, replies: matched.quickReplies || [] });
        else setResult({ intent: null, replies: [] });
    }

    return (
        <section style={{ marginTop: 18 }} className="bento-card">
            <div className="card-head">
                <div className="card-title">Test console</div>
            </div>
            <div className="card-body" style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ flex: 1 }} placeholder="Type a sample user message (e.g. 'hi, how do i buy')" value={input} onChange={(e) => setInput(e.target.value)} />
                    <button className="btn-primary" onClick={runTest}>Run</button>
                </div>

                <div>
                    <div className="muted small">Result</div>
                    <div style={{ marginTop: 8 }}>
                        {result === null && <div className="muted">No test run</div>}
                        {result && result.intent === null && <div className="muted">No intent matched</div>}
                        {result && result.intent && (
                            <div>
                                <div style={{ fontWeight: 900 }}>{result.intent.name}</div>
                                <div className="muted small">{result.intent.triggers.join(", ")}</div>
                                <div style={{ marginTop: 8 }}>{(result.replies || []).map((r) => <button key={r.id} className="btn-ghost" style={{ marginRight: 6 }}>{r.title}</button>)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
