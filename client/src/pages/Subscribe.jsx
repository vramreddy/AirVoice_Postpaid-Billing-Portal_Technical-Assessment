import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Check, ArrowRight, QrCode, CreditCard } from 'lucide-react';
import { Brand } from '../components/Brand';
import { ErrorState } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { rupee, msg } from '../utils/formatters';
import { api } from '../api/client';

export function Subscribe() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { login } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState(params.get('plan') === 'ultra' ? 'ultra' : 'prime');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState(params.get('mobile') || '');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Bangalore, Karnataka - 560001');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR'); // 'UPI_QR' or 'CARD'
  const [cardNumber, setCardNumber] = useState('4532 8920 1192 3841');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('482');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const planPrice = selectedPlan === 'ultra' ? 1499 : 999;
  const planName = selectedPlan === 'ultra' ? 'AirVoice Ultra Max ₹1,499' : 'AirVoice All-in-One Prime ₹999';

  // Demo QR data URL
  const demoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=subscribe.airvoice@upi%26pn=AirVoice%20Telecom%26am=${planPrice}.00%26cu=INR`;

  async function handleSubscribe(e) {
    e?.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!/^\d{10}$/.test(mobile.trim())) return setError('Enter a valid 10-digit mobile number.');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');

    setBusy(true);
    try {
      const res = await api.post('/subscribe', {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        planName,
        amount: planPrice,
        paymentMethod
      });

      setSuccessData(res.data);
      login(res.data.token, res.data.subscriber);
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sub-page">
      <header className="container sub-nav">
        <Brand />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Already a member?</span>
          <Link to="/login" className="button signin-btn">
            <User size={16} strokeWidth={2.5} /> Sign in
          </Link>
        </div>
      </header>

      <main className="container">
        <div className="sub-hero">
          <span className="eyebrow">
            <span className="blue-dot" /> INSTANT POSTPAID ACTIVATION
          </span>
          <h1>Activate your new AirVoice connection</h1>
          <p>Get started with our flagship ₹999 All-in-One plan. Instant digital SIM activation and transparent monthly billing.</p>
        </div>

        {/* PLAN SELECTION */}
        <div className="sub-plans-grid">
          <div
            className={'plan-card ' + (selectedPlan === 'prime' ? 'selected' : '')}
            onClick={() => setSelectedPlan('prime')}
          >
            <span className="plan-badge">MOST POPULAR • BEST VALUE</span>
            <div className="plan-header">
              <div>
                <div className="plan-name">AirVoice Prime All-in-One</div>
                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>Voice + 5G Data + DTH</div>
              </div>
              <div className="plan-price">
                ₹999<span>/mo</span>
              </div>
            </div>
            <p className="plan-desc">Ideal for individuals & families looking for complete home connectivity in one unified invoice.</p>
            <div className="plan-features">
              <div className="plan-feature-item">
                <Check size={18} /> Unlimited Voice calls across all networks
              </div>
              <div className="plan-feature-item">
                <Check size={18} /> 150 GB High-Speed 5G Data with rollover
              </div>
              <div className="plan-feature-item">
                <Check size={18} /> DTH 250+ HD Channels + Disney+ Hotstar
              </div>
            </div>
          </div>

          <div
            className={'plan-card ' + (selectedPlan === 'ultra' ? 'selected' : '')}
            onClick={() => setSelectedPlan('ultra')}
          >
            <div className="plan-header">
              <div>
                <div className="plan-name">AirVoice Ultra Max</div>
                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, marginTop: 4 }}>Ultra-Fast Entertainment</div>
              </div>
              <div className="plan-price">
                ₹1,499<span>/mo</span>
              </div>
            </div>
            <p className="plan-desc">For power streamers and connected smart homes with zero data caps and 4K entertainment.</p>
            <div className="plan-features">
              <div className="plan-feature-item">
                <Check size={18} /> Truly Unlimited 5G Data (No speed caps)
              </div>
              <div className="plan-feature-item">
                <Check size={18} /> DTH 350+ 4K Channels + Netflix & Prime
              </div>
              <div className="plan-feature-item">
                <Check size={18} /> 24/7 Dedicated VIP Account Concierge
              </div>
            </div>
          </div>
        </div>

        {/* CHECKOUT & DETAILS FORM */}
        <div className="checkout-panel">
          {/* LEFT: SUBSCRIBER INFO */}
          <div className="checkout-left">
            <h2>1. Subscriber Information</h2>
            <div className="checkout-sub">Enter the account owner details for SIM registration.</div>

            {error && <ErrorState message={error} />}

            <form id="sub-form" onSubmit={handleSubscribe} className="form-grid">
              <div className="form-group">
                <label>Full Legal Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Vikram Sharma"
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value);
                    if (!cardHolder) setCardHolder(e.target.value.toUpperCase());
                  }}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>10-digit Mobile Number *</label>
                  <input
                    className="form-input"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="vikram@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Installation / Service Address</label>
                <input
                  className="form-input"
                  placeholder="Street, City, Pincode"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, marginTop: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#64748b' }}>
                  <span>Subscription Plan</span>
                  <b style={{ color: '#0f172a' }}>{planName}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  <span>Initial Amount Payable</span>
                  <span style={{ color: '#1d68e3', fontSize: 18 }}>{rupee(planPrice)}</span>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: PAYMENT METHOD (QR CODE OR CARD) */}
          <div className="checkout-right">
            <h2>2. Payment & Activation</h2>
            <div className="checkout-sub">Choose your payment mode to activate immediately.</div>

            <div className="payment-method-selector">
              <button
                type="button"
                className={'method-tab ' + (paymentMethod === 'UPI_QR' ? 'active' : '')}
                onClick={() => setPaymentMethod('UPI_QR')}
              >
                <QrCode size={18} /> UPI QR Code
              </button>
              <button
                type="button"
                className={'method-tab ' + (paymentMethod === 'CARD' ? 'active' : '')}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={18} /> Debit / Credit Card
              </button>
            </div>

            {paymentMethod === 'UPI_QR' ? (
              <div className="upi-qr-box">
                <div className="upi-qr-image">
                  <img src={demoQrUrl} alt="UPI QR Code" />
                </div>
                <span className="badge-pill popular" style={{ marginBottom: 10 }}>
                  Scan with any UPI App
                </span>
                <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0' }}>
                  Scan with GPay, PhonePe, Paytm, or BHIM to pay <b>{rupee(planPrice)}</b>.
                </p>
                <div className="upi-apps-row">
                  <span className="upi-app-pill">Google Pay</span>
                  <span className="upi-app-pill">PhonePe</span>
                  <span className="upi-app-pill">Paytm</span>
                  <span className="upi-app-pill">CRED</span>
                </div>
                <button
                  type="submit"
                  form="sub-form"
                  disabled={busy}
                  className="button primary full large"
                  style={{ marginTop: 24 }}
                >
                  {busy ? 'Activating Connection…' : `Simulate UPI Payment (${rupee(planPrice)})`} <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div>
                {/* VIRTUAL CREDIT CARD DISPLAY */}
                <div className="virtual-card-wrapper">
                  <div className="virtual-card">
                    <div className="card-top">
                      <div className="card-chip" />
                      <div className="card-type">VISA</div>
                    </div>
                    <div className="card-number-display">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="card-bottom">
                      <div>
                        <small>Cardholder Name</small>
                        <b>{cardHolder || (fullName.toUpperCase() || 'YOUR NAME')}</b>
                      </div>
                      <div>
                        <small>Expires</small>
                        <b>{cardExpiry || '12/28'}</b>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      className="form-input"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Valid Thru (MM/YY)</label>
                      <input
                        className="form-input"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV / CVC</label>
                      <input
                        className="form-input"
                        maxLength={3}
                        type="password"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    form="sub-form"
                    disabled={busy}
                    className="button primary full large"
                    style={{ marginTop: 10 }}
                  >
                    {busy ? 'Processing Card…' : `Pay ${rupee(planPrice)} & Activate Connection`} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CELEBRATION MODAL ON SUCCESS */}
      {successData && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-success-icon">
              <Check size={38} strokeWidth={3} />
            </div>
            <span className="badge-pill popular" style={{ marginBottom: 12 }}>
              CONNECTION ACTIVATED
            </span>
            <h2 style={{ fontSize: 26, color: '#0b1a30', margin: '8px 0' }}>Welcome to AirVoice!</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              Your <b>{successData.subscriber?.plan}</b> is now live. We have credited your initial month's payment of <b>{rupee(planPrice)}</b> and created your account.
            </p>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, margin: '20px 0', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Account Number:</span>
                <b style={{ color: '#0b1a30' }}>{successData.subscriber?.accountNumber}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Registered Mobile:</span>
                <b style={{ color: '#0b1a30' }}>+91 {successData.subscriber?.mobile}</b>
              </div>
            </div>

            <button className="button primary full large" onClick={() => nav('/dashboard')}>
              Enter My Subscriber Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscribe;

