CREATE TABLE subscribers (
 id SERIAL PRIMARY KEY,
 account_number TEXT NOT NULL UNIQUE,
 full_name TEXT NOT NULL,
 mobile TEXT NOT NULL UNIQUE CHECK(mobile ~ '^[0-9]{10}$'),
 email TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 plan_name TEXT NOT NULL DEFAULT 'AirVoice Postpaid'
);
CREATE TABLE bills (
 id SERIAL PRIMARY KEY,
 subscriber_id INT NOT NULL REFERENCES subscribers(id),
 invoice_number TEXT NOT NULL UNIQUE,
 period_start DATE NOT NULL,
 period_end DATE NOT NULL,
 due_date DATE NOT NULL,
 voice_amount NUMERIC(12,2) NOT NULL CHECK(voice_amount >= 0),
 dth_amount NUMERIC(12,2) NOT NULL CHECK(dth_amount >= 0),
 internet_amount NUMERIC(12,2) NOT NULL CHECK(internet_amount >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(subscriber_id, period_start)
);
CREATE TABLE payments (
 id SERIAL PRIMARY KEY,
 bill_id INT NOT NULL REFERENCES bills(id),
 amount NUMERIC(12,2) NOT NULL CHECK(amount > 0),
 reference TEXT NOT NULL UNIQUE,
 method TEXT NOT NULL DEFAULT 'MOCK_UPI',
 paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 is_mock BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE otp_challenges (
 subscriber_id INT PRIMARY KEY REFERENCES subscribers(id) ON DELETE CASCADE,
 otp_hash TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 attempts INT NOT NULL DEFAULT 0 CHECK(attempts >= 0),
 requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bills_subscriber ON bills(subscriber_id,period_start DESC);
CREATE INDEX idx_payments_bill ON payments(bill_id);
INSERT INTO subscribers(account_number,full_name,mobile,email,status,plan_name) VALUES
 ('AV100241','Ram','9876543210','ram@example.test','active','AirVoice Plus'),
 ('AV100242','Priya Sharma','9123456780','priya@example.test','active','AirVoice Family'),
 ('AV100243','Inactive Sample','9000000000','inactive@example.test','inactive','AirVoice Basic');
INSERT INTO bills(subscriber_id,invoice_number,period_start,period_end,due_date,voice_amount,dth_amount,internet_amount) VALUES
 (1,'AV-2026-10-001','2026-10-01','2026-10-31','2026-11-15',299,350,799),
 (1,'AV-2026-09-001','2026-09-01','2026-09-30','2026-10-15',249,350,799),
 (1,'AV-2026-08-001','2026-08-01','2026-08-31','2026-09-15',299,300,699),
 (1,'AV-2026-07-001','2026-07-01','2026-07-31','2026-08-15',249,300,699),
 (1,'AV-2026-06-001','2026-06-01','2026-06-30','2026-07-15',249,300,699),
 (2,'AV-2026-10-002','2026-10-01','2026-10-31','2026-11-15',399,450,999),
 (2,'AV-2026-09-002','2026-09-01','2026-09-30','2026-10-15',399,450,999);
INSERT INTO payments(bill_id,amount,reference,paid_at) VALUES
 (2,1398,'MOCK-20261012-A1','2026-10-12T10:10:00+05:30'),
 (3,1298,'MOCK-20260909-A1','2026-09-09T12:30:00+05:30'),
 (4,1248,'MOCK-20260811-A1','2026-08-11T14:20:00+05:30'),
 (5,1248,'MOCK-20260713-A1','2026-07-13T11:00:00+05:30'),
 (7,1848,'MOCK-20261010-P1','2026-10-10T10:00:00+05:30');
