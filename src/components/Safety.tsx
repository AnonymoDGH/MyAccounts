export default function Safety() {
  return (
    <div className="page-enter">
      <div style={{
        background: 'linear-gradient(135deg, var(--nav-bg) 0%, var(--card-bg) 100%)',
        borderBottom: '1px solid var(--border)', padding: '60px 80px 40px',
      }}>
        <div className="section-title">
          <i className="bi bi-shield-fill-check"></i> Your Security Matters
        </div>
        <h1 className="section-heading" style={{ marginBottom: 8 }}>Account Safety Guide</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 500, lineHeight: 1.7 }}>
          <i className="bi bi-info-circle-fill" style={{ color: 'var(--accent2)', marginRight: 6 }}></i>
          Protecting your digital assets is our top priority. Follow these guidelines to keep your accounts secure.
        </p>
      </div>

      <div className="section">
        <div className="safety-content">

          <div className="safety-section">
            <div className="safety-section-title">
              <i className="bi bi-lock-fill"></i> Securing Your New Account
            </div>
            <div className="safety-section-body">
              Once you receive your account credentials, it is crucial to change the password immediately. 
              Use a unique, complex password that you haven't used on other platforms. 
              We highly recommend using a password manager like Bitwarden or 1Password to keep track of your credentials securely.
            </div>
          </div>

          <div className="safety-section">
            <div className="safety-section-title">
              <i className="bi bi-shield-check"></i> Two-Factor Authentication (2FA)
            </div>
            <div className="safety-section-body">
              <p style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="bi bi-check-circle-fill" style={{ color: 'var(--green)', flexShrink: 0, marginTop: 3 }}></i>
                <span><strong>Enable 2FA.</strong> Always enable Two-Factor Authentication if the service supports it. Use an app like Google Authenticator or Authy.</span>
              </p>
              <p style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="bi bi-check-circle-fill" style={{ color: 'var(--green)', flexShrink: 0, marginTop: 3 }}></i>
                <span><strong>Backup Codes.</strong> Save your 2FA backup codes in a safe, offline location (like a physical notebook).</span>
              </p>
              <p style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="bi bi-check-circle-fill" style={{ color: 'var(--green)', flexShrink: 0, marginTop: 3 }}></i>
                <span><strong>Email Security.</strong> Ensure the email associated with your account is also protected with a strong password and 2FA.</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="bi bi-x-circle-fill" style={{ color: '#e74c3c', flexShrink: 0, marginTop: 3 }}></i>
                <span><strong>Don't Share.</strong> Never share your account credentials or 2FA codes with anyone, including people claiming to be "support".</span>
              </p>
            </div>
          </div>

          <div className="safety-section">
            <div className="safety-section-title">
              <i className="bi bi-lightning-charge-fill"></i> Warranty & Replacements
            </div>
            <div className="safety-section-body">
              <p style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="bi bi-clock-fill" style={{ color: 'var(--accent2)', flexShrink: 0, marginTop: 3 }}></i>
                <span><strong>Check Immediately.</strong> Test your account as soon as you receive it. Report any issues within the first 24 hours.</span>
              </p>
              <p style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="bi bi-patch-check-fill" style={{ color: 'var(--accent2)', flexShrink: 0, marginTop: 3 }}></i>
                <span><strong>Warranty Period.</strong> Most accounts come with a 30-day replacement warranty if the account stops working through no fault of your own.</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="bi bi-chat-dots-fill" style={{ color: 'var(--accent2)', flexShrink: 0, marginTop: 3 }}></i>
                <span><strong>Contact Support.</strong> If you encounter a problem, open a ticket through our Contact page with your order ID.</span>
              </p>
            </div>
          </div>

          <div className="safety-section" style={{ borderColor: 'rgba(255,80,80,0.2)' }}>
            <div className="safety-section-title" style={{ color: '#e74c3c' }}>
              <i className="bi bi-exclamation-triangle-fill"></i> Important Notice
            </div>
            <div className="safety-section-body">
              We are not responsible for accounts that are banned or locked due to user violations of the service's Terms of Service (TOS) after the initial successful login.
            </div>
            <div className="safety-warning">
              <i className="bi bi-exclamation-octagon-fill"></i>
              <span>
                <strong>Disclaimer:</strong> This guide is for educational purposes. 
                MYACCOUNTS provides premium digital access solutions. We do not support or condone the use of our services for illegal activities.
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
