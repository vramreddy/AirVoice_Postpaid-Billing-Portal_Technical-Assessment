import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  ShieldCheck, CircleCheck, CircleAlert, ArrowLeft, ArrowRight, LockKeyhole
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { ErrorState } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { msg } from '../utils/formatters';
import { api } from '../api/client';

export function Login() {
  const { token, login } = useAuth();
  const nav = useNavigate();
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [masked, setMasked] = useState('');
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notSubscribed, setNotSubscribed] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  if (token) return <Navigate to="/dashboard" replace />;

  async function request(e) {
    e?.preventDefault();
    setError('');
    setNotSubscribed(false);
    setBusy(true);

    try {
      const r = await api.post('/auth/request-otp', { mobile });
      setMasked(r.data.maskedEmail);
      if (r.data.devOtp) setOtp(r.data.devOtp);
      setStep(2);
      setWait(30);
    } catch (e) {
      if (e.response?.data?.notSubscribed || e.response?.status === 404) {
        setNotSubscribed(true);
      } else {
        const errorMsg = e.code === 'ECONNABORTED' || e.message?.includes('timeout') || e.message?.includes('Network Error')
          ? 'Cloud server is waking up. Please click again in a few seconds.'
          : msg(e);
        setError(errorMsg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const r = await api.post('/auth/verify-otp', { mobile, otp });
      login(r.data.token, r.data.subscriber);
      nav('/dashboard');
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <Brand light />
        <div className="auth-visual-content">
          <span className="auth-overline">SMARTER BILLING STARTS HERE</span>
          <h2>
            Connected to more.<br />
            <em>Complicated by less.</em>
          </h2>
          <p>Everything about your postpaid account, thoughtfully brought together in one clean workspace.</p>
          <div className="visual-proof">
            <span>
              <CircleCheck size={18} /> Single dashboard for Voice, 5G & DTH
            </span>
            <span>
              <CircleCheck size={18} /> Transparent monthly itemized invoices
            </span>
            <span>
              <CircleCheck size={18} /> Instant statements in official PDF format
            </span>
          </div>
        </div>
        <div className="visual-footer">AIRVOICE / SUBSCRIBER EXPERIENCE</div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <span className="auth-step">
            SUBSCRIBER ACCESS <span className="step-line" /> 0{step} / 02
          </span>

          {step === 2 && (
            <button
              className="back-btn"
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          <div className="auth-icon">
            <ShieldCheck size={28} />
          </div>
          <h1>{step === 1 ? 'Welcome back.' : 'Verify your identity.'}</h1>
          <p className="auth-sub">
            {step === 1
              ? 'Sign in using the mobile number registered with your AirVoice postpaid account.'
              : `We've sent a six-digit verification code to ${masked}.`}
          </p>

          {error && <ErrorState message={error} />}

          {/* NOT SUBSCRIBED CARD */}
          {notSubscribed && (
            <div className="not-subscribed-banner">
              <div className="not-subscribed-header">
                <CircleAlert size={22} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <b>Not Subscribed Yet</b>
                  <p>
                    Mobile number <b>+91 {mobile}</b> is not registered. Join today with our ₹999/mo All-in-One plan to activate your connection instantly.
                  </p>
                </div>
              </div>
              <Link
                to={`/subscribe?mobile=${mobile}`}
                className="button accent full"
                style={{ textDecoration: 'none', marginTop: 4 }}
              >
                Subscribe Now for ₹999 <ArrowRight size={17} />
              </Link>
            </div>
          )}

          <form onSubmit={step === 1 ? request : verify}>
            <label>{step === 1 ? 'Registered mobile number' : 'Six-digit verification code'}</label>
            {step === 1 ? (
              <div className="phone-input">
                <span>+91</span>
                <input
                  autoComplete="tel"
                  placeholder="Enter 10-digit number"
                  value={mobile}
                  maxLength={10}
                  onChange={e => {
                    setMobile(e.target.value.replace(/\D/g, ''));
                    setNotSubscribed(false);
                  }}
                  required
                />
              </div>
            ) : (
              <input
                className="otp-input"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="— — — — — —"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            )}

            <button
              className="button primary full auth-submit"
              type="submit"
              disabled={busy || (step === 1 ? mobile.length !== 10 : otp.length !== 6)}
            >
              {busy ? 'Please wait…' : step === 1 ? 'Send verification code' : 'Verify & sign in'}
              <ArrowRight size={18} />
            </button>
          </form>

          {step === 2 && (
            <div className="resend">
              Didn't receive the code?{' '}
              <button disabled={wait > 0 || busy} onClick={request}>
                {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
              </button>
            </div>
          )}

          <div className="auth-note">
            <LockKeyhole size={16} />
            <span>
              Your account is protected with one-time verification. Check the demo code in{' '}
              <a href="http://localhost:8025" target="_blank" rel="noreferrer">
                Mailpit inbox
              </a>.
            </span>
          </div>

          <div className="join-airvoice-callout">
            <div>
              <span className="join-callout-title">New to AirVoice?</span>
              <p className="join-callout-sub">Get started with our all-in-one ₹999 plan</p>
            </div>
            <Link to="/subscribe" className="button primary" style={{ padding: '9px 16px', fontSize: 12 }}>
              Subscribe for ₹999 <ArrowRight size={14} />
            </Link>
          </div>

          <p className="auth-help">
            Demo active account: <span>9876543210</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

