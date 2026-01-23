# Fullstack Development & Design Guidelines

This document outlines the architectural standards and design principles for the project.

## Fullstack Best Practices

### 1. Architecture & State Management
- **Server Components First**: Use React Server Components (RSC) by default for data fetching to reduce client-side JS.
- **Server Actions**: Use Next.js Server Actions for mutations (creating quotes, updating status) instead of manual API routes where possible.
- **Optimistic UI**: Implement optimistic updates when a Responsable approves a quote to make the interface feel instantaneous.
- **Zod Validation**: Use `zod` for both frontend form validation and backend schema validation to ensure data integrity.

### 2. Database & Data Integrity
- **Prisma Transactions**: Use transactions when creating a Quote to ensure that QuoteItems and Stock updates happen atomically.
- **Soft Deletes**: Instead of hard-deleting quotes, use an `isActive` or `deletedAt` column to preserve audit trails.
- **Indexing**: Ensure `userId` and `status` columns are indexed in the database for fast filtering on the dashboard.

### 3. Security
- **Role-Based Access Control (RBAC)**: Strict server-side checks in Middleware and Server Actions to ensure an `Etablissement` cannot approve their own quotes.
- **Input Sanitization**: Never trust client-side data; re-verify product prices on the server during quote creation.

## 🎨 Beautiful Design Rules

### 1. Visual Hierarchy & Clarity
- **Status Badges**: Use distinct, semantic colors for quote states:
  - `Approuvé`: Emerald/Green (Success)
  - `En attente`: Amber/Yellow (Warning)
  - `Rejeté`: Rose/Red (Destructive)
- **Whitespace**: Maintain generous padding (min 24px) between sections to prevent "dashboard fatigue."
- **Typography**: Use a clean sans-serif (like Inter or Geist). Use `font-medium` for labels and `font-bold` for totals/IDs.

### 2. Interactive Experience (UX)
- **Micro-interactions**: Add subtle hover scales on Quote cards and loading spinners on button actions.
- **Empty States**: Design beautiful "No quotes found" illustrations or messages to guide users.
- **Skeleton Screens**: Use Shadcn Skeletons during data fetching to reduce perceived latency.

### 3. Responsive Consistency
- **Mobile-First**: Ensure the "Create Quote" flow is usable on tablets/phones for users in the field.
- **Sticky Actions**: On long quote details, keep the "Approve/Reject" buttons sticky at the bottom of the viewport or modal.

## 🛠 Tech Stack Reference
- **Frontend**: Next.js 15, Tailwind CSS
- **Components**: Shadcn/UI (Radix).
- **Backend**: Prisma ORM, MySQL.
- **Validation**: Zod.
ONLY USE BUN, NEVER NPM.