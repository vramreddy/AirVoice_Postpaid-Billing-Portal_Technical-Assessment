

// In-memory PostgreSQL compatible fallback for development/demo when Postgres is not running.

function createInMemoryPool() {
  const subscribers = [
    { id: 1, account_number: 'AV100241', full_name: 'Ram', mobile: '9876543210', email: 'ram@example.test', status: 'active', plan_name: 'AirVoice Plus' },
    { id: 2, account_number: 'AV100242', full_name: 'Priya Sharma', mobile: '9123456780', email: 'priya@example.test', status: 'active', plan_name: 'AirVoice Family' },
    { id: 3, account_number: 'AV100243', full_name: 'Inactive Sample', mobile: '9000000000', email: 'inactive@example.test', status: 'inactive', plan_name: 'AirVoice Basic' }
  ];

  let nextBillId = 8;
  const bills = [
    { id: 1, subscriber_id: 1, invoice_number: 'AV-2026-10-001', period_start: '2026-10-01', period_end: '2026-10-31', due_date: '2026-11-15', voice_amount: 299, dth_amount: 350, internet_amount: 799 },
    { id: 2, subscriber_id: 1, invoice_number: 'AV-2026-09-001', period_start: '2026-09-01', period_end: '2026-09-30', due_date: '2026-10-15', voice_amount: 249, dth_amount: 350, internet_amount: 799 },
    { id: 3, subscriber_id: 1, invoice_number: 'AV-2026-08-001', period_start: '2026-08-01', period_end: '2026-08-31', due_date: '2026-09-15', voice_amount: 299, dth_amount: 300, internet_amount: 699 },
    { id: 4, subscriber_id: 1, invoice_number: 'AV-2026-07-001', period_start: '2026-07-01', period_end: '2026-07-31', due_date: '2026-08-15', voice_amount: 249, dth_amount: 300, internet_amount: 699 },
    { id: 5, subscriber_id: 1, invoice_number: 'AV-2026-06-001', period_start: '2026-06-01', period_end: '2026-06-30', due_date: '2026-07-15', voice_amount: 249, dth_amount: 300, internet_amount: 699 },
    { id: 6, subscriber_id: 2, invoice_number: 'AV-2026-10-002', period_start: '2026-10-01', period_end: '2026-10-31', due_date: '2026-11-15', voice_amount: 399, dth_amount: 450, internet_amount: 999 },
    { id: 7, subscriber_id: 2, invoice_number: 'AV-2026-09-002', period_start: '2026-09-01', period_end: '2026-09-30', due_date: '2026-10-15', voice_amount: 399, dth_amount: 450, internet_amount: 999 }
  ];

  let nextPaymentId = 6;
  const payments = [
    { id: 1, bill_id: 2, amount: 1398, reference: 'MOCK-20261012-A1', method: 'MOCK_UPI', paid_at: '2026-10-12T10:10:00+05:30', is_mock: true },
    { id: 2, bill_id: 3, amount: 1298, reference: 'MOCK-20260909-A1', method: 'MOCK_UPI', paid_at: '2026-09-09T12:30:00+05:30', is_mock: true },
    { id: 3, bill_id: 4, amount: 1248, reference: 'MOCK-20260811-A1', method: 'MOCK_UPI', paid_at: '2026-08-11T14:20:00+05:30', is_mock: true },
    { id: 4, bill_id: 5, amount: 1248, reference: 'MOCK-20260713-A1', method: 'MOCK_UPI', paid_at: '2026-07-13T11:00:00+05:30', is_mock: true },
    { id: 5, bill_id: 7, amount: 1848, reference: 'MOCK-20261010-P1', method: 'MOCK_UPI', paid_at: '2026-10-10T10:00:00+05:30', is_mock: true }
  ];

  const otpChallenges = new Map(); // subscriber_id -> { otp_hash, expires_at, requested_at, attempts }

  function getBillWithTotals(b) {
    const total_amount = Number((b.voice_amount + b.dth_amount + b.internet_amount).toFixed(2));
    const paidSum = payments
      .filter(p => p.bill_id === b.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const amount_paid = Number(paidSum.toFixed(2));
    return { ...b, total_amount, amount_paid };
  }

  async function query(text, params = []) {
    const q = text.trim();

    // Health check
    if (q === 'SELECT 1') {
      return { rows: [{ '?column?': 1 }] };
    }

    // SELECT * FROM subscribers WHERE mobile=$1
    if (q.includes('FROM subscribers WHERE mobile=$1')) {
      const match = subscribers.filter(s => s.mobile === String(params[0]));
      return { rows: match.map(s => ({ ...s })) };
    }

    // SELECT requested_at FROM otp_challenges WHERE subscriber_id=$1
    if (q.includes('FROM otp_challenges WHERE subscriber_id=$1')) {
      const ch = otpChallenges.get(Number(params[0]));
      return { rows: ch ? [{ requested_at: ch.requested_at }] : [] };
    }

    // INSERT INTO otp_challenges ... ON CONFLICT
    if (q.includes('INSERT INTO otp_challenges')) {
      const subId = Number(params[0]);
      const hash = String(params[1]);
      otpChallenges.set(subId, {
        subscriber_id: subId,
        otp_hash: hash,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        requested_at: new Date(),
        attempts: 0
      });
      return { rows: [] };
    }

    // SELECT s.*,o.otp_hash,o.expires_at,o.attempts FROM subscribers s LEFT JOIN otp_challenges o ON o.subscriber_id=s.id WHERE s.mobile=$1
    if (q.includes('FROM subscribers s LEFT JOIN otp_challenges o')) {
      const s = subscribers.find(sub => sub.mobile === String(params[0]));
      if (!s) return { rows: [] };
      const ch = otpChallenges.get(s.id);
      return {
        rows: [{
          ...s,
          otp_hash: ch?.otp_hash || null,
          expires_at: ch?.expires_at || null,
          attempts: ch?.attempts ?? null
        }]
      };
    }

    // UPDATE otp_challenges SET attempts=attempts+1 WHERE subscriber_id=$1
    if (q.includes('UPDATE otp_challenges SET attempts=attempts+1')) {
      const subId = Number(params[0]);
      const ch = otpChallenges.get(subId);
      if (ch) ch.attempts += 1;
      return { rows: [] };
    }

    // DELETE FROM otp_challenges WHERE subscriber_id=$1
    if (q.includes('DELETE FROM otp_challenges WHERE subscriber_id=$1')) {
      otpChallenges.delete(Number(params[0]));
      return { rows: [] };
    }

    // SELECT * FROM subscribers WHERE id=$1 AND status='active'
    if (q.includes("FROM subscribers WHERE id=$1 AND status='active'")) {
      const s = subscribers.find(sub => sub.id === Number(params[0]) && sub.status === 'active');
      return { rows: s ? [{ ...s }] : [] };
    }

    // SELECT * FROM subscribers WHERE id=$1
    if (q.includes('FROM subscribers WHERE id=$1')) {
      const s = subscribers.find(sub => sub.id === Number(params[0]));
      return { rows: s ? [{ ...s }] : [] };
    }

    // Own single bill: SELECT b.*, ... FROM bills b WHERE b.id=$1 AND b.subscriber_id=$2
    if (q.includes('FROM bills b WHERE b.id=$1 AND b.subscriber_id=$2')) {
      const billId = Number(params[0]);
      const subId = Number(params[1]);
      const b = bills.find(item => item.id === billId && item.subscriber_id === subId);
      return { rows: b ? [getBillWithTotals(b)] : [] };
    }

    // All bills for subscriber: SELECT b.*, ... FROM bills b WHERE b.subscriber_id=$1 ORDER BY b.period_start DESC
    if (q.includes('FROM bills b WHERE b.subscriber_id=$1 ORDER BY b.period_start DESC')) {
      const subId = Number(params[0]);
      const userBills = bills
        .filter(b => b.subscriber_id === subId)
        .map(getBillWithTotals)
        .sort((a, b) => new Date(b.period_start) - new Date(a.period_start));
      return { rows: userBills };
    }

    // SELECT id,amount,reference,method,paid_at,is_mock FROM payments WHERE bill_id=$1 ORDER BY paid_at DESC
    if (q.includes('FROM payments WHERE bill_id=$1 ORDER BY paid_at DESC')) {
      const billId = Number(params[0]);
      const billPayments = payments
        .filter(p => p.bill_id === billId)
        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
      return { rows: billPayments.map(p => ({ ...p })) };
    }

    // SELECT p.id,p.amount, ... FROM payments p JOIN bills b ON b.id=p.bill_id WHERE b.subscriber_id=$1 ORDER BY p.paid_at DESC
    if (q.includes('FROM payments p JOIN bills b ON b.id=p.bill_id WHERE b.subscriber_id=$1')) {
      const subId = Number(params[0]);
      const subBillIds = new Set(bills.filter(b => b.subscriber_id === subId).map(b => b.id));
      const res = payments
        .filter(p => subBillIds.has(p.bill_id))
        .map(p => {
          const b = bills.find(bill => bill.id === p.bill_id);
          return { ...p, invoice_number: b?.invoice_number, bill_id: p.bill_id };
        })
        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
      return { rows: res };
    }

    // SELECT id FROM bills WHERE id=$1 AND subscriber_id=$2 FOR UPDATE
    if (q.includes('SELECT id FROM bills WHERE id=$1 AND subscriber_id=$2')) {
      const billId = Number(params[0]);
      const subId = Number(params[1]);
      const b = bills.find(item => item.id === billId && item.subscriber_id === subId);
      return { rows: b ? [{ id: b.id }] : [] };
    }

    // INSERT INTO subscribers
    if (q.includes('INSERT INTO subscribers')) {
      const newSub = {
        id: subscribers.length + 1,
        account_number: String(params[0]),
        full_name: String(params[1]),
        mobile: String(params[2]),
        email: String(params[3]),
        status: String(params[4] || 'active'),
        plan_name: String(params[5] || 'AirVoice All-in-One Prime ₹999')
      };
      subscribers.push(newSub);
      return { rows: [newSub] };
    }

    // INSERT INTO bills ... RETURNING *
    if (q.includes('INSERT INTO bills')) {
      const newBill = {
        id: nextBillId++,
        subscriber_id: Number(params[0]),
        invoice_number: String(params[1]),
        period_start: String(params[2]),
        period_end: String(params[3]),
        due_date: String(params[4]),
        voice_amount: Number(params[5]),
        dth_amount: Number(params[6]),
        internet_amount: Number(params[7])
      };
      bills.push(newBill);
      return { rows: [getBillWithTotals(newBill)] };
    }

    // INSERT INTO payments(bill_id,amount,reference,method,is_mock) VALUES($1,$2,$3,$4,true) RETURNING *
    if (q.includes('INSERT INTO payments')) {
      const newPayment = {
        id: nextPaymentId++,
        bill_id: Number(params[0]),
        amount: Number(params[1]),
        reference: String(params[2]),
        method: String(params[3] || 'MOCK_UPI'),
        paid_at: new Date().toISOString(),
        is_mock: true
      };
      payments.unshift(newPayment);
      return { rows: [newPayment] };
    }

    // Transactions
    if (q === 'BEGIN' || q === 'COMMIT' || q === 'ROLLBACK') {
      return { rows: [] };
    }

    console.warn('[DB Fallback] Unhandled query:', q, params);
    return { rows: [] };
  }

  return {
    query,
    connect: async () => ({
      query,
      release: () => { }
    })
  };
}

module.exports = { createInMemoryPool };
