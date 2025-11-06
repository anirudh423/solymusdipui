import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/privacyPolicy.css';


function PrivacyPolicy() {
    return (
        <div className="privacy-root">
            <Link to={'/'} className="btn-ghost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                Back to Home
            </Link>

            <div className="privacy-container">

                <header className="policy-header">
                    <h1 className="policy-title">Privacy Policy</h1>
                    <p className="policy-subtitle">
                        A Pledge to Our Clients | Last Updated: November 6, 2025
                    </p>
                </header>

                <div className="commitment-banner">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                </div>

                <div className="policy-divider"></div>

                <div className="policy-content">

                    <section className="policy-section">
                        <h2 className="section-header">1. Information We Collect</h2>
                        <div className="section-body">
                            <p>We collect various types of information in connection with the services we provide, which include securing your financial future and offering expert consultation. The data collected falls into the following categories:</p>
                            <ul>
                                <li><strong>Personal Identifiable Information (PII):</strong> Data provided directly by you, such as full name, professional email address, verified phone number, and specific details related to your insurance interest (Life, Health, Auto, Business) when utilizing our digital contact or quotation services.</li>
                                <li><strong>Financial and Policy Data (Post-Engagement):</strong> Information required to underwrite or service a policy, including billing address, date of birth, and claims history. This sensitive information is processed with the highest level of encryption and regulatory compliance.</li>
                                <li><strong>Usage and Analytical Data:</strong> Information automatically collected about your interaction with our site, including secure connection logs, browser type, geo-location (city level only), and session duration. This data is strictly aggregated and anonymized for service optimization.</li>
                            </ul>
                            <p>We affirm that we do not knowingly collect information from individuals under the age of 16. If we become aware of such data being collected without verifiable parental consent, we will take immediate steps to delete it.</p>
                        </div>
                    </section>

                    <section className="policy-section">
                        <h2 className="section-header">2. Use of Collected Information</h2>
                        <div className="section-body">
                            <p>The integrity of your data is paramount. We restrict the use of collected information to the following core operational imperatives:</p>
                            <ol>
                                <li><strong>Bespoke Service Delivery:</strong> To analyze your specific needs and provide accurate, tailored insurance quotes and personalized policy consultation services, facilitating a clear path to securing your assets.</li>
                                <li><strong>Client Relations and Compliance:</strong> To send you essential policy updates, mandatory legal disclosures, and security alerts. Marketing communication is opt-in and handled separately.</li>
                                <li><strong>Proprietary Platform Security:</strong> To continuously monitor and enhance the security architecture, performance, and stability of our digital platform against evolving cyber threats, ensuring uninterrupted, trustworthy service.</li>
                            </ol>
                        </div>
                    </section>

                    <section className="policy-section">
                        <h2 className="section-header">3. Data Security and Retention</h2>
                        <div className="section-body">
                            <p>Our security framework is designed around a principle of least privilege and zero trust. We employ industry-leading security measures, including comprehensive **end-to-end HTTPS encryption**, granular data segmentation, and strict, multi-factor access control protocols for all authorized personnel. Your data is never sold to third parties.</p>
                            <div className="security-highlight">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                <span>PII is protected by banking-grade encryption and audited daily for compliance.</span>
                            </div>
                            <p>We retain PII only for as long as necessary to fulfill the purposes outlined in this policy, including legal, accounting, or reporting requirements. Data no longer required is permanently and securely disposed of.</p>
                        </div>
                    </section>

                    <section className="policy-section">
                        <h2 className="section-header">4. Your Privacy Rights</h2>
                        <div className="section-body">
                            <p>We recognize and respect your fundamental rights concerning your personal information, consistent with global privacy mandates such as GDPR and CCPA. You maintain the right to:</p>
                            <ul>
                                <li>**Right to Access:** Obtain confirmation as to whether or not personal data concerning you is being processed, and access to that data.</li>
                                <li>**Right to Rectification:** Request the correction of inaccurate or incomplete data we hold about you.</li>
                                <li>**Right to Erasure (The Right to be Forgotten):** Request the deletion or restriction of your personal information, subject to regulatory retention mandates.</li>
                            </ul>
                            <p>To exercise any of these rights, please submit a formal request via the dedicated support email found on our Contact Us page. We guarantee timely adherence to all legally mandated response timelines.</p>
                        </div>
                    </section>

                    <section className="policy-section final-section">
                        <h2 className="section-header">5. Governing Law and Contact</h2>
                        <div className="section-body">
                            <p>This Privacy Policy is governed by the laws of the jurisdiction where our headquarters are located, excluding its conflict of law provisions. Any legal action or proceeding relating to the website shall be instituted in a state or federal court in that jurisdiction.</p>
                            <p>For any questions or concerns regarding this policy, please contact our Data Protection Officer:</p>
                            <address className="contact-details">
                                **Data Protection Officer**<br />
                                Email: <a href="mailto:dpo@insurancepro.com">dpo@insurancepro.com</a><br />
                                Address: 123 Corporate Tower, Mumbai, India
                            </address>
                        </div>
                    </section>

                </div>

                <div className="policy-metadata">
                    <h3 className="metadata-title">Regulatory Assurance & Oversight</h3>
                    <div className="metadata-table">
                        <div className="metadata-item">
                            <strong>Jurisdiction:</strong> Global (Compliance via GDPR, CCPA framework)
                        </div>
                        <div className="metadata-item">
                            <strong>Data Controller:</strong> InsurancePro Legal Services, LLC
                        </div>
                        <div className="metadata-item">
                            <strong>Retention Period:</strong> As required by law (min. 7 years)
                        </div>
                        <div className="metadata-item">
                            <strong>Policy Auditor:</strong> [Independent Firm Name] - Annually
                        </div>
                    </div>
                </div>

            </div>

            <footer className="policy-footer">
                <p>&copy; {new Date().getFullYear()} InsurancePro. All Rights Reserved. Protecting your privacy since 2025.</p>
            </footer>
        </div>
    );
}

export default PrivacyPolicy;