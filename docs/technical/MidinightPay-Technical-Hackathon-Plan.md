  MidnightPay MVP: 2-Day Implementation Plan

  Phase 1: Core Contract Extensions (6 hours)

  Priority: Critical foundation

  Smart Contract Changes:
  - Add merchant account structure to existing bank.compact
  - Create subscription authorization circuit (build on existing transfer auth)
  - Implement basic recurring payment logic
  - Add merchant verification based on transaction count

  Deliverable: Compilable contract with merchant + subscription circuits

  Phase 2: Minimal API Integration (4 hours)

  Priority: Essential connectivity

  API Extensions:
  - Extend bank-api.ts with merchant registration functions
  - Add subscription creation/management endpoints
  - Simple subscription payment processing
  - Basic merchant metrics (encrypted counts)

  Deliverable: Working API that can create merchants and subscriptions

  Phase 3: Demo UI - Customer Side (4 hours)

  Priority: Customer experience demo

  Customer Interface:
  - Extend existing bank-ui with subscription view
  - Add "Subscribe to Service" flow with spending limits
  - Show active subscriptions (encrypted status)
  - Subscription payment approval interface

  Deliverable: Customer can subscribe and manage subscriptions

  Phase 4: Demo UI - Merchant Side (3 hours)

  Priority: Merchant experience demo

  Merchant Dashboard:
  - Simple merchant registration form
  - Create subscription service interface
  - Trigger subscription payments
  - View basic encrypted metrics ("X active subscribers")

  Deliverable: Basic merchant dashboard for demo

  Phase 5: Integration & Demo Flow (4 hours)

  Priority: End-to-end demonstration

  Integration Work:
  - Connect all components
  - Test full subscription flow
  - Fix critical bugs
  - Prepare demo data/accounts

  Deliverable: Working end-to-end demo

  Phase 6: Polish & Presentation (3 hours)