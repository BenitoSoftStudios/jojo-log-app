# Backlog: Entry Row "Now" Time Shortcut

A small "Now" button next to the time field would let caregivers set the entry time
to the current HH:mm with one tap, without opening the time picker.

Why deferred: the entry row line 1 (dot · time · mL · diaper group · detail button)
is already at ~330 px on a 375 px screen. Adding a "Now" button of ~40 px would
cause overflow or require shrinking the diaper buttons below comfortable touch targets.

When implementing:
- Use a small ghost button: no border, mint text, min-height 28px, placed immediately
  after the time input.
- Call `updateEntry(entry.id, { entryTime: currentHHmm() })` on tap.
- Show save feedback via the existing saveFlash mechanism.
- Only show when the entry time differs from now by more than 2 minutes (avoid noise
  when the entry was just created).
- Revisit row layout first: consider moving the mL unit label or compressing the
  diaper group to reclaim space.
