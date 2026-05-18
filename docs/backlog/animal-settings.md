# Backlog: Animal Icon Settings

The header currently shows a duck emoji (🦆) as a placeholder for the family animal icon.

A future settings phase should let the family choose their icon pair from:
- Parent and baby duck
- Parent and baby panda
- Parent and baby tiger
- Parent and baby elephant

Implementation notes:
- Store the selected animal key on the family or baby document (e.g. `animalKey: 'duck'`).
- The ledger header should render the baby animal icon; a parent icon could appear in caregiver or profile views.
- Do not fetch image assets from third-party URLs — bundle SVGs or use emoji as fallback.
- The picker should live in Baby Settings or a dedicated Appearance section.
- No changes to Firestore rules needed beyond reading/writing the animalKey field on an already-gated document.
