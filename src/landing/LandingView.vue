<!-- Public landing page — shown at / to unauthenticated visitors.
     No auth required. Links to /login (sign up) and /help. -->
<template>
  <div class="landing">

    <!-- Nav -->
    <header class="landing-nav">
      <span class="landing-logo">🦆 Jojo's Log</span>
      <router-link class="nav-link" to="/login">Sign in</router-link>
    </header>

    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">The care ledger for exhausted households.</h1>
      <p class="hero-desc">
        Track feedings, diapers, Vitamin D, and notes in a shared log
        that every caregiver can see — in real time, on any device.
      </p>
      <router-link class="cta-btn" to="/login">Get started free →</router-link>
      <p class="hero-note text-faint text-xs">No credit card. No ads. No paid tier.</p>
    </section>

    <!-- What it tracks -->
    <section class="features">
      <h2 class="section-title">Everything you need to know at a glance</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <span class="feature-icon">🍼</span>
          <h3 class="feature-name">Feedings</h3>
          <p class="feature-desc text-soft text-sm">Log time and amount in mL or fl oz. See daily, 7-day, and monthly totals instantly.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">💧</span>
          <h3 class="feature-name">Diapers</h3>
          <p class="feature-desc text-soft text-sm">Wet, poop, both, or none — tracked per entry so nobody has to ask.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">☀</span>
          <h3 class="feature-name">Vitamin D</h3>
          <p class="feature-desc text-soft text-sm">A dedicated flag for the daily vitamin drop. No dosage advice — just a reminder it happened.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">📝</span>
          <h3 class="feature-name">Notes</h3>
          <p class="feature-desc text-soft text-sm">Free-text notes on any entry. Great for the detail that doesn't fit anywhere else.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">📊</span>
          <h3 class="feature-name">Charts &amp; CSV</h3>
          <p class="feature-desc text-soft text-sm">Daily and monthly volume charts. Export to CSV for your records or the doctor.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">👥</span>
          <h3 class="feature-name">Shared</h3>
          <p class="feature-desc text-soft text-sm">Invite a partner, grandparent, or nurse with a one-time code. Real-time sync across all devices.</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="how-it-works">
      <h2 class="section-title">How it works</h2>
      <ol class="steps">
        <li class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Create a free account</strong>
            <p class="text-soft text-sm">Sign up with your email. No personal information required beyond that.</p>
          </div>
        </li>
        <li class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Set up your family and baby</strong>
            <p class="text-soft text-sm">Add a nickname and optional birthdate. No legal name required.</p>
          </div>
        </li>
        <li class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Start logging</strong>
            <p class="text-soft text-sm">Tap New Entry after each feed. The time prepopulates — just fill in the amount and diaper.</p>
          </div>
        </li>
        <li class="step">
          <span class="step-num">4</span>
          <div>
            <strong>Invite your co-caregiver</strong>
            <p class="text-soft text-sm">Generate a one-time invite code and share it. They join your shared ledger instantly.</p>
          </div>
        </li>
      </ol>
    </section>

    <!-- Privacy -->
    <section class="privacy-section">
      <h2 class="section-title">Built with privacy in mind</h2>
      <ul class="privacy-list text-soft text-sm">
        <li>No full legal name required — just a nickname.</li>
        <li>No address, health card, or medical diagnosis collected.</li>
        <li>No ads. No selling data. No analytics on care events.</li>
        <li>No medical advice. This is a ledger, not a doctor.</li>
        <li>Export your data anytime as CSV.</li>
      </ul>
    </section>

    <!-- CTA bottom -->
    <section class="cta-section">
      <router-link class="cta-btn" to="/login">Start your free family log →</router-link>
      <p class="cta-note text-faint text-xs">
        Free forever. Optional donations help cover hosting.
        <router-link to="/support">Learn more.</router-link>
      </p>
    </section>

    <!-- Footer -->
    <footer class="landing-footer text-faint text-xs">
      <span>Jojo's Log</span>
      <router-link to="/help">Help</router-link>
      <router-link to="/support">Support</router-link>
      <router-link to="/login">Sign in</router-link>
    </footer>

  </div>
</template>

<script setup>
// No logic needed — static marketing page.
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-family);
  max-width: 640px;
  margin: 0 auto;
  padding: 0 var(--space-5);
}

/* Nav */
.landing-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) 0;
}

.landing-logo {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.nav-link {
  font-size: var(--font-size-sm);
  color: var(--color-mint);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

/* Hero */
.hero {
  padding: var(--space-10) 0 var(--space-8);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.hero-title {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: var(--font-weight-semibold);
  line-height: 1.25;
  max-width: 520px;
}

.hero-desc {
  font-size: var(--font-size-base);
  color: var(--color-text-soft);
  max-width: 420px;
  line-height: 1.6;
}

.hero-note { margin-top: calc(-1 * var(--space-2)); }

/* CTA button */
.cta-btn {
  display: inline-block;
  padding: var(--space-3) var(--space-6);
  background: var(--color-mint);
  color: #fff;
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition: opacity var(--duration-fast) var(--ease-out);
}
.cta-btn:hover { opacity: 0.88; }

/* Features */
.features {
  padding: var(--space-8) 0;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-6);
  text-align: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.feature-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.feature-icon { font-size: 1.5rem; }

.feature-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.feature-desc { line-height: 1.5; }

/* How it works */
.how-it-works {
  padding: var(--space-8) 0;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.step-num {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: var(--color-mint-soft);
  color: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

/* Privacy */
.privacy-section {
  padding: var(--space-8) 0;
  background: var(--color-surface);
  margin: 0 calc(-1 * var(--space-5));
  padding-left: var(--space-5);
  padding-right: var(--space-5);
}

.privacy-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-left: var(--space-5);
  line-height: 1.5;
}

/* CTA bottom */
.cta-section {
  padding: var(--space-10) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
}

.cta-note a { color: var(--color-mint); text-decoration: none; }

/* Footer */
.landing-footer {
  border-top: 1px solid var(--color-border-soft);
  padding: var(--space-6) 0;
  display: flex;
  justify-content: center;
  gap: var(--space-5);
}

.landing-footer a {
  color: var(--color-text-faint);
  text-decoration: none;
}
.landing-footer a:hover { color: var(--color-text-soft); }
</style>
