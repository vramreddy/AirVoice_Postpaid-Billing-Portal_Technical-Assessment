import React, { useState } from 'react';
import { Shell } from '../components/Shell';
import { Loader, ErrorState } from '../components/Common';
import { BillTable, useBills } from '../components/BillTable';
import { month } from '../utils/formatters';

export function Bills() {
  const { data, error, loading, refresh } = useBills();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const bills = (data?.bills || []).filter(
    b =>
      (filter === 'all' || b.status === filter) &&
      `${b.invoiceNumber} ${month(b.periodStart)}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell title="Billing history" subtitle="Complete record of all your generated monthly statements.">
      <div className="panel bill-list-panel">
        <div className="panel-header">
          <div>
            <h3>All Billing Records</h3>
            <p>Select any invoice to inspect line-by-line itemized charges or download PDF statements.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="form-input"
              style={{ width: 200, padding: '8px 12px', fontSize: 13 }}
              placeholder="Search month or invoice…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="form-input"
              style={{ width: 140, padding: '8px 12px', fontSize: 13 }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} retry={refresh} />
        ) : (
          <BillTable bills={bills} />
        )}
      </div>
    </Shell>
  );
}

export default Bills;

