require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
 console.error('JWT_SECRET must be configured in server/.env (32+ characters).');
 process.exit(1);
}

const { createInMemoryPool } = require('./db-fallback');
const { startMailFallback } = require('./mail-fallback');

// Auto-start mail mock if ports are available
startMailFallback(Number(process.env.SMTP_PORT || 1025), 8025);

const realPgPool = new Pool({
 connectionString: process.env.DATABASE_URL || 'postgresql://airvoice:airvoice_dev@localhost:5432/airvoice',
 connectionTimeoutMillis: 1500
});
const inMemoryPool = createInMemoryPool();
let useInMemory = false;

realPgPool.query('SELECT 1').then(() => {
 console.log('[AirVoice DB] Connected to PostgreSQL on localhost:5432');
}).catch(() => {
 useInMemory = true;
 console.log('[AirVoice DB] PostgreSQL not reachable. Using in-memory store initialized from init.sql.');
});

const pool = {
 query: async (text, params) => {
  if (useInMemory) return inMemoryPool.query(text, params);
  try {
   return await realPgPool.query(text, params);
  } catch (err) {
   if (err.code === 'ECONNREFUSED' || err.code === 'EACCES' || err.code === 'ETIMEDOUT' || err.message?.includes('ECONNREFUSED') || err.message?.includes('EACCES')) {
    useInMemory = true;
    console.log('[AirVoice DB] Switched to in-memory fallback store.');
    return inMemoryPool.query(text, params);
   }
   throw err;
  }
 },
 connect: async () => {
  if (useInMemory) return inMemoryPool.connect();
  try {
   return await realPgPool.connect();
  } catch (err) {
   if (err.code === 'ECONNREFUSED' || err.code === 'EACCES' || err.code === 'ETIMEDOUT' || err.message?.includes('ECONNREFUSED') || err.message?.includes('EACCES')) {
    useInMemory = true;
    console.log('[AirVoice DB] Switched to in-memory fallback store.');
    return inMemoryPool.connect();
   }
   throw err;
  }
 }
};

