import React, { useState } from "react";
import "../styles/contactUs.css";
import { Link } from "react-router-dom";

function ContactUs() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        serviceInterest: "",
        message: ""
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const serviceOptions = [
        "Life Insurance",
        "Health Insurance",
        "Auto Insurance",
        "Home Insurance",
        "Business Insurance",
        "Claim Assistance",
        "Policy Consultation",
        "General Inquiry"
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
            newErrors.fullName = "Name is required";
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

        if (!formData.serviceInterest) {
            newErrors.serviceInterest = "Please select a service";
        }

        if (!formData.message.trim()) {
            newErrors.message = "Message is required";
        } else if (formData.message.trim().length < 10) {
            newErrors.message = "Message must be at least 10 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const dataToStore = {
                ...formData,
                contactId,
                submittedAt: new Date().toISOString(),
                status: "new"
            };

            await window.storage.set(contactId, JSON.stringify(dataToStore));
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSubmitSuccess(true);
            setFormData({
                fullName: "",
                email: "",
                phone: "",
                serviceInterest: "",
                message: ""
            });

        } catch (error) {
            console.error("Submission error:", error);
            setErrors({ submit: "Failed to submit. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-root">
            <Link to={'/'} className="btn-ghost">Back</Link>

            <div className="contact-container">
                <div className="contact-hero">
                    <div className="hero-icon">
                        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                            <path d="M14 18a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V18z" stroke="currentColor" strokeWidth="3" />
                            <path d="M14 22l14 10 14-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="3" />
                        </svg>
                    </div>
                    <h1 className="hero-title">Get in Touch</h1>
                    <p className="hero-subtitle">
                        Have questions or need assistance? Our dedicated team is here to help you find the perfect insurance solution for your needs.
                    </p>
                    <div className="hero-features">
                        <div className="feature-item">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="#27ae60" strokeWidth="2" />
                                <path d="M7 10l2 2 4-4" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>24/7 Support</span>
                        </div>
                        <div className="feature-item">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6-4.9 2.6.9-5.3-4-3.9 5.5-.8z" fill="#e8b85a" />
                            </svg>
                            <span>Expert Advisors</span>
                        </div>
                        <div className="feature-item">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2v16M2 10h16" stroke="#c88a06" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="10" cy="10" r="8" stroke="#c88a06" strokeWidth="2" />
                            </svg>
                            <span>Quick Response</span>
                        </div>
                    </div>
                </div>

                {submitSuccess && (
                    <div className="success-banner">
                        <div className="success-content">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="22" stroke="#27ae60" strokeWidth="3" />
                                <path d="M16 24l6 6 10-10" stroke="#27ae60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div>
                                <h3>Message Sent Successfully!</h3>
                                <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                            </div>
                        </div>
                        <button
                            className="close-banner"
                            onClick={() => setSubmitSuccess(false)}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="contact-content">
                    <div className="contact-form-section">
                        <div className="form-card">
                            <div className="form-header">
                                <h2 className="form-title">Send Us a Message</h2>
                                <p className="form-description">Fill out the form below and we'll respond as soon as possible</p>
                            </div>

                            {errors.submit && (
                                <div className="error-banner">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                                        <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    {errors.submit}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">
                                        Full Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`form-input ${errors.fullName ? "error" : ""}`}
                                        placeholder="John Doe"
                                    />
                                    {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                                </div>

                                <div className="form-row">
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
                                            placeholder="john@example.com"
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
                                            placeholder="10-digit number"
                                        />
                                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Service Interest <span className="required">*</span>
                                    </label>
                                    <select
                                        name="serviceInterest"
                                        value={formData.serviceInterest}
                                        onChange={handleChange}
                                        className={`form-input ${errors.serviceInterest ? "error" : ""}`}
                                    >
                                        <option value="">Select a service</option>
                                        {serviceOptions.map(service => (
                                            <option key={service} value={service}>{service}</option>
                                        ))}
                                    </select>
                                    {errors.serviceInterest && <span className="error-text">{errors.serviceInterest}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Your Message <span className="required">*</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className={`form-input form-textarea ${errors.message ? "error" : ""}`}
                                        placeholder="Tell us how we can help you..."
                                        rows="5"
                                    />
                                    {errors.message && <span className="error-text">{errors.message}</span>}
                                </div>

                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="spinner"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M18 2L9 11M18 2l-6 16-3-7-7-3 16-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="contact-info-section">
                        <div className="map-container">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.8285625478946!2d72.8776559!3d19.0759837!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c63aceef0c69%3A0x2aa80cf2287dfa3b!2sJogeshwari%20West%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1635000000000!5m2!1sen!2sin"
                                width="100%"
                                height="300"
                                style={{ border: 0, borderRadius: '16px' }}
                                allowFullScreen=""
                                loading="lazy"
                                title="Office Location"
                            ></iframe>
                        </div>

                        <div className="info-cards">
                            <div className="info-card">
                                <div className="info-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div className="info-content">
                                    <h4 className="info-title">Phone</h4>
                                    <p className="info-text">1800-CLAIMS (254467)</p>
                                    <p className="info-text">+91 22 1234 5678</p>
                                    <span className="info-badge">24/7 Available</span>
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="info-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                        <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div className="info-content">
                                    <h4 className="info-title">Email</h4>
                                    <p className="info-text">support@insurancepro.com</p>
                                    <p className="info-text">claims@insurancepro.com</p>
                                    <span className="info-badge">Response in 2-4 hours</span>
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="info-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div className="info-content">
                                    <h4 className="info-title">Office</h4>
                                    <p className="info-text">123 Insurance Plaza</p>
                                    <p className="info-text">Jogeshwari West, Mumbai</p>
                                    <span className="info-badge">Mon-Sat 9AM-6PM</span>
                                </div>
                            </div>
                        </div>

                        <div className="business-hours">
                            <h3 className="hours-title">Business Hours</h3>
                            <div className="hours-list">
                                <div className="hours-item">
                                    <span className="day">Monday - Friday</span>
                                    <span className="time">9:00 AM - 6:00 PM</span>
                                </div>
                                <div className="hours-item">
                                    <span className="day">Saturday</span>
                                    <span className="time">10:00 AM - 4:00 PM</span>
                                </div>
                                <div className="hours-item">
                                    <span className="day">Sunday</span>
                                    <span className="time">Closed</span>
                                </div>
                                <div className="hours-note">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span>Emergency support available 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUs;