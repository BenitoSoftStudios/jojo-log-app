<!-- Support — optional donation page, non-pushy. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Support this app</span>
    </template>

    <AppCard class="support-card">
      <div class="app-icon" aria-hidden="true">🦆</div>
      <h2 class="support-heading">Jojo's Log is free.</h2>
      <p class="support-body text-soft text-sm">
        No ads. No paid tier. No premium features. Just a practical care ledger
        for exhausted households.
      </p>
      <p class="support-body text-soft text-sm">
        If this app has made your nights slightly less chaotic, a small donation
        helps cover Firebase hosting and keeps development going.
      </p>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Leave a tip</h2>
      <p class="text-soft text-sm" style="margin-bottom: var(--space-4);">
        Entirely optional. The app is free either way.
      </p>
      <a
        class="donate-btn"
        href="https://ko-fi.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        ☕ Buy me a coffee on Ko-fi
      </a>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Other ways to help</h2>
      <ul class="help-list text-soft text-sm">
        <li>Tell a friend who is expecting.</li>
        <li>Share feedback so the app keeps improving.</li>
        <li>Report bugs if something doesn't work.</li>
      </ul>
    </AppCard>

    <p class="footnote text-faint text-xs">
      No data is shared with donation platforms. Tapping the link opens Ko-fi in your browser.
    </p>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
</script>

<style scoped>
.back-btn {
  color: var(--color-text-soft);
  text-decoration: none;
  font-size: var(--font-size-lg);
  line-height: 1;
  flex-shrink: 0;
}

.header-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
}

.support-card {
  text-align: center;
}

.app-icon {
  font-size: 3rem;
  margin-bottom: var(--space-3);
}

.support-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.support-body {
  margin-bottom: var(--space-3);
  line-height: 1.6;
}

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.donate-btn {
  display: block;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-mint);
  color: #fff;
  text-align: center;
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.donate-btn:hover { opacity: 0.88; }

.help-list {
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  line-height: 1.5;
}

.footnote {
  text-align: center;
  padding: var(--space-2) var(--space-4);
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
