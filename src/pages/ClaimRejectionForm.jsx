import React, { useState } from "react";
import "../styles/claimRejection.css";
import { Link } from "react-router-dom";

function ClaimRejectionForm() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        policyNumber: "",
        claimId: "",
        insurerName: "",
        rejectionReason: "",
        rejectionDate: "",
        claimAmount: "",
        additionalDetails: "",
        preferredContact: "email"
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const insurers = [
        "LifeGuard Assurance",
        "SecureHealth Plus",
        "AutoShield Insurance",
        "PropertyPro Insurance",
        "TravelSafe Global",
        "WealthProtect Corp",
        "Other"
    ];

    const rejectionReasons = [
        "Insufficient documentation",
        "Policy exclusions apply",
        "Pre-existing condition",
        "Claim filed after deadline",
        "Information mismatch",
        "Coverage lapsed",
        "Fraudulent claim suspected",
        "Other"
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
            newErrors.phone = "Please enter a valid 10-digit phone number";
        }

        if (!formData.policyNumber.trim()) {
            newErrors.policyNumber = "Policy number is required";
        }

        if (!formData.claimId.trim()) {
            newErrors.claimId = "Claim ID is required";
        }

        if (!formData.insurerName) {
            newErrors.insurerName = "Please select your insurer";
        }

        if (!formData.rejectionReason) {
            newErrors.rejectionReason = "Please select a rejection reason";
        }

        if (!formData.rejectionDate) {
            newErrors.rejectionDate = "Rejection date is required";
        }

        if (!formData.claimAmount.trim()) {
            newErrors.claimAmount = "Claim amount is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const submissionId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const dataToStore = {
                ...formData,
                submissionId,
                submittedAt: new Date().toISOString(),
                status: "pending"
            };

            await window.storage.set(submissionId, JSON.stringify(dataToStore));

            await new Promise(resolve => setTimeout(resolve, 1500));

            setSubmitSuccess(true);

            let count = 5;
            const countdownInterval = setInterval(() => {
                count -= 1;
                setCountdown(count);

                if (count <= 0) {
                    clearInterval(countdownInterval);
                    window.location.href = "https://www.insuranceclaimsupport.com";
                }
            }, 1000);

        } catch (error) {
            console.error("Submission error:", error);
            setErrors({ submit: "Failed to submit. Please try again." });
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className="claim-rejection-root">
                <div className="claim-rejection-container">

                    <div className="success-card">

                        <div className="success-icon">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <circle cx="40" cy="40" r="38" stroke="#27ae60" strokeWidth="4" />
                                <path d="M25 40L35 50L55 30" stroke="#27ae60" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="success-title">Submission Successful!</h2>
                        <p className="success-message">
                            Your claim rejection details have been recorded. Our support team will review your case and contact you within 24-48 hours.
                        </p>
                        <div className="submission-details">
                            <div className="detail-row">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{formData.fullName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{formData.email}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Claim ID:</span>
                                <span className="detail-value">{formData.claimId}</span>
                            </div>
                        </div>
                        <div className="redirect-notice">
                            <div className="countdown-circle">{countdown}</div>
                            <p>Redirecting to Claims Support Portal in <strong>{countdown}</strong> seconds...</p>
                        </div>
                        <button
                            className="redirect-btn"
                            onClick={() => window.location.href = "https://www.insuranceclaimsupport.com"}
                        >
                            Go Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="claim-rejection-root">
            <Link to={'/'} className="btn-ghost">Back</Link>

            <div className="claim-rejection-container">

                <div className="form-hero">

                    <div className="hero-icon">

                        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                            <rect x="8" y="12" width="40" height="36" rx="4" stroke="currentColor" strokeWidth="3" />
                            <path d="M16 12V8a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v4" stroke="currentColor" strokeWidth="3" />
                            <circle cx="28" cy="30" r="6" stroke="currentColor" strokeWidth="3" />
                            <path d="M28 30v-4M28 30h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="form-title">Claim Rejection Assistance</h1>
                    <p className="form-subtitle">
                        We're here to help you navigate the appeals process. Fill out the information below and our expert team will guide you through your next steps.
                    </p>
                    <div className="trust-badges">
                        <div className="badge">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6-4.9 2.6.9-5.3-4-3.9 5.5-.8z" fill="#e8b85a" />
                            </svg>
                            <span>98% Success Rate</span>
                        </div>
                        <div className="badge">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" stroke="#27ae60" strokeWidth="2" />
                                <path d="M7 10l2 2 4-4" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>Secure & Confidential</span>
                        </div>
                        <div className="badge">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2v16M2 10h16" stroke="#c88a06" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="10" cy="10" r="8" stroke="#c88a06" strokeWidth="2" />
                            </svg>
                            <span>24-48 Hour Response</span>
                        </div>
                    </div>
                </div>

                <div className="rejection-form">
                    {errors.submit && (
                        <div className="error-banner">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {errors.submit}
                        </div>
                    )}

                    <div className="form-section">
                        <h3 className="section-heading">Personal Information</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="form-label">
                                    Full Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`form-input ${errors.fullName ? "error" : ""}`}
                                    placeholder="Enter your full name"
                                />
                                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Email Address <span className="required">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`form-input ${errors.email ? "error" : ""}`}
                                    placeholder="your.email@example.com"
                                />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Phone Number <span className="required">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`form-input ${errors.phone ? "error" : ""}`}
                                    placeholder="10-digit mobile number"
                                />
                                {errors.phone && <span className="error-text">{errors.phone}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Preferred Contact Method</label>
                                <select
                                    name="preferredContact"
                                    value={formData.preferredContact}
                                    onChange={handleChange}
                                    className="form-input"
                                >
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-heading">Claim Details</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">
                                    Policy Number <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="policyNumber"
                                    value={formData.policyNumber}
                                    onChange={handleChange}
                                    className={`form-input ${errors.policyNumber ? "error" : ""}`}
                                    placeholder="Enter your policy number"
                                />
                                {errors.policyNumber && <span className="error-text">{errors.policyNumber}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Claim ID <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="claimId"
                                    value={formData.claimId}
                                    onChange={handleChange}
                                    className={`form-input ${errors.claimId ? "error" : ""}`}
                                    placeholder="Enter your claim ID"
                                />
                                {errors.claimId && <span className="error-text">{errors.claimId}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Insurance Company <span className="required">*</span>
                                </label>
                                <select
                                    name="insurerName"
                                    value={formData.insurerName}
                                    onChange={handleChange}
                                    className={`form-input ${errors.insurerName ? "error" : ""}`}
                                >
                                    <option value="">Select your insurer</option>
                                    {insurers.map(insurer => (
                                        <option key={insurer} value={insurer}>{insurer}</option>
                                    ))}
                                </select>
                                {errors.insurerName && <span className="error-text">{errors.insurerName}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Claim Amount <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="claimAmount"
                                    value={formData.claimAmount}
                                    onChange={handleChange}
                                    className={`form-input ${errors.claimAmount ? "error" : ""}`}
                                    placeholder="₹ 0.00"
                                />
                                {errors.claimAmount && <span className="error-text">{errors.claimAmount}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Rejection Reason <span className="required">*</span>
                                </label>
                                <select
                                    name="rejectionReason"
                                    value={formData.rejectionReason}
                                    onChange={handleChange}
                                    className={`form-input ${errors.rejectionReason ? "error" : ""}`}
                                >
                                    <option value="">Select rejection reason</option>
                                    {rejectionReasons.map(reason => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                                {errors.rejectionReason && <span className="error-text">{errors.rejectionReason}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Rejection Date <span className="required">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="rejectionDate"
                                    value={formData.rejectionDate}
                                    onChange={handleChange}
                                    className={`form-input ${errors.rejectionDate ? "error" : ""}`}
                                />
                                {errors.rejectionDate && <span className="error-text">{errors.rejectionDate}</span>}
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Additional Details</label>
                                <textarea
                                    name="additionalDetails"
                                    value={formData.additionalDetails}
                                    onChange={handleChange}
                                    className="form-input form-textarea"
                                    placeholder="Please provide any additional information about your claim rejection that might help us assist you better..."
                                    rows="5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <div className="privacy-notice">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2L3 4v4c0 3 2 5.5 5 6.5 3-1 5-3.5 5-6.5V4l-5-2z" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <p>Your information is encrypted and will only be used to process your claim assistance request.</p>
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="spinner"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Request
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="help-section">
                    <h4 className="help-title">Need Immediate Assistance?</h4>
                    <div className="help-options">
                        <div className="help-card">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <div>
                                <div className="help-label">Call Us</div>
                                <div className="help-value">1800-CLAIMS</div>
                            </div>
                        </div>
                        <div className="help-card">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <div>
                                <div className="help-label">Email Us</div>
                                <div className="help-value">support@claimsassist.com</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClaimRejectionForm;