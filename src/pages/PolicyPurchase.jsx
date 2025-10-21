import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";
import "../styles/PolicyPurchase.css";

const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(n || 0);

function simulatePayment({ method, amount }) {
    return new Promise((res) => {
        setTimeout(() => {
            const ok = Math.random() > 0.05;
            if (ok)
                res({ success: true, paymentId: `PMT-${Date.now()}` });
            else res({ success: false, message: "Authorization declined. Try another method." });
        }, 1600);
    });
}

function detectCardBrand(num = "") {
    if (/^3[47]/.test(num)) return "Amex";
    if (/^4/.test(num)) return "Visa";
    if (/^5[1-5]/.test(num)) return "MasterCard";
    return "Card";
}

function loadSavedCards() {
    try {
        const raw = localStorage.getItem("solymus_saved_cards");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCardToStorage(card) {
    const arr = loadSavedCards();
    const masked = {
        id: `card_${Date.now()}`,
        brand: detectCardBrand(card.number),
        last4: (card.number || "").slice(-4),
        name: card.name,
        exp: card.exp,
    };
    arr.unshift(masked);
    localStorage.setItem("solymus_saved_cards", JSON.stringify(arr.slice(0, 5)));
}

export default function PolicyPurchase() {
    const location = useLocation();
    const navigate = useNavigate();
    const cart = location.state?.cart || JSON.parse(localStorage.getItem("quote") || "null");

    const [method, setMethod] = useState("card");
    const [useSaved, setUseSaved] = useState(false);
    const [savedCards, setSavedCards] = useState(loadSavedCards());
    const [selectedSavedId, setSelectedSavedId] = useState(savedCards[0]?.id || null);
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [cardExp, setCardExp] = useState("");
    const [cardCvc, setCardCvc] = useState("");
    const [saveCard, setSaveCard] = useState(false);
    const [installments, setInstallments] = useState(false);
    const [financePct, setFinancePct] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const rootRef = useRef(null);

    const price = cart?.premium || 0;
    const financedTotal = Number((price * (1 + financePct / 100)).toFixed(2));
    const monthly = (financedTotal / 12).toFixed(2);

    useEffect(() => {
        if (cart) localStorage.setItem("quote", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        setSavedCards(loadSavedCards());
    }, []);

    async function handleConfirm() {
        setErrorMessage("");
        setLoading(true);
        if (method === "card" && !useSaved) {
            if (!cardNumber || !cardName || !cardExp || !cardCvc) {
                setErrorMessage("Please complete your card details or select a saved card.");
                setLoading(false);
                return;
            }
        }
        const result = await simulatePayment({ method, amount: price });
        if (!result.success) {
            setErrorMessage(result.message);
            setLoading(false);
            return;
        }

        const policyId = `POL-${Date.now().toString().slice(-6)}`;
        setStatus({ type: "success", policyId, paymentId: result.paymentId });
        if (saveCard && !useSaved && method === "card")
            saveCardToStorage({ number: cardNumber, name: cardName, exp: cardExp });
        setLoading(false);

        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
        });
    }

    function downloadReceiptClient() {
        if (!status || status.type !== "success") return;
        const doc = new jsPDF({ unit: "pt", format: "letter" });
        doc.setFont("Times", "Bold");
        doc.setFontSize(20);
        doc.text("Solymus Insurance", 40, 60);
        doc.setFontSize(12);
        doc.setFont("Times", "Normal");
        doc.text(`Policy ID: ${status.policyId}`, 40, 100);
        doc.text(`Holder: ${cart.holder}`, 40, 118);
        doc.text(`Product: ${cart.product}`, 40, 136);
        doc.text(`Premium: ${fmt(price)}`, 40, 154);
        doc.text(`Date: ${new Date().toLocaleString()}`, 40, 172);
        doc.save(`receipt_${status.policyId}.pdf`);
    }

    if (!cart)
        return (
            <div className="policy-root">
                <section className="hero">
                    <h1>No items in cart</h1>
                    <button className="btn-purchase" onClick={() => navigate("/")}>
                        Back to quotes
                    </button>
                </section>
            </div>
        );

    return (
        <div className="policy-root" ref={rootRef}>
            <section className="hero light">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="hero-title">Your Policy, Refined</h1>
                    <p className="hero-sub">
                        "Luxury isn’t about excess. It’s about confidence — in what protects you."
                    </p>
                </motion.div>
            </section>

            <motion.div
                className="card luxury checkout-card"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="left">
                    <h2>{cart.product}</h2>
                    <p className="lead-price">{fmt(price)} / year</p>
                    <ul className="benefits">
                        {cart.coverages?.map((c, i) => (
                            <li key={i}>
                                {c.name} — {fmt(c.amount)}
                            </li>
                        ))}
                    </ul>

                    <label className="checkbox-line">
                        <input
                            type="checkbox"
                            checked={installments}
                            onChange={(e) => setInstallments(e.target.checked)}
                        />
                        Pay in installments
                    </label>
                    {installments && (
                        <div className="finance-panel">
                            <label>Finance: {financePct}%</label>
                            <input
                                type="range"
                                min="0"
                                max="40"
                                value={financePct}
                                onChange={(e) => setFinancePct(Number(e.target.value))}
                            />
                            <small>
                                Monthly: {fmt(monthly)} — Total: {fmt(financedTotal)}
                            </small>
                        </div>
                    )}
                </div>

                <div className="right">
                    <h3>Payment Method</h3>
                    <div className="payment-options">
                        {["card", "upi", "netbank"].map((m) => (
                            <button
                                key={m}
                                className={`payment-card ${method === m ? "active" : ""}`}
                                onClick={() => setMethod(m)}
                            >
                                {m === "card" ? "💳 Card" : m === "upi" ? "📱 UPI" : "🏦 Net Banking"}
                            </button>
                        ))}
                    </div>

                    {method === "card" && (
                        <>
                            <label className="checkbox-line" style={{ marginTop: 10 }}>
                                <input
                                    type="checkbox"
                                    checked={useSaved}
                                    onChange={(e) => setUseSaved(e.target.checked)}
                                />
                                Use saved card
                            </label>

                            {useSaved ? (
                                <div className="saved-list">
                                    {savedCards.map((c) => (
                                        <label key={c.id} className="saved-card">
                                            <input
                                                type="radio"
                                                checked={selectedSavedId === c.id}
                                                onChange={() => setSelectedSavedId(c.id)}
                                            />
                                            <span>
                                                {c.brand} •••• {c.last4} ({c.name})
                                            </span>
                                        </label>
                                    ))}
                                    {savedCards.length === 0 && (
                                        <div className="muted">No saved cards yet</div>
                                    )}
                                </div>
                            ) : (
                                <div className="card-form">
                                    <motion.div
                                        className={`credit-card ${flipped ? "flipped" : ""}`}
                                        onClick={() => setFlipped(!flipped)}
                                    >
                                        <div className="front">
                                            <div className="chip"></div>
                                            <div className="brand">{detectCardBrand(cardNumber)}</div>
                                            <div className="number">
                                                {cardNumber || "•••• •••• •••• ••••"}
                                            </div>
                                            <div className="info">
                                                <span>{cardName || "NAME SURNAME"}</span>
                                                <span>{cardExp || "MM/YY"}</span>
                                            </div>
                                        </div>
                                        <div className="back">
                                            <div className="strip"></div>
                                            <div className="cvv">{cardCvc || "•••"}</div>
                                        </div>
                                    </motion.div>

                                    <input
                                        className="card-form"
                                        placeholder="Card Number"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                    />
                                    <div className="row">
                                        <input
                                            placeholder="MM/YY"
                                            value={cardExp}
                                            onChange={(e) => setCardExp(e.target.value)}
                                        />
                                        <input
                                            placeholder="CVC"
                                            value={cardCvc}
                                            onFocus={() => setFlipped(true)}
                                            onBlur={() => setFlipped(false)}
                                            onChange={(e) => setCardCvc(e.target.value)}
                                        />
                                    </div>
                                    <input
                                        placeholder="Name on Card"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                    />
                                    <label className="checkbox-line">
                                        <input
                                            type="checkbox"
                                            checked={saveCard}
                                            onChange={(e) => setSaveCard(e.target.checked)}
                                        />
                                        Save this card for next time
                                    </label>
                                </div>
                            )}
                        </>
                    )}

                    {method === "upi" && (
                        <p className="muted">Confirm the payment in your UPI app.</p>
                    )}
                    {method === "netbank" && (
                        <p className="muted">
                            You’ll be redirected to your bank’s secure page.
                        </p>
                    )}

                    {errorMessage && <p className="error-msg">{errorMessage}</p>}

                    <div className="action-row">
                        <button className="btn-secondary" onClick={() => navigate(-1)}>
                            Back
                        </button>
                        <button
                            className="btn-purchase large"
                            onClick={() => setConfirmOpen(true)}
                            disabled={loading || status?.type === "success"}
                        >
                            {loading ? "Processing…" : "Confirm & Pay"}
                        </button>
                    </div>

                    {status?.type === "success" && (
                        <div className="success-block">
                            <h3>✅ Payment Successful</h3>
                            <p>
                                Your policy <strong>{status.policyId}</strong> is now active.
                            </p>
                            <button className="btn-primary" onClick={downloadReceiptClient}>
                                Download Receipt
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {confirmOpen && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal light"
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                        >
                            <h3>Confirm Purchase</h3>
                            <p>
                                You’re about to pay <strong>{fmt(price)}</strong> for{" "}
                                <strong>{cart.product}</strong>.
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setConfirmOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-purchase"
                                    onClick={() => {
                                        setConfirmOpen(false);
                                        handleConfirm();
                                    }}
                                >
                                    Pay Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