const smtp = nodemailer.createTransport({host:process.env.SMTP_HOST||'localhost',port:Number(process.env.SMTP_PORT||1025),secure:false});
const app = express();
app.use(helmet());
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173', exposedHeaders:['Content-Disposition']}));
app.use(express.json({limit:'20kb'}));
const authLimit = rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:'draft-7',legacyHeaders:false});
const wrap = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const money = n => Number(Number(n).toFixed(2));
const safeSubscriber = s => ({id:s.id,accountNumber:s.account_number,name:s.full_name,mobile:s.mobile,email:s.email,plan:s.plan_name});
function auth(req,res,next){
 const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 try {req.user=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']});return next()}catch{return res.status(401).json({message:'Your session has expired. Please sign in again.'})}
}
async function ownBill(id,userId,client=pool){
 const result=await client.query(`SELECT b.*, (b.voice_amount+b.dth_amount+b.internet_amount)::numeric AS total_amount,
 COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.bill_id=b.id),0)::numeric AS amount_paid
 FROM bills b WHERE b.id=$1 AND b.subscriber_id=$2`,[id,userId]);
 return result.rows[0];
}
function formatBill(b){
 const total=money(b.total_amount), paid=money(b.amount_paid),balance=money(total-paid);
 return {id:b.id,invoiceNumber:b.invoice_number,periodStart:b.period_start,periodEnd:b.period_end,dueDate:b.due_date,
 voice:money(b.voice_amount),dth:money(b.dth_amount),internet:money(b.internet_amount),total,paid,balance,status:balance<=0?'paid':'unpaid'};
}
app.get('/api/health',wrap(async(req,res)=>{await pool.query('SELECT 1');res.json({status:'ok',database:'connected'})}));
app.post('/api/auth/request-otp',authLimit,wrap(async(req,res)=>{
 const mobile=String(req.body.mobile||'').trim();
 if(!/^\d{10}$/.test(mobile)) return res.status(400).json({message:'Enter a valid 10-digit mobile number.'});
 const {rows}=await pool.query('SELECT * FROM subscribers WHERE mobile=$1',[mobile]);
 if(!rows.length) return res.status(404).json({notSubscribed:true,mobile,message:'This mobile number is not registered with AirVoice. Please subscribe to get started.'});
 const subscriber=rows[0];
 if(subscriber.status!=='active')return res.status(403).json({message:'This subscriber account is inactive. Please contact support.'});
 const prev=await pool.query('SELECT requested_at FROM otp_challenges WHERE subscriber_id=$1',[subscriber.id]);
 if(prev.rows[0] && Date.now()-new Date(prev.rows[0].requested_at).getTime()<30_000)return res.status(429).json({message:'Please wait 30 seconds before requesting another OTP.'});
 const otp=String(crypto.randomInt(100000,1000000));
 const hash=await bcrypt.hash(otp,10);
  try {
   await smtp.sendMail({from:process.env.MAIL_FROM||'AirVoice Demo <demo@airvoice.test>',to:subscriber.email,subject:'Your AirVoice sign-in code',text:`Your AirVoice verification code is ${otp}. It expires in 5 minutes. This is a demonstration email.`});
  } catch (smtpErr) {
   console.log(`[AirVoice SMTP Warning] ${smtpErr.message}`);
  }
  console.log(`\n>>> [AirVoice Login OTP] Code for ${mobile} (${subscriber.email}): ${otp} <<<\n`);
  await pool.query(`INSERT INTO otp_challenges(subscriber_id,otp_hash,expires_at,requested_at,attempts)
  VALUES ($1,$2,now()+interval '5 minutes',now(),0)
  ON CONFLICT(subscriber_id) DO UPDATE SET otp_hash=EXCLUDED.otp_hash,expires_at=EXCLUDED.expires_at,requested_at=EXCLUDED.requested_at,attempts=0`,[subscriber.id,hash]);
  const [local,domain]=subscriber.email.split('@');
  res.json({message:'Verification code sent to your registered demo inbox.',maskedEmail:`${local.slice(0,1)}***@${domain}`,expiresInSeconds:300,devOtp:otp});
}));
app.post('/api/auth/verify-otp',authLimit,wrap(async(req,res)=>{
 const mobile=String(req.body.mobile||'').trim(),otp=String(req.body.otp||'').trim();
 if(!/^\d{10}$/.test(mobile)||!/^\d{6}$/.test(otp))return res.status(400).json({message:'Enter a valid mobile number and six-digit OTP.'});
 const {rows}=await pool.query(`SELECT s.*,o.otp_hash,o.expires_at,o.attempts FROM subscribers s LEFT JOIN otp_challenges o ON o.subscriber_id=s.id WHERE s.mobile=$1`,[mobile]);
 const s=rows[0];
 if(!s||s.status!=='active'||!s.otp_hash)return res.status(400).json({message:'No active OTP request found. Request another code.'});
 if(s.attempts>=5||new Date(s.expires_at).getTime()<Date.now())return res.status(400).json({message:'Code expired or too many attempts. Request another OTP.'});
 const valid=await bcrypt.compare(otp,s.otp_hash);
 if(!valid){await pool.query('UPDATE otp_challenges SET attempts=attempts+1 WHERE subscriber_id=$1',[s.id]);return res.status(401).json({message:'Incorrect code. Please try again.'})}
 await pool.query('DELETE FROM otp_challenges WHERE subscriber_id=$1',[s.id]);
 const token=jwt.sign({sub:s.id},process.env.JWT_SECRET,{expiresIn:'8h',algorithm:'HS256'});
 res.json({token,subscriber:safeSubscriber(s)});
}));
app.post('/api/subscribe',wrap(async(req,res)=>{
 const mobile=String(req.body.mobile||'').trim();
 const fullName=String(req.body.fullName||'').trim();
 const email=String(req.body.email||'').trim().toLowerCase();
 const planName=String(req.body.planName||'AirVoice All-in-One Prime ₹999').trim();
 const paymentMethod=String(req.body.paymentMethod||'UPI_QR').toUpperCase();
 const amount=Number(req.body.amount||999);

 if(!/^\d{10}$/.test(mobile)) return res.status(400).json({message:'Enter a valid 10-digit mobile number.'});
 if(!fullName||fullName.length<2) return res.status(400).json({message:'Please enter your full name.'});
 if(!email||!email.includes('@')) return res.status(400).json({message:'Please enter a valid email address.'});
 if(amount<999) return res.status(400).json({message:'Minimum subscription plan is ₹999.'});

 const existing=await pool.query('SELECT * FROM subscribers WHERE mobile=$1',[mobile]);
 if(existing.rows.length){
  if(existing.rows[0].status==='active'){
   return res.status(409).json({message:'This mobile number is already registered and active. Please log in directly.'});
  }
 }

 const accountNum='AV'+(100000+Math.floor(Math.random()*900000));
 const subResult=await pool.query(
  'INSERT INTO subscribers(account_number,full_name,mobile,email,status,plan_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
  [accountNum,fullName,mobile,email,'active',planName]
 );
 const subscriber=subResult.rows[0];

 const now=new Date();
 const year=now.getFullYear();
 const month=String(now.getMonth()+1).padStart(2,'0');
 const invoiceNum=`AV-${year}-${month}-${String(subscriber.id).padStart(3,'0')}`;
 const periodStart=`${year}-${month}-01`;
 const periodEnd=`${year}-${month}-28`;
 const dueDate=`${year}-${month}-15`;

 const billResult=await pool.query(
  'INSERT INTO bills(subscriber_id,invoice_number,period_start,period_end,due_date,voice_amount,dth_amount,internet_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
  [subscriber.id,invoiceNum,periodStart,periodEnd,dueDate,299,200,500]
 );
 const bill=billResult.rows[0];

 const ref=(paymentMethod==='CARD'?'CARD-':'UPI-')+crypto.randomUUID().slice(0,10).toUpperCase();
 await pool.query(
  'INSERT INTO payments(bill_id,amount,reference,method,is_mock) VALUES ($1,$2,$3,$4,true) RETURNING *',
  [bill.id,amount,ref,paymentMethod]
 );

 const token=jwt.sign({sub:subscriber.id},process.env.JWT_SECRET,{expiresIn:'8h',algorithm:'HS256'});

 try{
  await smtp.sendMail({
   from:process.env.MAIL_FROM||'AirVoice <welcome@airvoice.test>',
   to:email,
   subject:'Welcome to AirVoice! Your subscription is active',
   text:`Welcome to AirVoice, ${fullName}!\n\nYour postpaid subscription (${planName}) is now ACTIVE.\nAccount Number: ${accountNum}\nRegistered Mobile: ${mobile}\nPayment Received: ₹${amount.toFixed(2)} (${paymentMethod})\n\nYou can now log in and manage your account anytime at http://localhost:5173.`
  });
 }catch(e){
  console.log('[AirVoice Welcome Mail Warning]',e.message);
 }

 res.status(201).json({
  message:'Subscription successful! Welcome to AirVoice.',
  token,
  subscriber:safeSubscriber(subscriber)
 });
}));
app.get('/api/me',auth,wrap(async(req,res)=>{
 const r=await pool.query("SELECT * FROM subscribers WHERE id=$1 AND status='active'",[req.user.sub]);
 if(!r.rows.length)return res.status(401).json({message:'Subscriber is not active.'});
 res.json({subscriber:safeSubscriber(r.rows[0])});
}));
app.get('/api/bills',auth,wrap(async(req,res)=>{
 const {rows}=await pool.query(`SELECT b.*,(b.voice_amount+b.dth_amount+b.internet_amount)::numeric AS total_amount,
 COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.bill_id=b.id),0)::numeric AS amount_paid
 FROM bills b WHERE b.subscriber_id=$1 ORDER BY b.period_start DESC`,[req.user.sub]);
 const bills=rows.map(formatBill);
 res.json({bills,summary:{totalBills:bills.length,paidBills:bills.filter(b=>b.status==='paid').length,outstanding:money(bills.reduce((sum,b)=>sum+b.balance,0)),totalPaid:money(bills.reduce((sum,b)=>sum+b.paid,0))}});
}));
app.get('/api/bills/:id',auth,wrap(async(req,res)=>{
 if(!/^\d+$/.test(req.params.id))return res.status(400).json({message:'Invalid bill ID.'});
 const b=await ownBill(req.params.id,req.user.sub);
 if(!b)return res.status(404).json({message:'Bill not found.'});
 const r=await pool.query('SELECT id,amount,reference,method,paid_at,is_mock FROM payments WHERE bill_id=$1 ORDER BY paid_at DESC',[b.id]);
 res.json({bill:formatBill(b),payments:r.rows});
}));
app.get('/api/payments',auth,wrap(async(req,res)=>{
 const {rows}=await pool.query(`SELECT p.id,p.amount,p.reference,p.method,p.paid_at,p.is_mock,b.invoice_number,b.id AS bill_id FROM payments p JOIN bills b ON b.id=p.bill_id WHERE b.subscriber_id=$1 ORDER BY p.paid_at DESC`,[req.user.sub]);res.json({payments:rows});
}));
app.get('/api/bills/:id/qr',auth,wrap(async(req,res)=>{
 const b=await ownBill(req.params.id,req.user.sub);
 if(!b)return res.status(404).json({message:'Bill not found.'});
 const bill=formatBill(b);
 if(bill.balance<=0)return res.status(409).json({message:'This bill is already settled.'});
 // Deliberately non-payable recipient. Simulation does not connect to a gateway.
 const upi=`upi://pay?pa=demo.airvoice.invalid@upi&pn=AirVoice%20DEMO&am=${bill.balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent('DEMO ONLY '+bill.invoiceNumber)}`;
 const qr=await QRCode.toDataURL(upi,{margin:2,width:256,color:{dark:'#14294A',light:'#FFFFFF'}});
 res.json({bill,upi,qr,demo:true});
}));
app.post('/api/bills/:id/mock-payment',auth,wrap(async(req,res)=>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  // Bill-row lock serializes concurrent settlement attempts.
  const lock=await client.query('SELECT id FROM bills WHERE id=$1 AND subscriber_id=$2 FOR UPDATE',[req.params.id,req.user.sub]);
  if(!lock.rows.length){await client.query('ROLLBACK');return res.status(404).json({message:'Bill not found.'})}
  const b=await ownBill(req.params.id,req.user.sub,client);const bill=formatBill(b);
  if(bill.balance<=0){await client.query('ROLLBACK');return res.status(409).json({message:'This bill has already been paid.'})}
  const reference='DEMO-'+crypto.randomUUID().slice(0,12).toUpperCase();
  const {rows}=await client.query('INSERT INTO payments(bill_id,amount,reference,method,is_mock) VALUES($1,$2,$3,$4,true) RETURNING *',[b.id,bill.balance,reference,'MOCK_UPI']);
  await client.query('COMMIT');res.json({message:'Demo payment recorded. No real money was transferred.',payment:rows[0]});
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}));
app.get('/api/bills/:id/download',auth,wrap(async(req,res)=>{
 const b=await ownBill(req.params.id,req.user.sub);
 if(!b)return res.status(404).json({message:'Bill not found.'});
 const data=formatBill(b),format=String(req.query.format||'pdf').toLowerCase();
 const sub=await pool.query('SELECT * FROM subscribers WHERE id=$1',[req.user.sub]);
 const lines=[['Voice',data.voice],['DTH',data.dth],['Internet',data.internet]];
 const base=`AirVoice-${data.invoiceNumber}`;
 if(format==='csv'){
  const csv=[['AirVoice Postpaid Invoice',data.invoiceNumber],['Subscriber',sub.rows[0].full_name],['Account',sub.rows[0].account_number],['Billing period',`${new Date(data.periodStart).toISOString().slice(0,10)} to ${new Date(data.periodEnd).toISOString().slice(0,10)}`],['Service','Amount (INR)'],...lines,['Total',data.total],['Amount paid',data.paid],['Outstanding',data.balance],['Status',data.status]].map(row=>row.map(s=>`"${String(s).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  res.set('Content-Type','text/csv; charset=utf-8');res.set('Content-Disposition',`attachment; filename="${base}.csv"`);return res.send('\uFEFF'+csv);
 }
 if(format==='xls'||format==='xlsx'){
  const book=new ExcelJS.Workbook();const ws=book.addWorksheet('Invoice');ws.columns=[{header:'AirVoice Postpaid Invoice',key:'label',width:30},{header:data.invoiceNumber,key:'value',width:34}];
  ws.addRows([['Subscriber',sub.rows[0].full_name],['Account',sub.rows[0].account_number],['Billing period',`${new Date(data.periodStart).toISOString().slice(0,10)} to ${new Date(data.periodEnd).toISOString().slice(0,10)}`],['Service','Amount (INR)'],...lines,['Total',data.total],['Amount paid',data.paid],['Outstanding',data.balance],['Status',data.status]]);
  ws.getRow(1).font={bold:true,color:{argb:'FF174077'}};ws.getColumn(2).numFmt='#,##0.00';
  res.set('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.set('Content-Disposition',`attachment; filename="${base}.xlsx"`);
  return res.send(Buffer.from(await book.xlsx.writeBuffer()));
 }
 if(format!=='pdf')return res.status(400).json({message:'Use pdf, xls (Excel .xlsx) or csv.'});
 res.set('Content-Type','application/pdf');res.set('Content-Disposition',`attachment; filename="${base}.pdf"`);
 const doc=new PDFDocument({size:'A4',margin:52});doc.pipe(res);
 doc.rect(0,0,595,140).fill('#14294A');doc.fillColor('#FFFFFF').fontSize(27).font('Helvetica-Bold').text('AirVoice',52,46);doc.fontSize(11).font('Helvetica').text('POSTPAID INVOICE',52,91);
 doc.fillColor('#172B4D').fontSize(16).font('Helvetica-Bold').text(data.invoiceNumber,52,170);
 doc.fontSize(10).font('Helvetica').fillColor('#66758E').text(`Subscriber: ${sub.rows[0].full_name}   |   Account: ${sub.rows[0].account_number}`,52,208);
 doc.text(`Billing period: ${new Date(data.periodStart).toISOString().slice(0,10)} - ${new Date(data.periodEnd).toISOString().slice(0,10)}`,52,227);
 doc.text(`Due date: ${new Date(data.dueDate).toISOString().slice(0,10)}   |   Status: ${data.status.toUpperCase()}`,52,246);
 let y=302;doc.fillColor('#172B4D').font('Helvetica-Bold').fontSize(11).text('SERVICE',52,y).text('CHARGES (INR)',390,y);y+=33;
 for(const [name,amount] of lines){doc.moveTo(52,y-9).lineTo(540,y-9).strokeColor('#E8EDF5').stroke();doc.font('Helvetica').fillColor('#34445D').text(name,52,y).text(amount.toFixed(2),390,y);y+=38}
 doc.moveTo(52,y).lineTo(540,y).stroke();y+=20;for(const [name,amount] of [['Total',data.total],['Amount paid',data.paid],['Outstanding',data.balance]]){doc.font('Helvetica-Bold').fillColor('#162947').text(name,52,y).text(amount.toFixed(2),390,y);y+=29}
 doc.font('Helvetica').fontSize(9).fillColor('#75839A').text('Demonstration billing statement. No real payment is collected by this portal.',52,720);doc.end();
}));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:'Something went wrong. Please try again.'})});
if (require.main === module) {
  app.listen(Number(process.env.PORT||4000),()=>console.log('AirVoice API running on port '+(process.env.PORT||4000)));
}
module.exports = app;
