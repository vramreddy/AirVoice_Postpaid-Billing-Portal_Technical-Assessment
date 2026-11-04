import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Receipt, BadgeCheck, Activity, ArrowRight, Check,
  FileText, Phone, Tv2, Wifi, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Shell } from '../components/Shell';
import { Loader, ErrorState, SummaryCard, IconTile } from '../components/Common';
import { BillTable, useBills } from '../components/BillTable';
import { rupee, month } from '../utils/formatters';

export function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading, refresh } = useBills();

  if (loading) {
    return (
      <Shell title="Overview" subtitle="A clear view of all your connections.">
        <Loader />
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell title="Overview">
        <ErrorState message={error} retry={refresh} />
      </Shell>
    );
  }

  const { bills, summary } = data;
  const latest = bills[0];
  const unpaidBill = bills.find(b => b.balance > 0);

  return (
    <Shell title="Overview" subtitle="Everything happening with your postpaid services.">
      {/* HERO BANNER */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-kicker">
            <span /> ACTIVE SUBSCRIBER · {user?.plan || 'AirVoice Plus'}
          </span>
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'Ram'}.</h2>
          <p>Your Voice, 5G Internet, and DTH accounts are active with full itemized billing tracking.</p>
          <div className="welcome-banner-actions">
            {unpaidBill ? (
              <Link to={'/bills/' + unpaidBill.id + '/pay'} className="button white">
                <Wallet size={16} /> Settle Balance ({rupee(unpaidBill.balance)}) <ArrowRight size={16} />
              </Link>
            ) : (
              <span className="badge-pill popular" style={{ padding: '8px 16px' }}>
                <Check size={16} /> All Invoices Settled
              </span>
            )}
            <Link to="/bills" className="button banner-ghost">
              <Receipt size={16} /> View All Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="stats-grid">
        <SummaryCard
          label="Outstanding Balance"
          value={rupee(summary.outstanding)}
          description={summary.outstanding > 0 ? 'Payment pending' : 'Zero balance due'}
          icon={Wallet}
          variant={summary.outstanding > 0 ? 'due' : 'paid'}
        />
        <SummaryCard
          label="Total Invoices"
          value={String(summary.totalBills).padStart(2, '0')}
          description="Statements generated"
          icon={Receipt}
        />
        <SummaryCard
          label="Invoices Settled"
          value={String(summary.paidBills).padStart(2, '0')}
          description="Fully paid records"
          icon={BadgeCheck}
          variant="paid"
        />
        <SummaryCard
          label="Total Paid"
          value={rupee(summary.totalPaid)}
          description="Recorded transactions"
          icon={Activity}
        />
      </div>

      {/* MAIN DASHBOARD COLUMNS */}
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Recent Billing Statements</h3>
              <p>Your itemized monthly statements and payment statuses</p>
            </div>
            <Link className="subtle-link" to="/bills">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <BillTable bills={bills.slice(0, 4)} compact />
        </section>

        <aside className="insight-column">
          <div className="panel next-bill">
            <div className="panel-header">
              <div>
                <h3>Latest Statement</h3>
                <p>{latest ? month(latest.periodStart) : 'No bill available'}</p>
              </div>
              <IconTile>
                <FileText size={20} />
              </IconTile>
            </div>
            {latest && (
              <>
                <div className="next-total">{rupee(latest.total)}</div>
                <div className="breakdown-row">
                  <span>
                    <Phone size={16} /> Voice Charges
                  </span>
                  <b>{rupee(latest.voice)}</b>
                </div>
                <div className="breakdown-row">
                  <span>
                    <Tv2 size={16} /> DTH Charges
                  </span>
                  <b>{rupee(latest.dth)}</b>
                </div>
                <div className="breakdown-row">
                  <span>
                    <Wifi size={16} /> Internet Broadband
                  </span>
                  <b>{rupee(latest.internet)}</b>
                </div>
                <Link to={'/bills/' + latest.id} className="button secondary full">
                  Review Statement <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          <div className="assistance-card">
            <span className="assistance-icon">
              <Sparkles size={24} />
            </span>
            <h3>Need an Add-on or New Line?</h3>
            <p>Upgrade to Ultra Max or add a secondary connection with our ₹999 bundle anytime.</p>
            <Link to="/subscribe" className="button primary full">
              Subscribe / Add Line <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

export default Dashboard;

