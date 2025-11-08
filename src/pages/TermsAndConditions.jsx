import React from 'react'
import '../styles/StaticPages.css'

export default function TermsAndConditions(){
  return (
    <div className="static-root white-theme">
      <section className="static-hero">
        <div className="static-content">
          <h1>Terms & Conditions</h1>
          <p className="lead muted">Please read these terms carefully before using Solymus services.</p>
        </div>
      </section>

      <article className="static-article card">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Solymus services, you agree to be bound by these Terms and our Privacy Policy.</p>

        <h2>2. Use of Service</h2>
        <p>Services are provided for informational purposes. You must provide accurate information and use the services lawfully.</p>

        <h2>3. Payments and Refunds</h2>
        <p>Payment terms are governed by the insurer and payment provider. Refund policies vary by product.</p>

        <h2>4. Liability</h2>
        <p>To the maximum extent permitted by law, Solymus disclaims liability for indirect or consequential damages.</p>

        <h2>5. Changes</h2>
        <p>We may update these Terms from time to time. Continued use constitutes acceptance.</p>

        <div className="muted small" style={{marginTop:18}}>Last updated: Nov 8, 2025</div>
      </article>
    </div>
  )
}
