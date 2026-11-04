import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Tv2, Wifi, FileText, FileSpreadsheet, ArrowDownToLine,
  ArrowRight, CheckCheck, CircleCheck
} from 'lucide-react';
import { Shell } from '../components/Shell';
import { Loader, ErrorState, Status, IconTile } from '../components/Common';
import { rupee, day, month, msg } from '../utils/formatters';
import { api, downloadBill } from '../api/client';

export function BillDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    api.get('/bills/' + id)
      .then(r => setData(r.data))
      .catch(e => setError(msg(e)));
  }, [id]);

  const b = data?.bill;

  return (
    <Shell title="Invoice details" subtitle="Itemized monthly statement line by line.">
      <Link className="back-btn" to="/bills" style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to billing history
      </Link>

      {error ? (
        <ErrorState message={error} />
      ) : !b ? (
        <Loader />
      ) : (
        <div className="detail-grid">
          <div className="panel invoice-detail">
            <div className="invoice-top">
              <div>
                <span className="invoice-kicker">AIRVOICE POSTPAID STATEMENT</span>
                <h2>{month(b.periodStart)}</h2>
                <p style={{ color: '#64748b', fontFamily: 'monospace' }}>{b.invoiceNumber}</p>
              </div>
              <Status paid={b.status === 'paid'} />
            </div>

            <div className="invoice-info">
              <div>
                <small>Billing Period</small>
                <b>
                  {day(b.periodStart)} – {day(b.periodEnd)}
                </b>
              </div>
              <div>
                <small>Payment Due Date</small>
                <b>{day(b.dueDate)}</b>
              </div>
            </div>

            <h3 style={{ fontSize: 16, margin: '24px 0 14px', color: '#0b1a30' }}>
              Itemized Service Charges
            </h3>

            <div className="service-line">
              <span>
                <IconTile>
                  <Phone size={18} />
                </IconTile>
                <span>
                  <b>Voice Services</b>
                  <small>Unlimited Pan-India Calling & Roaming</small>
                </span>
              </span>
              <strong>{rupee(b.voice)}</strong>
            </div>

            <div className="service-line">
              <span>
                <IconTile type="violet">
                  <Tv2 size={18} />
                </IconTile>
                <span>
                  <b>DTH Services</b>
                  <small>Digital TV 250+ HD Channels Pack</small>
                </span>
              </span>
              <strong>{rupee(b.dth)}</strong>
            </div>

            <div className="service-line">
              <span>
                <IconTile type="green">
                  <Wifi size={18} />
                </IconTile>
                <span>
                  <b>Internet Broadband</b>
                  <small>High-Speed 5G/4G Fiber Connection</small>
                </span>
              </span>
              <strong>{rupee(b.internet)}</strong>
            </div>

            <div className="invoice-totals">
              <div>
                <span>Service Total</span>
                <b>{rupee(b.total)}</b>
              </div>
              <div>
                <span>Payments Settled</span>
                <b style={{ color: '#16a34a' }}>− {rupee(b.paid)}</b>
              </div>
              <div className="grand-total">
                <span>Remaining Balance</span>
                <strong>{rupee(b.balance)}</strong>
              </div>
            </div>
          </div>

          <div className="detail-aside">
            <div className="panel statement-actions">
              <h3>Download Statement</h3>
              <p>Official statement download in PDF, Excel, or CSV format.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                <button
                  className="button primary full"
                  disabled={Boolean(downloading)}
                  onClick={() => downloadBill(id, 'pdf', setDownloading, setError)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    <FileText size={18} /> PDF Document (.pdf)
                  </span>
                  {downloading === 'pdf' ? <span className="spinner tiny" /> : <ArrowDownToLine size={18} />}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    className="button secondary"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      padding: '10px 12px'
                    }}
                    disabled={Boolean(downloading)}
                    onClick={() => downloadBill(id, 'xls', setDownloading, setError)}
                  >
                    <FileSpreadsheet size={16} /> Excel (.xlsx)
                    {downloading === 'xls' && <span className="spinner tiny" />}
                  </button>
                  <button
                    className="button secondary"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      padding: '10px 12px'
                    }}
                    disabled={Boolean(downloading)}
                    onClick={() => downloadBill(id, 'csv', setDownloading, setError)}
                  >
                    <ArrowDownToLine size={16} /> CSV (.csv)
                    {downloading === 'csv' && <span className="spinner tiny" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pay-action-panel">
              <span className="pay-action-kicker">
                {b.balance > 0 ? 'OUTSTANDING BALANCE' : 'INVOICE SETTLED'}
              </span>
              <strong>{rupee(b.balance)}</strong>
              <p>
                {b.balance > 0
                  ? 'This invoice has an unsettled balance.'
                  : 'No further action needed. Statement fully paid.'}
              </p>
              {b.balance > 0 ? (
                <Link to={'/bills/' + id + '/pay'} className="button white full">
                  Pay Now with Demo UPI <ArrowRight size={17} />
                </Link>
              ) : (
                <div className="settled-message">
                  <CheckCheck size={20} /> All Charges Cleared
                </div>
              )}
            </div>

            <div className="panel payment-mini">
              <h3>Recorded Payments</h3>
              {data.payments.length ? (
                data.payments.map(p => (
                  <div className="mini-payment" key={p.id}>
                    <span>
                      <CircleCheck size={18} />
                      <span>
                        <b>{rupee(p.amount)}</b>
                        <small>{day(p.paid_at)}</small>
                      </span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge-pill status-live">{p.method || 'MOCK_UPI'}</span>
                      <button
                        className="row-button"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                        onClick={() => downloadBill(id, 'pdf')}
                        title="Download Statement (.pdf)"
                      >
                        <ArrowDownToLine size={12} /> PDF
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  No payment records against this statement yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

export default BillDetail;

