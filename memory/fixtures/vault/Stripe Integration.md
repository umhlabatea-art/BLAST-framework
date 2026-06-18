---
title: Stripe Integration
tags: [payments, finance, backend]
status: stable
---

# Stripe Integration

We use Stripe Checkout for one-off purchases. The backend creates a Checkout
session and redirects the user to the hosted payment page.

After payment, Stripe sends a `checkout.session.completed` webhook. The webhook
handler verifies the signature with the webhook secret, then marks the matching
payment record as paid.

In local development we run in stub mode so no real Stripe keys are needed.

See also [[Auth Patterns]] for how the user is identified during checkout.
