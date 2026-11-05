import React from 'react';
import { Link } from 'react-router-dom';
import {
  User, Sparkles, ArrowRight, ArrowUpRight, ShieldCheck, Check,
  Phone, Wifi, Tv2, FileText, Receipt, Download
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { Status, IconTile } from '../components/Common';

export function Landing() {
  return (
    <div className="landing">
      <header className="public-header container">
        <Brand />
        <nav>
          <a href="#features">Features</a>
          <a href="#plans">Plans</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="public-header-ctas">
          <Link className="button signin-btn" to="/login">
            <User size={16} strokeWidth={2.5} /> Sign in
          </Link>
          <Link className="button primary" to="/subscribe">
            Subscribe <Sparkles size={16} />
          </Link>
        </div>
      </header>

      <main>
        <div className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="blue-dot" /> NEXT-GEN TELECOM BILLING
            </span>
            <h1>
              One place for <span>every connection.</span>
            </h1>
            <p>
              Experience seamless Voice, High Speed Internet, and DTH management. Review itemized statements, track instant payments, and enjoy transparent billing without surprises.
            </p>
            <div className="hero-buttons">
              <Link to="/subscribe" className="button primary large subscribe-btn">
                Subscribe for ₹999/mo <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="button secondary large">
                Subscriber Login <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={18} /> Instant SIM Activation <span /> Clear Statements <span /> Zero Paperwork
            </div>
          </div>

          <div className="hero-art">
            <div className="art-glow" />
            <div className="float-mini mini-one">
              <span className="mini-circle green">
                <Check size={18} />
              </span>
              <div>
                <b>October Bill Settled</b>
                <small>Payment verified · ₹1,448</small>
              </div>
            </div>

            <div className="sample-panel">
              <div className="sample-top">
                <Brand />
                <span className="soft-label">MY ACCOUNT</span>
              </div>
              <small className="muted">Total Outstanding</small>
              <div className="sample-amount">
                ₹0<span>.00</span>
              </div>
              <div className="sample-row">
                <span>All connections active</span>
                <Status paid={true} />
              </div>
              <div className="service-tiles">
                <div>
                  <Phone size={18} />
                  <small>Voice</small>
                  <b>Unlimited</b>
                </div>
                <div>
                  <Wifi size={18} />
                  <small>5G Data</small>
                  <b>150 GB</b>
                </div>
                <div>
                  <Tv2 size={18} />
                  <small>DTH HD</small>
                  <b>250+ Ch</b>
                </div>
              </div>
              <Link to="/subscribe" className="sample-action" style={{ textDecoration: 'none' }}>
                Join AirVoice Prime <ArrowRight size={16} />
              </Link>
            </div>

            <div className="float-mini mini-two">
              <span className="mini-circle blue">
                <FileText size={18} />
              </span>
              <div>
                <b>Instant Invoices</b>
                <small>PDF Document (.pdf)</small>
              </div>
            </div>
          </div>
        </div>

        {/* PLANS SECTION */}
        <section id="plans" className="feature-section container" style={{ paddingTop: 0 }}>
          <div className="section-heading">
            <span className="eyebrow">CHOOSE YOUR PLAN</span>
            <h2>Simple, honest pricing with zero hidden fees.</h2>
          </div>
          <div className="sub-plans-grid">
            <div className="plan-card selected" style={{ cursor: 'default' }}>
              <span className="plan-badge">MOST POPULAR • BEST VALUE</span>
              <div className="plan-header">
                <div>
                  <div className="plan-name">AirVoice Prime All-in-One</div>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
                    Postpaid Triple-Play Bundle
                  </div>
                </div>
                <div className="plan-price">
                  ₹999<span>/mo</span>
                </div>
              </div>
              <p className="plan-desc">
                The complete digital home pack with unlimited calls, high-speed 5G broadband, and HD television entertainment.
              </p>
              <div className="plan-features">
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>Unlimited Pan-India Calls</b> (Any network, HD Voice)
                </div>
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>150 GB High-Speed 5G/4G Data</b> with roll-over
                </div>
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>DTH 250+ HD Channels</b> with smart recording
                </div>
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>Disney+ Hotstar & SonyLIV</b> OTT pack included
                </div>
              </div>
              <Link to="/subscribe?plan=prime" className="button primary full" style={{ marginTop: 24 }}>
                Subscribe Now for ₹999 <ArrowRight size={16} />
              </Link>
            </div>

            <div className="plan-card" style={{ cursor: 'default' }}>
              <div className="plan-header">
                <div>
                  <div className="plan-name">AirVoice Ultra Max</div>
                  <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, marginTop: 4 }}>
                    Ultra-High Bandwidth
                  </div>
                </div>
                <div className="plan-price">
                  ₹1,499<span>/mo</span>
                </div>
              </div>
              <p className="plan-desc">
                For power users, gamers and modern connected families needing unlimited data speeds and 4K entertainment.
              </p>
              <div className="plan-features">
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>Unlimited 5G Data</b> with zero speed throttling
                </div>
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>Unlimited Voice</b> + 100 free SMS/day
                </div>
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>DTH 350+ 4K Channels</b> + Netflix & Amazon Prime
                </div>
                <div className="plan-feature-item">
                  <Check size={18} />
                  <b>VIP Priority Customer Care</b> 24/7 dedicated line
                </div>
              </div>
              <Link to="/subscribe?plan=ultra" className="button secondary full" style={{ marginTop: 24 }}>
                Subscribe for ₹1,499 <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="feature-section container">
          <div className="section-heading">
            <span className="eyebrow">DESIGNED FOR YOU</span>
            <h2>Everything you need. Nothing you don't.</h2>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <IconTile>
                <Receipt size={22} />
              </IconTile>
              <h3>Every bill in one view</h3>
              <p>Track your Voice, Internet, and DTH statements with full itemized transparency.</p>
            </div>
            <div className="feature-card">
              <IconTile type="green">
                <Download size={22} />
              </IconTile>
              <h3>Statements on demand</h3>
              <p>Download billing records instantly as official PDF statements whenever you need.</p>
            </div>
            <div className="feature-card">
              <IconTile type="orange">
                <ShieldCheck size={22} />
              </IconTile>
              <h3>Secure OTP sign-in</h3>
              <p>Passwordless security with 6-digit one-time verification delivered straight to your inbox.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bottom-cta container" id="how-it-works">
          <div>
            <span className="eyebrow">READY TO GET STARTED?</span>
            <h2>Join thousands of satisfied postpaid subscribers today.</h2>
            <p>Subscribe in under 60 seconds with our ₹999 All-in-One plan.</p>
          </div>
          <Link to="/subscribe" className="button white large">
            Start My Subscription <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="public-footer container">
        <Brand />
        <span>© 2026 AirVoice Telecom. All rights reserved. Self-service demonstration portal.</span>
      </footer>
    </div>
  );
}

export default Landing;

