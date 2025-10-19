# Subscription Management Portal - Implementation Plan

**Version:** 1.0
**Date:** 2025-10-19
**Status:** Planning Phase

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Goals and Objectives](#goals-and-objectives)
4. [Proposed Features](#proposed-features)
5. [Technical Architecture](#technical-architecture)
6. [Implementation Phases](#implementation-phases)
7. [Database Schema Updates](#database-schema-updates)
8. [API Endpoints](#api-endpoints)
9. [UI/UX Design](#uiux-design)
10. [Security and Authorization](#security-and-authorization)
11. [Testing Strategy](#testing-strategy)
12. [Rollout Plan](#rollout-plan)
13. [Success Metrics](#success-metrics)

---

## Executive Summary

This document outlines the implementation plan for a comprehensive subscription management portal within the web application. The portal will enable administrators to view, manage, and analyze user subscriptions, subscription tiers, and related billing events.

### Key Deliverables

- Admin dashboard for subscription analytics
- User subscription management interface
- Subscription tier configuration panel
- Event audit log viewer
- Comprehensive reporting and export capabilities

### Timeline

- **Phase 1 (Core Features):** 2-3 weeks
- **Phase 2 (Analytics & Reporting):** 1-2 weeks
- **Phase 3 (Advanced Features):** 1-2 weeks
- **Total Estimated Duration:** 4-7 weeks

---

## Current State Assessment

### Existing Infrastructure ✅

#### Database Schema

- ✅ `subscription_tiers` table with Free and Premium tiers
- ✅ `user_subscriptions` table tracking user subscription status
- ✅ `subscription_events` table for audit logging
- ✅ Row Level Security (RLS) policies enforcing admin access
- ✅ Auto-trigger for free tier assignment to new users
- ✅ Stripe integration fields (customer_id, subscription_id)

#### Backend Services

- ✅ Subscription service with methods for tier and subscription retrieval
- ✅ `getAllSubscriptions()` and `getSubscriptionStats()` methods ready for admin use
- ✅ Stripe Edge Functions for checkout and billing portal
- ✅ TypeScript types for all subscription entities
- ✅ Zod validation schemas for subscription operations

#### Mobile Implementation (Reference)

- ✅ `useSubscription()` hook demonstrating data fetching patterns
- ✅ Subscription screen with tier display and checkout
- ✅ Subscription banner promoting premium features

### Current Gaps ❌

#### Web Portal

- ❌ No subscription management pages in web admin
- ❌ No admin-only route protection for subscription features
- ❌ No subscription analytics dashboard
- ❌ No tier management UI
- ❌ No event audit log viewer
- ❌ No bulk operations or manual subscription management
- ❌ No export/reporting capabilities

#### Backend Enhancements Needed

- ❌ Admin override functions for manual subscription updates
- ❌ Bulk operation endpoints
- ❌ Advanced filtering and search capabilities
- ❌ Export data formatting utilities
- ❌ Subscription migration/transfer functions

---

## Goals and Objectives

### Primary Goals

1. **Visibility:** Provide comprehensive view of all user subscriptions
2. **Control:** Enable admins to manage subscriptions and tiers
3. **Insights:** Deliver actionable analytics on subscription metrics
4. **Compliance:** Maintain detailed audit trails of all subscription changes
5. **Efficiency:** Streamline subscription support workflows

### Business Objectives

- Reduce support response time for subscription issues by 50%
- Enable data-driven decisions on tier pricing and features
- Improve subscription retention through proactive monitoring
- Ensure compliance with billing and subscription regulations

### Technical Objectives

- Reuse existing subscription service architecture
- Maintain consistent UI/UX with current admin pages
- Implement proper role-based access control
- Ensure scalability for growing subscription base
- Follow existing code patterns and standards

---

## Proposed Features

### Feature 1: Subscription Management Dashboard

**Purpose:** Central hub for subscription analytics and quick actions

**Components:**

- Overview cards showing key metrics:
  - Total Subscriptions
  - Active Premium Subscriptions
  - Monthly Recurring Revenue (MRR)
  - Churn Rate (last 30 days)
  - New Subscriptions (this month)
  - Cancelled Subscriptions (this month)
- Revenue trend chart (last 6 months)
- Recent subscription events timeline
- Quick filters: Status, Tier, Date Range
- Export dashboard report button

**Data Source:** `getSubscriptionStats()` + custom aggregations

**Priority:** HIGH

---

### Feature 2: User Subscriptions List View

**Purpose:** Browse and search all user subscriptions

**Components:**

- Paginated table with columns:
  - User (name, email, avatar)
  - Current Tier (badge with color coding)
  - Status (active, cancelled, past_due, etc.)
  - Subscription Start Date
  - Current Period End
  - Stripe Customer ID (clickable link)
  - Actions (View Details, Manage, Cancel)
- Search functionality:
  - By user name
  - By email
  - By Stripe customer ID
  - By Stripe subscription ID
- Filters:
  - Status (multi-select)
  - Tier (multi-select)
  - Date range (created_at, period_end)
  - Cancel at period end (yes/no)
- Sorting by all columns
- Bulk actions:
  - Export selected (CSV/JSON)
  - Send notification
- Real-time updates for status changes

**Data Source:** `getAllSubscriptions()` with enhanced filtering

**Priority:** HIGH

---

### Feature 3: User Subscription Detail View

**Purpose:** Deep dive into individual subscription details

**Components:**

- **User Information Section:**
  - Full name, email, phone
  - User avatar
  - Account creation date
  - Link to user profile
- **Subscription Details Section:**
  - Current tier with feature list
  - Status badge with color coding
  - Subscription start date
  - Current period: start and end dates
  - Next billing date (if applicable)
  - Cancellation details (if cancelled)
  - Auto-renewal status
- **Billing Information Section:**
  - Stripe customer ID (link to Stripe dashboard)
  - Stripe subscription ID (link to Stripe dashboard)
  - Payment method (last 4 digits if available via Stripe API)
  - Link to Stripe billing portal
- **Subscription History Timeline:**
  - All events from `subscription_events` table
  - Event type badges
  - Timestamps
  - Event metadata (expandable JSON view)
  - Payment success/failure indicators
- **Admin Actions:**
  - Cancel Subscription (with confirmation)
  - Extend Subscription (manual period adjustment)
  - Change Tier (with options to prorate or not)
  - Add Admin Note (metadata field)
  - Refund (link to Stripe)

**Data Source:** `getUserSubscription()` + `getUserSubscriptionEvents()`

**Priority:** HIGH

---

### Feature 4: Subscription Tier Management

**Purpose:** Configure subscription tiers and pricing

**Components:**

- **Tiers List Table:**
  - Tier name and display name
  - Price (monthly)
  - Features list (from JSONB)
  - Active status toggle
  - Number of active users on tier
  - Actions (Edit, Duplicate, Archive)
- **Add/Edit Tier Form:**
  - Basic Info:
    - Name (slug, unique)
    - Display Name
    - Description (markdown support)
  - Pricing:
    - Monthly price (USD)
    - Stripe Price ID
  - Features (dynamic key-value editor):
    - `exclusive_rooms` (boolean)
    - `max_concurrent_bookings` (number)
    - Custom features (text/number/boolean)
  - Status: Active/Inactive toggle
  - Save/Cancel buttons
- **Validation:**
  - Prevent tier deletion if users are subscribed
  - Confirm price changes
  - Warn when deactivating tier with active users

**Data Source:** `getTiers()` + new CRUD service methods

**Priority:** MEDIUM

---

### Feature 5: Event Audit Log Viewer

**Purpose:** Track all subscription-related events for compliance

**Components:**

- **Events Table:**
  - Timestamp
  - User (name, email)
  - Event Type (badge)
  - Subscription ID
  - Stripe Event ID (if applicable)
  - Metadata (expandable)
- **Filters:**
  - Date range picker
  - Event type (multi-select dropdown)
  - User search
  - Subscription ID search
- **Export Options:**
  - CSV export with selected filters
  - JSON export for full metadata
  - Date range selection for export
- **Event Detail Modal:**
  - Full event metadata (formatted JSON)
  - Related user and subscription info
  - Link to Stripe event (if applicable)

**Data Source:** Enhanced version of `getUserSubscriptionEvents()` for all users

**Priority:** MEDIUM

---

### Feature 6: Reports and Analytics

**Purpose:** Generate insights for business decision-making

**Components:**

- **Subscription Reports:**
  - Monthly Revenue Report
  - Churn Analysis Report
  - Tier Distribution Report
  - Cohort Analysis (subscriptions by signup month)
  - Failed Payments Report
- **Report Parameters:**
  - Date range selector
  - Tier filter
  - Group by: Day/Week/Month
  - Export format: CSV/PDF
- **Visualizations:**
  - Line charts for revenue trends
  - Pie chart for tier distribution
  - Bar chart for monthly signups/cancellations
  - Funnel chart for conversion (free → premium)
- **Scheduled Reports:**
  - Email weekly/monthly reports to admins
  - Configurable recipients
  - Report templates

**Data Source:** Custom aggregation queries + `getSubscriptionStats()`

**Priority:** LOW (Phase 3)

---

## Technical Architecture

### Technology Stack

- **Frontend Framework:** Next.js 14 (App Router)
- **UI Library:** React with TypeScript
- **Styling:** Tailwind CSS (existing pattern)
- **State Management:** TanStack Query (React Query)
- **Data Fetching:** Supabase client
- **Validation:** Zod schemas
- **Charts:** Recharts or Chart.js
- **Date Handling:** date-fns
- **Export:** papaparse (CSV), jsPDF (PDF)

### Directory Structure

```
apps/web/
├── app/
│   └── dashboard/
│       └── subscriptions/                  # NEW
│           ├── page.tsx                    # Subscription dashboard
│           ├── users/
│           │   ├── page.tsx                # User subscriptions list
│           │   └── [id]/
│           │       └── page.tsx            # User subscription detail
│           ├── tiers/
│           │   ├── page.tsx                # Tiers list
│           │   ├── new/
│           │   │   └── page.tsx            # Create tier
│           │   └── [id]/
│           │       └── edit/
│           │           └── page.tsx        # Edit tier
│           ├── events/
│           │   └── page.tsx                # Events audit log
│           └── reports/
│               └── page.tsx                # Reports and analytics
├── components/
│   ├── subscriptions/                      # NEW
│   │   ├── SubscriptionStatsCards.tsx     # Dashboard cards
│   │   ├── SubscriptionTable.tsx          # User subscriptions table
│   │   ├── SubscriptionDetailCard.tsx     # Subscription detail view
│   │   ├── SubscriptionTimeline.tsx       # Event timeline
│   │   ├── TierForm.tsx                   # Tier create/edit form
│   │   ├── TierCard.tsx                   # Tier display card
│   │   ├── EventsTable.tsx                # Events audit table
│   │   ├── RevenueChart.tsx               # Revenue visualization
│   │   ├── StatusBadge.tsx                # Status indicators
│   │   └── ExportButton.tsx               # Export functionality
│   └── admin/                              # NEW
│       ├── AdminRoute.tsx                  # Admin-only route guard
│       └── RoleGuard.tsx                   # Generic role guard
├── lib/
│   ├── hooks/
│   │   ├── use-subscriptions.ts           # NEW: Admin subscriptions hook
│   │   ├── use-subscription-stats.ts      # NEW: Stats hook
│   │   └── use-admin.ts                   # NEW: Admin role check hook
│   └── services/
│       └── admin-subscription.ts          # NEW: Admin subscription service
└── types/
    └── admin.ts                            # NEW: Admin-specific types

packages/supabase/src/services/
├── subscription.ts                         # EXISTING (enhance)
└── admin-subscription.ts                   # NEW: Admin operations

packages/validation/src/
└── admin-subscription.ts                   # NEW: Admin validation schemas
```

### Component Architecture

```
SubscriptionDashboard (page.tsx)
├── ProtectedRoute (auth check)
├── AdminRoute (role check) ← NEW
├── SubscriptionStatsCards
│   ├── StatCard (Total)
│   ├── StatCard (Active)
│   ├── StatCard (MRR)
│   └── StatCard (Churn)
├── RevenueChart
└── RecentEventsTimeline

SubscriptionUsersList (page.tsx)
├── ProtectedRoute
├── AdminRoute ← NEW
├── SearchBar
├── FilterPanel
│   ├── StatusFilter
│   ├── TierFilter
│   └── DateRangeFilter
├── SubscriptionTable
│   ├── TableHeader (sortable)
│   ├── TableRow (for each subscription)
│   │   ├── UserCell
│   │   ├── TierCell (badge)
│   │   ├── StatusCell (badge)
│   │   ├── DatesCell
│   │   └── ActionsCell (dropdown)
│   └── Pagination
└── BulkActions (when items selected)

SubscriptionDetail (page.tsx)
├── ProtectedRoute
├── AdminRoute ← NEW
├── UserInfoCard
├── SubscriptionDetailCard
│   ├── TierInfo
│   ├── StatusInfo
│   ├── BillingInfo
│   └── AdminActions
├── SubscriptionTimeline
│   └── EventItem (for each event)
└── BackButton

TiersManagement (page.tsx)
├── ProtectedRoute
├── AdminRoute ← NEW
├── TiersGrid
│   └── TierCard (for each tier)
│       ├── TierHeader
│       ├── FeaturesList
│       ├── PricingInfo
│       └── Actions (Edit/Duplicate/Archive)
└── CreateTierButton

EventsAuditLog (page.tsx)
├── ProtectedRoute
├── AdminRoute ← NEW
├── FilterBar
│   ├── DateRangePicker
│   ├── EventTypeFilter
│   └── UserSearch
├── EventsTable
│   └── EventRow (for each event)
│       ├── TimestampCell
│       ├── UserCell
│       ├── EventTypeCell (badge)
│       └── ActionsCell (View Details)
├── ExportButton
└── Pagination
```

---

## Implementation Phases

### Phase 1: Core Infrastructure and Subscription Management (Weeks 1-3)

**Goals:** Establish admin access control and basic subscription viewing/management

#### Week 1: Foundation

- [ ] **Task 1.1:** Create admin route guard component
  - File: `apps/web/components/admin/AdminRoute.tsx`
  - Hook: `apps/web/lib/hooks/use-admin.ts`
  - Check user role from Supabase users table
  - Redirect non-admins to dashboard
  - Show loading state during auth check

- [ ] **Task 1.2:** Enhance subscription service for admin operations
  - File: `packages/supabase/src/services/admin-subscription.ts`
  - Methods:
    - `getAllSubscriptionsAdmin(filters, pagination)` - with advanced filtering
    - `getSubscriptionByIdAdmin(subscriptionId)` - admin view of any subscription
    - `updateSubscriptionAdmin(subscriptionId, updates)` - manual updates
    - `cancelSubscriptionAdmin(subscriptionId, reason)` - admin cancellation
    - `extendSubscription(subscriptionId, days)` - grace period extension

- [ ] **Task 1.3:** Create admin validation schemas
  - File: `packages/validation/src/admin-subscription.ts`
  - Schemas:
    - `adminSubscriptionFilterSchema` - for list filtering
    - `adminSubscriptionUpdateSchema` - for manual updates
    - `adminCancelSubscriptionSchema` - cancellation with reason
    - `adminExtendSubscriptionSchema` - extension validation

- [ ] **Task 1.4:** Update RLS policies (if needed)
  - Review existing admin policies
  - Ensure admin role can read all subscription data
  - Test policy enforcement

#### Week 2: Dashboard and List View

- [ ] **Task 2.1:** Build Subscription Dashboard page
  - File: `apps/web/app/dashboard/subscriptions/page.tsx`
  - Components:
    - `SubscriptionStatsCards` - key metrics
    - `RevenueChart` - placeholder for Phase 2
    - `RecentEventsTimeline` - last 10 events
  - Data: `useSubscriptionStats()` hook

- [ ] **Task 2.2:** Create stats hook
  - File: `apps/web/lib/hooks/use-subscription-stats.ts`
  - Use TanStack Query
  - Call `getSubscriptionStats()` service
  - Refresh interval: 30 seconds
  - Error handling

- [ ] **Task 2.3:** Build User Subscriptions List page
  - File: `apps/web/app/dashboard/subscriptions/users/page.tsx`
  - Components:
    - `SubscriptionTable` - main table
    - `SearchBar` - user search
    - `FilterPanel` - status, tier, date filters
  - Data: `useSubscriptions()` hook with filters
  - Pagination: 20 items per page
  - Real-time updates via Supabase subscriptions

- [ ] **Task 2.4:** Create reusable components
  - File: `apps/web/components/subscriptions/StatusBadge.tsx`
    - Color-coded badges for subscription status
  - File: `apps/web/components/subscriptions/SubscriptionTable.tsx`
    - Sortable table with actions
  - File: `apps/web/components/subscriptions/SubscriptionStatsCards.tsx`
    - Metric display cards

#### Week 3: Detail View and Actions

- [ ] **Task 3.1:** Build Subscription Detail page
  - File: `apps/web/app/dashboard/subscriptions/users/[id]/page.tsx`
  - Sections:
    - User information
    - Subscription details
    - Billing information
    - Event timeline
  - Data: `useSubscription(subscriptionId)` hook

- [ ] **Task 3.2:** Create detail components
  - File: `apps/web/components/subscriptions/SubscriptionDetailCard.tsx`
  - File: `apps/web/components/subscriptions/SubscriptionTimeline.tsx`
  - File: `apps/web/components/subscriptions/UserInfoCard.tsx`
  - Display all subscription fields
  - Show Stripe links

- [ ] **Task 3.3:** Implement admin actions
  - Cancel subscription action:
    - Confirmation modal
    - Reason dropdown/textarea
    - Call `cancelSubscriptionAdmin()`
    - Update UI optimistically
  - Extend subscription action:
    - Date picker for extension
    - Call `extendSubscription()`
    - Show success message
  - View in Stripe action:
    - Open Stripe dashboard in new tab
    - Construct proper Stripe URL

- [ ] **Task 3.4:** Add navigation
  - Update dashboard navigation to include "Subscriptions" link
  - Add breadcrumbs to all subscription pages
  - Add back buttons
  - Update keyboard shortcuts (if applicable)

#### Deliverables - Phase 1

- ✅ Admin-protected subscription routes
- ✅ Subscription dashboard with key metrics
- ✅ Paginated list of all user subscriptions
- ✅ Search and filter functionality
- ✅ Detailed subscription view
- ✅ Admin actions (cancel, extend, view in Stripe)
- ✅ Real-time updates
- ✅ Responsive design matching existing admin pages

---

### Phase 2: Analytics, Reporting, and Event Logs (Weeks 4-5)

**Goals:** Add analytics dashboards and audit logging capabilities

#### Week 4: Charts and Analytics

- [ ] **Task 4.1:** Implement revenue chart
  - Component: `apps/web/components/subscriptions/RevenueChart.tsx`
  - Library: Recharts
  - Data: Monthly MRR for last 6 months
  - Interactive: Hover for details, toggle tier breakdown

- [ ] **Task 4.2:** Add tier distribution chart
  - Component: `apps/web/components/subscriptions/TierDistributionChart.tsx`
  - Type: Pie chart or donut chart
  - Show percentage of users on each tier

- [ ] **Task 4.3:** Build subscription trends section
  - Component: `apps/web/components/subscriptions/SubscriptionTrends.tsx`
  - Charts:
    - New subscriptions per month (line chart)
    - Cancellations per month (line chart)
    - Net growth (bar chart)

- [ ] **Task 4.4:** Create reports page framework
  - File: `apps/web/app/dashboard/subscriptions/reports/page.tsx`
  - Report types dropdown
  - Date range selector
  - Generate button
  - Download options (CSV, PDF)

#### Week 5: Event Logs and Export

- [ ] **Task 5.1:** Build Events Audit Log page
  - File: `apps/web/app/dashboard/subscriptions/events/page.tsx`
  - Components:
    - `EventsTable` - paginated events
    - `EventFilterPanel` - event type, date, user filters
    - `EventDetailModal` - expanded event metadata
  - Data: `useSubscriptionEvents()` hook

- [ ] **Task 5.2:** Create event components
  - File: `apps/web/components/subscriptions/EventsTable.tsx`
  - File: `apps/web/components/subscriptions/EventTypeBadge.tsx`
  - Color-code events by type
  - Format timestamps
  - Expandable metadata

- [ ] **Task 5.3:** Implement export functionality
  - Component: `apps/web/components/subscriptions/ExportButton.tsx`
  - Formats: CSV, JSON
  - Data transformation utilities
  - Library: papaparse for CSV
  - Download trigger

- [ ] **Task 5.4:** Add export to all list views
  - Export subscriptions list (filtered results)
  - Export events log (filtered results)
  - Export stats summary
  - Include relevant columns only

#### Deliverables - Phase 2

- ✅ Revenue trend visualization
- ✅ Tier distribution analytics
- ✅ Subscription growth/churn charts
- ✅ Event audit log viewer with filters
- ✅ CSV/JSON export functionality
- ✅ Reports page framework

---

### Phase 3: Advanced Features and Tier Management (Weeks 6-7)

**Goals:** Enable tier configuration and advanced administrative capabilities

#### Week 6: Tier Management

- [ ] **Task 6.1:** Build Tiers List page
  - File: `apps/web/app/dashboard/subscriptions/tiers/page.tsx`
  - Display all tiers in grid or table
  - Show active/inactive status
  - Show subscriber count per tier
  - Add "Create Tier" button

- [ ] **Task 6.2:** Create Tier Form component
  - File: `apps/web/components/subscriptions/TierForm.tsx`
  - Fields:
    - Name (slug)
    - Display name
    - Description (textarea)
    - Price (number input)
    - Stripe Price ID
    - Features (dynamic key-value pairs)
    - Active toggle
  - Validation with Zod
  - Submit handling

- [ ] **Task 6.3:** Build Create Tier page
  - File: `apps/web/app/dashboard/subscriptions/tiers/new/page.tsx`
  - Use `TierForm` component
  - Call `createTier()` service method
  - Redirect to tiers list on success

- [ ] **Task 6.4:** Build Edit Tier page
  - File: `apps/web/app/dashboard/subscriptions/tiers/[id]/edit/page.tsx`
  - Load existing tier data
  - Pre-populate form
  - Warning if tier has active subscribers
  - Call `updateTier()` service method

- [ ] **Task 6.5:** Add tier service methods
  - File: `packages/supabase/src/services/admin-subscription.ts`
  - Methods:
    - `createTier(tierData)` - admin only
    - `updateTier(tierId, updates)` - admin only
    - `deleteTier(tierId)` - check for subscribers first
    - `toggleTierActive(tierId, active)` - admin only
    - `getTierSubscriberCount(tierId)` - for validation

#### Week 7: Advanced Admin Features

- [ ] **Task 7.1:** Implement bulk actions
  - Component: `apps/web/components/subscriptions/BulkActions.tsx`
  - Actions:
    - Export selected (CSV)
    - Send notification (future: email)
  - Selection state management
  - Confirmation modals

- [ ] **Task 7.2:** Add subscription transfer capability
  - Service: `transferSubscription(fromUserId, toUserId, subscriptionId)`
  - UI: Modal with user search
  - Validation: Ensure target user exists
  - Audit: Log transfer event

- [ ] **Task 7.3:** Implement manual subscription creation
  - Page: Add "Create Subscription" button to users list
  - Modal form:
    - User selector
    - Tier selector
    - Start date
    - Custom period end (optional)
    - Mark as complimentary (no Stripe)
  - Service: `createManualSubscription()`
  - Use case: Comps, migrations, special deals

- [ ] **Task 7.4:** Add advanced filtering
  - Filter by:
    - Payment failed (past_due status)
    - Expiring soon (next 7 days)
    - Cancelled but still active (cancel_at_period_end)
    - Complimentary (no Stripe ID)
  - Preset filter buttons
  - URL query params for shareable filters

- [ ] **Task 7.5:** Create admin notes feature
  - Add `admin_notes` JSONB column to `user_subscriptions` (migration)
  - UI: Notes section in detail view
  - Actions: Add note, edit note, delete note
  - Show note author and timestamp
  - Use case: Support context, special arrangements

#### Deliverables - Phase 3

- ✅ Full tier CRUD operations
- ✅ Tier subscriber count display
- ✅ Bulk export of subscriptions
- ✅ Manual subscription creation
- ✅ Subscription transfer capability
- ✅ Advanced filtering options
- ✅ Admin notes on subscriptions

---

## Database Schema Updates

### New Migration: Admin Notes

**File:** `supabase/migrations/20251020000000_add_admin_notes_to_subscriptions.sql`

```sql
-- Add admin_notes column to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS admin_notes JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN public.user_subscriptions.admin_notes IS
'Admin notes array: [{ author_id: uuid, note: text, created_at: timestamp }]';

-- Update RLS policy to allow admins to modify admin_notes
-- (Existing admin policies should already allow this)
```

**Structure of admin_notes JSONB:**

```json
[
  {
    "id": "uuid",
    "author_id": "admin_user_uuid",
    "author_name": "Admin Name",
    "note": "Customer requested extension due to billing issue",
    "created_at": "2025-10-19T10:30:00Z"
  }
]
```

### New Migration: Enhanced Subscription Events

**File:** `supabase/migrations/20251020000001_add_event_types.sql`

```sql
-- Add new event types for admin actions
-- Modify the check constraint on subscription_events.event_type

ALTER TABLE public.subscription_events
DROP CONSTRAINT IF EXISTS subscription_events_event_type_check;

ALTER TABLE public.subscription_events
ADD CONSTRAINT subscription_events_event_type_check
CHECK (event_type IN (
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_renewed',
  'payment_succeeded',
  'payment_failed',
  'trial_started',
  'trial_ended',
  'admin_cancellation',          -- NEW
  'admin_extension',             -- NEW
  'admin_tier_change',           -- NEW
  'admin_manual_creation',       -- NEW
  'admin_transfer',              -- NEW
  'admin_note_added'             -- NEW
));
```

### New Table: Subscription Tier Management (Optional Enhancement)

**File:** `supabase/migrations/20251020000002_add_tier_history.sql`

For tracking tier pricing changes over time:

```sql
-- Create tier_history table for audit trail
CREATE TABLE IF NOT EXISTS public.tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'price_change')),
  old_data JSONB,
  new_data JSONB,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying by tier
CREATE INDEX idx_tier_history_tier_id ON public.tier_history(tier_id);
CREATE INDEX idx_tier_history_created_at ON public.tier_history(created_at DESC);

-- RLS policies
ALTER TABLE public.tier_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tier history"
  ON public.tier_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only service role can insert tier history"
  ON public.tier_history
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
```

---

## API Endpoints

All endpoints will use the existing Supabase client pattern. New service methods:

### Admin Subscription Service Methods

**File:** `packages/supabase/src/services/admin-subscription.ts`

```typescript
export class AdminSubscriptionService {
  // List and filter subscriptions
  async getAllSubscriptionsAdmin(options: {
    page?: number;
    perPage?: number;
    status?: SubscriptionStatus[];
    tierIds?: string[];
    search?: string; // user name or email
    dateFrom?: Date;
    dateTo?: Date;
    cancelAtPeriodEnd?: boolean;
    expiringInDays?: number;
  }): Promise<PaginatedSubscriptions>;

  // Get single subscription
  async getSubscriptionByIdAdmin(
    subscriptionId: string,
  ): Promise<UserSubscriptionWithTier>;

  // Update subscription
  async updateSubscriptionAdmin(
    subscriptionId: string,
    updates: Partial<UserSubscription>,
  ): Promise<UserSubscription>;

  // Cancel subscription (admin override)
  async cancelSubscriptionAdmin(
    subscriptionId: string,
    options: {
      immediate?: boolean;
      reason?: string;
    },
  ): Promise<UserSubscription>;

  // Extend subscription period
  async extendSubscription(
    subscriptionId: string,
    extensionDays: number,
    reason: string,
  ): Promise<UserSubscription>;

  // Change tier (admin override)
  async changeTierAdmin(
    subscriptionId: string,
    newTierId: string,
    options: {
      prorate?: boolean;
      effectiveDate?: Date;
    },
  ): Promise<UserSubscription>;

  // Manual subscription creation
  async createManualSubscription(data: {
    userId: string;
    tierId: string;
    startDate: Date;
    endDate?: Date;
    isComplimentary?: boolean;
  }): Promise<UserSubscription>;

  // Transfer subscription
  async transferSubscription(
    subscriptionId: string,
    toUserId: string,
    reason: string,
  ): Promise<UserSubscription>;

  // Tier management
  async createTier(
    tierData: Omit<SubscriptionTier, "id" | "created_at">,
  ): Promise<SubscriptionTier>;
  async updateTier(
    tierId: string,
    updates: Partial<SubscriptionTier>,
  ): Promise<SubscriptionTier>;
  async deleteTier(tierId: string): Promise<void>;
  async getTierSubscriberCount(tierId: string): Promise<number>;

  // Admin notes
  async addAdminNote(subscriptionId: string, note: string): Promise<void>;
  async updateAdminNote(
    subscriptionId: string,
    noteId: string,
    note: string,
  ): Promise<void>;
  async deleteAdminNote(subscriptionId: string, noteId: string): Promise<void>;

  // Events
  async getAllSubscriptionEvents(options: {
    page?: number;
    perPage?: number;
    eventTypes?: SubscriptionEventType[];
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<PaginatedEvents>;

  // Analytics
  async getRevenueTrend(months: number): Promise<RevenueTrendData[]>;
  async getTierDistribution(): Promise<TierDistributionData[]>;
  async getChurnAnalysis(days: number): Promise<ChurnAnalysisData>;
  async getSubscriptionGrowth(months: number): Promise<GrowthData[]>;
}
```

### Export Utilities

**File:** `packages/utils/src/export.ts`

```typescript
export class ExportService {
  // Export subscriptions to CSV
  exportSubscriptionsToCSV(subscriptions: UserSubscriptionWithTier[]): string;

  // Export events to CSV
  exportEventsToCSV(events: SubscriptionEvent[]): string;

  // Export to JSON
  exportToJSON(data: any): string;

  // Generate PDF report (Phase 3)
  generatePDFReport(reportData: ReportData): Blob;
}
```

---

## UI/UX Design

### Design Principles

1. **Consistency:** Match existing admin pages (rooms, bookings, users)
2. **Clarity:** Clear labels, helpful tooltips, obvious actions
3. **Efficiency:** Minimize clicks, provide keyboard shortcuts
4. **Feedback:** Loading states, success/error messages, optimistic updates
5. **Accessibility:** WCAG 2.1 AA compliance, keyboard navigation

### Color Scheme (Status Badges)

```typescript
const statusColors = {
  active: "green", // bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300
  cancelled: "red", // bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300
  past_due: "orange", // bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300
  trialing: "blue", // bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300
  incomplete: "gray", // bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300
  unpaid: "red", // bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300
};

const tierColors = {
  free: "gray", // bg-gray-100 text-gray-800
  premium: "purple", // bg-purple-100 text-purple-800
};
```

### Responsive Breakpoints

- Mobile: < 640px (stacked cards, simplified table)
- Tablet: 640px - 1024px (2-column layout)
- Desktop: > 1024px (full multi-column tables)

### Key UI Components

#### Stats Card

```
┌─────────────────────────────┐
│ 🎯 Total Subscriptions      │
│ 1,234                       │
│ ↑ 12% from last month       │
└─────────────────────────────┘
```

#### Subscription Table Row

```
┌──────────────────────────────────────────────────────────────────┐
│ [Avatar] John Doe              │ Premium  │ Active  │ Actions ▼ │
│          john@example.com      │ 🟣       │ 🟢      │           │
│          Expires: 2025-11-19   │          │         │           │
└──────────────────────────────────────────────────────────────────┘
```

#### Timeline Event

```
┌────────────────────────────────────────────┐
│ 🟢 subscription_created                    │
│ 2025-10-01 10:30 AM                        │
│ User subscribed to Premium tier            │
│ [View Details]                             │
└────────────────────────────────────────────┘
```

### Navigation Structure

Update dashboard sidebar:

```
Dashboard
├── Overview
├── Rooms
├── Bookings
├── Users
└── Subscriptions ← NEW
    ├── Dashboard
    ├── User Subscriptions
    ├── Tiers
    ├── Events
    └── Reports
```

### Accessibility Features

- ARIA labels on all interactive elements
- Keyboard shortcuts:
  - `/` - Focus search
  - `n` - New subscription/tier
  - `?` - Show keyboard shortcuts
  - `Esc` - Close modals
- Screen reader announcements for updates
- Focus management in modals
- High contrast mode support

---

## Security and Authorization

### Role-Based Access Control (RBAC)

#### Admin Role Check

**Pattern:**

1. Frontend: `AdminRoute` component checks user role
2. Backend: RLS policies enforce admin-only access
3. Double validation: Never trust client-side alone

**Implementation:**

```typescript
// apps/web/lib/hooks/use-admin.ts
export function useAdmin() {
  const { user } = useAuth();
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    isAdmin: userData?.role === "admin",
    isLoading,
  };
}
```

### Data Access Policies

#### Subscription Data

- **Admins:** Full read/write access to all subscriptions
- **Service Role:** Full access for Stripe webhooks and system operations
- **Users:** Read-only access to their own subscription (existing policy)

#### Tier Data

- **Admins:** Full CRUD operations on tiers
- **Service Role:** Full access
- **Users:** Read-only access to active tiers (existing policy)

#### Event Logs

- **Admins:** Read access to all events
- **Service Role:** Write access for event creation
- **Users:** Read access to their own events (existing policy)

### Audit Logging

All admin actions must be logged to `subscription_events`:

```typescript
async function logAdminAction(
  userId: string,
  subscriptionId: string,
  eventType: SubscriptionEventType,
  metadata: Record<string, any>,
) {
  await supabase.from("subscription_events").insert({
    user_id: userId,
    subscription_id: subscriptionId,
    event_type: eventType,
    metadata: {
      ...metadata,
      admin_id: currentAdminId,
      admin_name: currentAdminName,
      action_timestamp: new Date().toISOString(),
    },
  });
}
```

**Events to Log:**

- `admin_cancellation` - When admin cancels subscription
- `admin_extension` - When admin extends period
- `admin_tier_change` - When admin changes tier
- `admin_manual_creation` - When admin creates manual subscription
- `admin_transfer` - When admin transfers subscription
- `admin_note_added` - When admin adds note

### Input Validation

All admin inputs must be validated with Zod schemas:

```typescript
// packages/validation/src/admin-subscription.ts
export const adminCancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  immediate: z.boolean().default(false),
  reason: z.string().min(10).max(500),
});

export const adminExtendSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  extensionDays: z.number().int().min(1).max(365),
  reason: z.string().min(10).max(500),
});

export const adminCreateTierSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  display_name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price_monthly: z.number().min(0),
  stripe_price_id: z.string().optional(),
  features: z.record(z.unknown()),
  is_active: z.boolean().default(true),
});
```

### Rate Limiting

Implement rate limiting for admin actions (future enhancement):

- Max 100 subscription updates per minute per admin
- Max 10 tier modifications per hour per admin
- Prevent accidental bulk operations

### Sensitive Data Handling

**Protected Fields:**

- Stripe customer ID (display only, no editing)
- Stripe subscription ID (display only)
- Payment method details (fetch from Stripe API, never store)

**Data Masking:**

- Email: Show full (admins need it for support)
- Phone: Show full (admins need it for support)
- Stripe IDs: Show with copy button

---

## Testing Strategy

### Unit Tests

**Target Coverage:** 80%+

#### Service Layer Tests

**File:** `packages/supabase/src/services/admin-subscription.test.ts`

Test cases:

- ✅ `getAllSubscriptionsAdmin()` returns paginated results
- ✅ `getAllSubscriptionsAdmin()` filters by status correctly
- ✅ `getAllSubscriptionsAdmin()` filters by tier correctly
- ✅ `getAllSubscriptionsAdmin()` searches by user name
- ✅ `cancelSubscriptionAdmin()` updates subscription status
- ✅ `cancelSubscriptionAdmin()` creates audit event
- ✅ `extendSubscription()` updates period_end correctly
- ✅ `createTier()` validates required fields
- ✅ `deleteTier()` prevents deletion if subscribers exist
- ✅ `addAdminNote()` appends to admin_notes array

#### Component Tests

**Tool:** React Testing Library

Files to test:

- `SubscriptionStatsCards.test.tsx`
- `SubscriptionTable.test.tsx`
- `TierForm.test.tsx`
- `StatusBadge.test.tsx`
- `AdminRoute.test.tsx`

Test cases:

- ✅ Stats cards display correct values
- ✅ Table renders rows correctly
- ✅ Table sorting works
- ✅ Form validation triggers on invalid input
- ✅ Status badge shows correct color
- ✅ AdminRoute redirects non-admins

### Integration Tests

**Tool:** Playwright or Cypress

#### End-to-End Flows

1. **Admin Login and Navigate to Subscriptions**
   - Login as admin
   - Navigate to /dashboard/subscriptions
   - Verify stats cards load
   - Verify charts render

2. **View User Subscription**
   - Navigate to user subscriptions list
   - Search for user
   - Click on subscription
   - Verify detail page loads
   - Verify timeline shows events

3. **Cancel Subscription**
   - Navigate to subscription detail
   - Click "Cancel Subscription"
   - Fill cancellation reason
   - Confirm cancellation
   - Verify status updates to "cancelled"
   - Verify event logged

4. **Create Tier**
   - Navigate to tiers page
   - Click "Create Tier"
   - Fill tier form
   - Submit
   - Verify tier appears in list

5. **Export Subscriptions**
   - Navigate to subscriptions list
   - Apply filters
   - Click "Export to CSV"
   - Verify file downloads
   - Verify CSV contains correct data

### Performance Tests

**Goals:**

- Page load < 2 seconds
- Table pagination < 500ms
- Search results < 1 second
- Export generation < 5 seconds for 1000 records

**Tools:** Lighthouse, Chrome DevTools

### Security Tests

#### Access Control Tests

- ✅ Non-admin cannot access /dashboard/subscriptions
- ✅ Non-admin API calls to admin endpoints fail
- ✅ RLS policies prevent unauthorized data access
- ✅ SQL injection attempts blocked by parameterized queries

#### Data Validation Tests

- ✅ Invalid subscription IDs rejected
- ✅ Negative extension days rejected
- ✅ XSS attempts in notes sanitized
- ✅ CSRF tokens validated (if applicable)

### Test Data Setup

**Seed Script:** `supabase/seed.sql` (update)

```sql
-- Create test admin user
INSERT INTO auth.users (id, email) VALUES
  ('admin-test-uuid', 'admin@test.com');

INSERT INTO public.users (id, email, full_name, role) VALUES
  ('admin-test-uuid', 'admin@test.com', 'Test Admin', 'admin');

-- Create test subscriptions
INSERT INTO public.user_subscriptions
  (user_id, tier_id, status, current_period_start, current_period_end)
SELECT
  u.id,
  t.id,
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM public.users u
CROSS JOIN public.subscription_tiers t
WHERE t.name = 'premium'
LIMIT 10;
```

---

## Rollout Plan

### Pre-Launch Checklist

#### Development

- [ ] All Phase 1 features implemented
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] TypeScript strict mode enabled
- [ ] ESLint warnings resolved
- [ ] Performance benchmarks met

#### Security

- [ ] Admin role check implemented on all routes
- [ ] RLS policies tested and verified
- [ ] Input validation schemas applied
- [ ] Audit logging confirmed working
- [ ] Penetration testing completed (if required)

#### Documentation

- [ ] API documentation updated
- [ ] Component storybook created (optional)
- [ ] Admin user guide written
- [ ] FAQ document prepared
- [ ] Troubleshooting guide created

#### Infrastructure

- [ ] Database migrations tested on staging
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Error tracking set up (Sentry/similar)
- [ ] Performance monitoring enabled

### Deployment Strategy

#### Stage 1: Staging Deployment (Week 3)

- Deploy to staging environment
- Internal team testing
- Admin users perform UAT
- Collect feedback and iterate
- Performance testing under load
- Fix critical bugs

#### Stage 2: Canary Release (Week 4)

- Deploy to production for select admins only
- Monitor error rates
- Gather feedback from early adopters
- Fix any issues discovered
- Validate analytics data accuracy

#### Stage 3: Full Production Release (Week 5)

- Enable for all admin users
- Announce feature via:
  - Email to admin team
  - Internal documentation update
  - Optional: Blog post or changelog
- Monitor for 48 hours closely
- Be ready for hotfixes

#### Stage 4: Phase 2 & 3 Rollout (Weeks 6-8)

- Follow same pattern for subsequent phases
- Incremental feature releases
- Continuous monitoring and improvement

### Rollback Plan

**Triggers for Rollback:**

- Error rate > 5%
- Performance degradation > 50%
- Security vulnerability discovered
- Data corruption detected

**Rollback Steps:**

1. Disable subscription routes (feature flag or route removal)
2. Revert database migrations if necessary
3. Notify admin team of rollback
4. Investigate root cause
5. Fix issues in staging
6. Re-deploy when stable

### Monitoring and Alerts

**Key Metrics to Monitor:**

- Page load times (p95, p99)
- API response times
- Error rates (4xx, 5xx)
- Database query performance
- User engagement (page views, actions taken)

**Alerts:**

- Error rate > 2% - Slack notification
- API response time > 3s - Email notification
- Database connection failures - PagerDuty alert

**Tools:**

- Application monitoring: Vercel Analytics or similar
- Error tracking: Sentry
- Database monitoring: Supabase Dashboard
- Logs: Supabase Logs or external logging service

---

## Success Metrics

### Business Metrics

#### Primary KPIs

1. **Admin Efficiency**
   - **Metric:** Time to resolve subscription support tickets
   - **Target:** Reduce from 30 minutes to 10 minutes
   - **Measurement:** Track average resolution time in support system

2. **Subscription Visibility**
   - **Metric:** Number of subscription-related support tickets
   - **Target:** Reduce by 30%
   - **Measurement:** Ticket category counts

3. **Data-Driven Decisions**
   - **Metric:** Frequency of subscription tier adjustments
   - **Target:** 1 optimization per quarter based on analytics
   - **Measurement:** Tier change log

#### Secondary KPIs

1. **Revenue Optimization**
   - **Metric:** MRR growth
   - **Target:** Maintain or increase (not decrease due to admin errors)
   - **Measurement:** Monthly revenue reports

2. **Churn Prevention**
   - **Metric:** Proactive cancellation prevention
   - **Target:** Contact 50% of "expiring soon" users
   - **Measurement:** Admin action logs

### Technical Metrics

#### Performance

- **Page Load Time:** < 2 seconds (p95)
- **Search Response Time:** < 1 second
- **Table Pagination:** < 500ms
- **Export Generation:** < 5 seconds for 1000 records

#### Reliability

- **Uptime:** 99.9%
- **Error Rate:** < 1%
- **Data Accuracy:** 100% (subscription data matches Stripe)

#### Adoption

- **Admin User Adoption:** 100% of admins use portal within 1 month
- **Feature Usage:** 80% of admins use dashboard weekly
- **Export Usage:** Average 10 exports per week

### User Satisfaction

#### Feedback Collection

- Post-launch survey to admin users
- Monthly feedback sessions
- Feature request tracking

#### Target Scores

- **Ease of Use:** 4.5/5
- **Feature Completeness:** 4/5
- **Performance:** 4.5/5

---

## Appendix

### A. Glossary

- **MRR (Monthly Recurring Revenue):** Total monthly revenue from active subscriptions
- **Churn Rate:** Percentage of subscribers who cancel in a given period
- **RLS (Row Level Security):** Postgres security feature enforcing data access rules
- **Admin Override:** Manual action by admin to modify subscription outside normal flow
- **Complimentary Subscription:** Free subscription given by admin without payment

### B. Reference Links

- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **Stripe Subscription Docs:** https://stripe.com/docs/billing/subscriptions/overview
- **TanStack Query Docs:** https://tanstack.com/query/latest
- **Recharts Docs:** https://recharts.org/

### C. Team Contacts

- **Project Lead:** [Name]
- **Backend Engineer:** [Name]
- **Frontend Engineer:** [Name]
- **Product Manager:** [Name]
- **QA Lead:** [Name]

### D. Timeline Gantt Chart

```
Week 1: [████████████████████████████] Foundation & Admin Guards
Week 2: [████████████████████████████] Dashboard & List View
Week 3: [████████████████████████████] Detail View & Actions
Week 4: [████████████████████████████] Analytics & Charts
Week 5: [████████████████████████████] Event Logs & Export
Week 6: [████████████████████████████] Tier Management
Week 7: [████████████████████████████] Advanced Features & Polish
Week 8: [████████████████████████████] Testing & Deployment
```

### E. Open Questions

1. Should we integrate with Stripe's customer portal for payment method updates, or build our own UI?
   - **Recommendation:** Use Stripe portal (already implemented in mobile app)

2. Do we need email notifications for subscription events (e.g., cancellation confirmation)?
   - **Recommendation:** Phase 4 enhancement

3. Should we support multiple currencies?
   - **Recommendation:** Not in initial release; USD only for now

4. Do we need refund processing in the admin portal?
   - **Recommendation:** Link to Stripe dashboard for refunds (not build custom UI)

5. Should there be approval workflow for tier pricing changes?
   - **Recommendation:** Not initially; add if needed based on governance requirements

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building a subscription management portal in the web application. By following this phased approach, we can deliver value incrementally while maintaining code quality, security, and user experience standards.

**Next Steps:**

1. Review and approve this plan with stakeholders
2. Finalize timeline and assign resources
3. Set up project tracking (Jira, Linear, etc.)
4. Begin Phase 1 implementation
5. Schedule weekly progress reviews

**Document Maintenance:**

- This plan should be updated as implementation progresses
- Document actual vs. estimated timelines
- Track deviations and learnings
- Update based on stakeholder feedback

---

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Author:** Claude Code
**Status:** Awaiting Review
