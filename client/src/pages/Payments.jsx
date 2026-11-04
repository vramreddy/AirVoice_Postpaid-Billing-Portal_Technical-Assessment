import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowDownToLine } from 'lucide-react';
import { Shell } from '../components/Shell';
import { Loader, ErrorState, Status, IconTile } from '../components/Common';
import { rupee, day, msg } from '../utils/formatters';
import { api, downloadBill } from '../api/client';

export function Payments() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/payments')
      .then(r => setData(r.data))
      .catch(e => setError(msg(e)));
  }, []);

  return (
    <Shell title="Payment history" subtitle="Every payment transaction recorded against your account.">
      <div className="panel bill-list-panel">
        <div className="panel-header">
          <div>
            <h3>All Transactions</h3>
            <p>Demonstration settlement transactions are listed chronologically.</p>
          </div>
          <IconTile type="green">
            <History size={20} />
          </IconTile>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : !data ? (
          <Loader />
        ) : (
          <div className="table-responsive-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Statement</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Receipt / Invoice</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map(p => (
                  <tr key={p.id}>
                    <td>{day(p.paid_at)}</td>
                    <td>
                      <Link className="table-link" to={'/bills/' + p.bill_id}>
                        {p.invoice_number}
                      </Link>
                    </td>
                    <td className="muted-cell">{p.reference}</td>
                    <td className="amount-cell">{rupee(p.amount)}</td>
                    <td>
                      <span className="badge-pill prime" style={{ fontSize: 10 }}>
                        {p.method || 'MOCK_UPI'}
                      </span>
                    </td>
                    <td>
                      <Status paid />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="row-button"
                        onClick={() => downloadBill(p.bill_id, 'pdf')}
                        title="Download Statement (.pdf)"
                      >
                        <ArrowDownToLine size={13} /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.payments.length && (
              <div className="center-state">No payment records found.</div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

export default Payments;

