# Backlog: Baby Management

The current ledger shows the active baby's name in the header but does not support
switching babies or adding a new baby from the UI.

A future phase must implement:
- **Add baby** — create a new baby document under the family, set it as active.
- **Switch active baby** — let the caregiver change which baby the ledger shows.
- **Show active baby nickname** — the header pill should display `activeBaby.nickname`
  (already read from Firestore; no schema change needed).
- **Family/workspace label** — keep this in Settings or a profile view, not in the main ledger header.

The active baby ID is already persisted to localStorage (`jojo_babyId`) and validated
against Firestore on load. The switcher UI should replace the current static baby label
in the ledger header.

Do not implement this in Phase 6.1B. The BabySwitcher component exists but is removed
from the main header in this phase; restore and extend it when this feature is built.
