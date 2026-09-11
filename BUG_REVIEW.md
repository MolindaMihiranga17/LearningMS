# Bug review — 2026-09-11

All seven issues identified in the review have code fixes. No live database records were changed.

## Authentication fixes

- Every server-side session lookup validates the current user status, role, institute membership, and institute status. Existing cookies no longer grant access to suspended/deleted users or suspended/cancelled institutes, or retain a previous role or tenant assignment.
- Mandatory password changes are enforced by the shared server action/data guard. API session lookups reject password-restricted accounts. The password-change flow explicitly permits a restricted session and still validates account status and the current password. Sign out remains available.
- Support impersonation retains its intended access to suspended institutes only while the acting super-admin remains active and unrestricted. Cancelled institutes remain inaccessible. Impersonation cannot change the target's password or discard its audit identity through password change.

## Quiz fixes

- Submission checks the authoritative deadline using server action entry time. Requests at or after expiry grade only previously saved answers; late payloads cannot add or change answers. Requests received before expiry do not lose time to database reads.
- Autosave checks status and deadline again in its database update, so a delayed save cannot replace already-finalized answers. The browser saves after a 250 ms pause, disables answers when time expires, and explains that only answers saved before expiry count.
- New quiz attempts use a stable ObjectId derived from quiz/student IDs. MongoDB's existing unique `_id` index prevents simultaneous starts from creating multiple records. Duplicate-key recovery verifies that the matching attempt exists before treating the request as successful. Existing attempts retain their original IDs, answers, and deadlines and are reused before any create. This requires no index migration; it does not merge any historical duplicates or constrain separate administrative seed scripts.
- Regrading a short answer updates the course grade summary whenever grading is complete.
- Expired attempts finalized during a student page read update their grade summary when no manual grading remains.
- Autosave displays a failure when the server rejects the save or the request throws.

## Validation

- `npm test`: 21 regression tests pass. Tests execute actual application modules with mocked framework/database boundaries and real JWT signing/verification. Coverage includes account and tenant suspension, role/tenant changes, password restrictions, impersonation, on-time/late answers, delayed autosave, concurrent starts, legacy attempt reuse, and grade rollups.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run lint`: no errors; three pre-existing warnings in seed scripts and the database connection helper.
- Production build: passed, including TypeScript and generation of all 72 static pages.

These are repository-level checks, not an exhaustive security audit. Live browser behavior, external services, and MongoDB concurrency were not integration-tested. No seed scripts, payments, or account mutations were run.

