import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowDownToLine, ArrowUpRight } from 'lucide-react';
import { rupee, day, month, msg } from '../utils/formatters';
import { api, downloadBill } from '../api/client';
import { Status } from './Common';

export function useBills() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/bills')
      .then(r => setData(r.data))
      .catch(e => setError(msg(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => refresh(), [refresh]);
  return { data, error, loading, refresh };
}

export function BillTable({ bills, compact = false }) {
  const nav = useNavigate();

  if (!bills.length) {
    return (
      <div className="center-state">
        <Receipt size={32} style={{ color: '#94a3b8', marginBottom: 10 }} />
        <h3 style={{ fontSize: 16, color: '#0b1a30' }}>No statements found</h3>
        <p style={{ fontSize: 13, color: '#64748b' }}>No billing records matched your filter criteria.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="statement-compact-list">
        {bills.map(b => (
          <div
            className="statement-compact-row"
            key={b.id}
            onClick={() => nav('/bills/' + b.id)}
          >
            <div className="statement-row-left">
              <span className={'statement-icon-box ' + (b.status === 'paid' ? 'paid' : 'unpaid')}>
                <Receipt size={18} />
              </span>
              <div>
                <div className="statement-row-period">{month(b.periodStart)}</div>
                <div className="statement-meta">
                  <span className="statement-inv-badge">{b.invoiceNumber}</span>
                  <span>{day(b.periodStart)} – {day(b.periodEnd)}</span>
                  <span>Due {day(b.dueDate)}</span>
                </div>
              </div>
            </div>

            <div className="statement-row-amounts">
              <div className="statement-total">{rupee(b.total)}</div>
              <small className={b.balance > 0 ? 'statement-due-warn' : 'statement-due-settled'}>
                {b.balance > 0 ? `Due: ${rupee(b.balance)}` : 'Cleared'}
              </small>
            </div>

            <div className="statement-row-right">
              <Status paid={b.status === 'paid'} />
              <button
                className="row-button"
                onClick={e => {
                  e.stopPropagation();
                  nav('/bills/' + b.id);
                }}
              >
                View bill <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="table-responsive-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Billing period</th>
            <th>Invoice number</th>
            <th>Total amount</th>
            <th>Outstanding</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map(b => (
            <tr key={b.id}>
              <td>
                <div className="row-title">{month(b.periodStart)}</div>
                <div className="row-small">{day(b.periodStart)} – {day(b.periodEnd)}</div>
                <div className="row-small" style={{ fontSize: 11, color: '#94a3b8' }}>Due {day(b.dueDate)}</div>
              </td>
              <td className="muted-cell">{b.invoiceNumber}</td>
              <td className="amount-cell">{rupee(b.total)}</td>
              <td className="amount-cell">
                <span style={{ color: b.balance > 0 ? '#c2410c' : '#15803d' }}>
                  {rupee(b.balance)}
                </span>
              </td>
              <td><Status paid={b.status === 'paid'} /></td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className="row-button"
                    onClick={() => downloadBill(b.id, 'pdf')}
                    title="Download Statement PDF"
                  >
                    <ArrowDownToLine size={12} /> PDF
                  </button>
                  <button
                    className="row-button"
                    onClick={() => downloadBill(b.id, 'xls')}
                    title="Download Statement Excel (.xlsx)"
                  >
                    <ArrowDownToLine size={12} /> XLS
                  </button>
                  <button
                    className="row-button"
                    onClick={() => downloadBill(b.id, 'csv')}
                    title="Download Statement CSV"
                  >
                    <ArrowDownToLine size={12} /> CSV
                  </button>
                  <button className="row-button" onClick={() => nav('/bills/' + b.id)}>
                    View bill <ArrowUpRight size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BillTable;

