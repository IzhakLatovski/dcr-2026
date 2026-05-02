# DCR 2.0 — State & Flow Reference

This document maps every status machine in the app and how they cascade. All state lives in `src/data/types.ts` unless otherwise noted.

## User types (roles)

| Role | Source | Default approval |
|------|--------|------------------|
| Guest | not signed in | n/a |
| Employee | default for `@develeap.com` | needs TL approval |
| TL (team_leader) | listed in `src/data/teamLeaderEmails.ts` | auto-approved |
| Admin | admin allowlist in `useAuth.ts` | auto-approved |

---

## 1. Big picture — employee lifecycle across a quarter

```mermaid
flowchart TD
    Guest([Guest]) -->|Sign in @develeap.com| AuthCheck{Role?}
    AuthCheck -->|in TEAM_LEADER_EMAILS| TLOnboard[TL Profile Setup<br/>set own level]
    AuthCheck -->|admin allowlist| Admin([Admin<br/>auto-approved])
    AuthCheck -->|default| EmpOnboard[Employee Welcome<br/>pick TL]

    TLOnboard --> TLActive([TL<br/>auto-approved])
    EmpOnboard --> Membership[(Team Membership<br/>pending)]

    Membership -->|TL approves + sets level| EmpActive([Employee<br/>approved])
    Membership -->|TL rejects| MembRej[Membership rejected]

    EmpActive --> QuarterCycle[Quarter Cycle:<br/>Plan → Completion]
    QuarterCycle -.->|level up or new quarter| QuarterCycle
```

---

## 2. Team membership approval — `ApprovalStatus`

`'pending' | 'approved' | 'rejected'`

```mermaid
stateDiagram-v2
    [*] --> pending: Employee picks TL
    pending --> approved: TL approves<br/>(sets currentLevel 1-10)
    pending --> rejected: TL rejects
    approved --> [*]: full access
```

TL and admin skip this — both auto-approved on first login.

---

## 3. Plan status — `PlanStatus`

`'draft' | 'pending' | 'approved' | 'rejected'`

The status of the quarterly plan itself (not completion). Lives on `UserPlan.planStatus`.

```mermaid
stateDiagram-v2
    [*] --> draft: Approved employee builds cart
    draft --> pending: Submit Plan
    pending --> draft: Withdraw
    pending --> approved: TL approves plan
    pending --> rejected: TL rejects
    rejected --> draft: Any edit auto-resets
    approved --> Completion: enters Q completion phase
    Completion --> draft: New quarter starts<br/>(after level up or carryover)
```

---

## 4. Q completion status — `CompletionStatus`

`'in_progress' | 'pending_review' | 'admin_pending' | 'level_up_approved' | 'level_up_rejected'`

Activates only **after** `planStatus === 'approved'`. Tracks "did the user actually do the work and do they level up?"

```mermaid
stateDiagram-v2
    [*] --> in_progress: Plan approved by TL
    in_progress --> pending_review: Employee submits<br/>"I'm done"
    pending_review --> in_progress: (employee can revert<br/>before TL acts)
    pending_review --> admin_pending: TL recommends level-up<br/>(creates levelUpRequest)
    pending_review --> level_up_rejected: TL rejects directly
    admin_pending --> level_up_approved: Admin approves
    admin_pending --> level_up_rejected: Admin rejects
    level_up_rejected --> in_progress: Employee retries
    level_up_approved --> [*]: currentLevel increments<br/>plan resets to draft
```

**Key rule:** TL alone can **never** set `level_up_approved`. The TL's "approve" button creates a `levelUpRequest` and routes to `admin_pending`. Only an admin can finalize a level-up. The TL **can** reject directly without involving admin.

---

## 5. Achievement status — `AchievementStatus`

`'historical' | 'planned' | 'submitted' | 'approved' | 'rejected'`

Per individual item record in the `achievements/` Firestore collection.

```mermaid
stateDiagram-v2
    [*] --> historical: Onboarding —<br/>"already done before DCR"
    [*] --> planned: Item added to plan
    planned --> submitted: User marks complete<br/>+ uploads proof
    submitted --> approved: TL/admin approves
    submitted --> rejected: TL/admin rejects
    rejected --> submitted: Resubmit with new proof
    historical --> approved: TL approves on initial<br/>team membership approval
    approved --> [*]
```

---

## 6. Card status — derived display state

Card statuses are **not stored** — they're computed each render from the other state machines. Logic in `src/components/CatalogPage/CatalogPage.tsx:414-453`.

### Top-left badges (mutually exclusive — user/plan state)

```mermaid
flowchart LR
    Item[Catalog Item] --> Check1{Has approved<br/>achievement?}
    Check1 -->|yes| Achieved[🟢 Achieved]
    Check1 -->|no| Check2{In current plan?<br/>planStatus?}
    Check2 -->|planStatus = pending| TLBadge[🟡 TL Approval]
    Check2 -->|planStatus = approved| ThisQ[🔵 This Q]
    Check2 -->|in cart, no planStatus<br/>i.e. draft| InPlan[⚪ In plan]
    Check2 -->|not in cart| Regular[Regular<br/>no badge]
```

### Top-right badges (intrinsic item attributes — only when not achieved)

| Badge | Condition |
|-------|-----------|
| 🔴 Required | `item.required === true` |
| 🔷 Promoted | `item.promoted === true` && `!item.required` |

**Note:** `planStatus = rejected` does not get its own card badge — it falls through to "In plan" (because the check is `!planStatus && inCart`), and editing a rejected plan auto-resets it to `draft` anyway.

---

## 7. How it all stacks — one employee, one quarter

```mermaid
flowchart TD
    A[Membership: approved] --> B[Plan: draft]
    B -->|submit| C[Plan: pending]
    C -->|TL approves| D[Plan: approved<br/>+ Completion: in_progress]
    D -->|mark items done| E[Completion: pending_review]
    E -->|TL recommends| F[Completion: admin_pending]
    F -->|admin approves| G[Completion: level_up_approved<br/>currentLevel++<br/>Plan resets to draft]
    G --> B

    C -->|TL rejects| H[Plan: rejected]
    H -->|edit| B
    E -->|TL rejects| I[Completion: level_up_rejected]
    F -->|admin rejects| I
    I -->|retry| D
```

Three sequential gates: **membership → plan → completion**. Each has its own state machine; progression to the next requires the previous one to be in its `approved` terminal.

---

## Quick reference — type definitions

| Type | Values | File |
|------|--------|------|
| `UserRole` | `employee \| team_leader \| admin` | `types.ts:61` |
| `ApprovalStatus` | `pending \| approved \| rejected` | `types.ts:63` |
| `PlanStatus` | `draft \| pending \| approved \| rejected` | `types.ts:67` |
| `CompletionStatus` | `in_progress \| pending_review \| admin_pending \| level_up_approved \| level_up_rejected` | `types.ts:69` |
| `AchievementStatus` | `historical \| planned \| submitted \| approved \| rejected` | `types.ts:269` |
| `AchievementType` | `historical \| quarterly` | `types.ts:271` |
| `PendingApprovalType` | `initial \| quarterly` | `types.ts:65` |
