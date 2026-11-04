import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Check, ArrowDownToLine, ArrowRight, CircleAlert, LockKeyhole,
  ShieldCheck
} from 'lucide-react';
import { Shell } from '../components/Shell';
import { Loader, ErrorState } from '../components/Common';
import { rupee, month, msg } from '../utils/formatters';
import { api, downloadBill } from '../api/client';

export function Payment() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(null);

  useEffect(() => {
    api.get('/bills/' + id + '/qr')
      .then(r => setData(r.data))
      .catch(e => setError(msg(e)));
  }, [id]);

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/bills/' + id + '/mock-payment');
      setComplete(r.data.payment);
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Simulated QR payment" subtitle="Demonstration settlement flow with UPI QR code.">
      <Link className="back-btn" to={'/bills/' + id} style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to statement
      </Link>

      {error && <ErrorState message={error} />}

      {complete ? (
        <div className="payment-success panel">
          <div className="success-circle">
            <Check size={36} strokeWidth={3} />
          </div>
          <h2>Payment Recorded Successfully!</h2>
          <p>No money was transferred. Your statement balance has been updated to zero.</p>
          <div className="success-ref">
            Transaction Reference
            <b>{complete.reference}</b>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, width: '100%', maxWidth: 420 }}>
            <button
              className="button secondary large"
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              onClick={() => downloadBill(id, 'pdf')}
            >
              <ArrowDownToLine size={18} /> Download PDF
            </button>
            <Link
              className="button primary large"
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              to={'/bills/' + id}
            >
              View Statement <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      ) : !data ? (
        error ? null : <Loader />
      ) : (
        <div className="payment-layout">
          <div className="panel qr-panel">
            <span className="qr-step">STEP 01 / SCAN DEMO CODE</span>
            <h2>Scan & Pay via UPI</h2>
            <p>Demonstrates a live UPI payment flow. Point any UPI app camera or click confirm below.</p>
            <div className="qr-frame">
              <img alt="Demonstration UPI QR code" src={data.qr} />
            </div>
            <span className="demo-chip">
              <CircleAlert size={15} /> DEMO QR — NO REAL MONEY CHARGED
            </span>
            <p className="qr-caption">Click the confirmation button below to record the payment immediately.</p>
          </div>

          <div className="payment-right">
            <div className="panel payment-summary">
              <span className="qr-step">STEP 02 / CONFIRM SETTLEMENT</span>
              <h3>Payment Summary</h3>
              <div className="payment-item">
                <span>Invoice Number</span>
                <b>{data.bill.invoiceNumber}</b>
              </div>
              <div className="payment-item">
                <span>Billing Period</span>
                <b>{month(data.bill.periodStart)}</b>
              </div>
              <div className="payment-item">
                <span>Payment Mode</span>
                <b>UPI QR Simulation</b>
              </div>
              <div className="payment-amount">
                <span>Amount Due</span>
                <strong>{rupee(data.bill.balance)}</strong>
              </div>
              <button className="button primary full large" onClick={pay} disabled={busy}>
                {busy ? 'Recording payment…' : 'Confirm Mock Payment'} <ArrowRight size={18} />
              </button>
              <p className="payment-disclaimer">
                <LockKeyhole size={14} /> Assessment sandbox simulation.
              </p>
            </div>

            <div className="safety-info">
              <ShieldCheck size={24} />
              <p>
                <b>Safe Demonstration.</b> Confirming records a transaction row in the database, clears the outstanding bill balance, and updates your statements instantly.
              </p>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

export default Payment;

