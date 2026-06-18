---
title: Auth Patterns
tags:
  - security
  - backend
---

# Auth Patterns

Passwords are hashed with scrypt using a per-user random salt, and verified in
constant time to avoid timing attacks.

Sessions are stateless: we issue an HMAC-signed JWT-style token on login and
register. Protected routes require a valid Bearer token, which the middleware
verifies before attaching the user to the request.

Set a strong `AUTH_SECRET` in production. Tokens expire after 24 hours.

Related: [[Stripe Integration]].
