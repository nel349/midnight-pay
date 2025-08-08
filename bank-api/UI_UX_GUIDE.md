# Midnight Bank UI/UX Guide

This guide shows when and how to call Bank API methods in a privacy-preserving UI.

## Key methods
- createAccount(pin, initialDeposit): prove PIN and create account (private balance).
- authenticateBalanceAccess(pin): non-monetary auth to view sensitive data; updates last_transaction only.
- deposit(pin, amount): increase private balance.
- withdraw(pin, amount): decrease private balance.
- verifyAccountStatus(pin): evaluate account and set status (inactive/active/verified/suspended).

## Recommended flows
- Balance unlock/masking
  - Mask sensitive info by default (balance, history).
  - On “Show balance”, call authenticateBalanceAccess(pin), then unmask locally.
  - Re-auth on inactivity timeout; re-mask until user authenticates again.

- Post-transaction status refresh
  - After create/deposit/withdraw, call verifyAccountStatus(pin) to refresh the badge and gated features.

- Explicit “Verify my account” CTA
  - Provide a button in Profile/Settings to run verifyAccountStatus(pin) on demand.

- Prompting
  - Prompt for PIN only when needed (unlock, submit tx, explicit verify). Never store raw PIN.

## Privacy notes
- authenticateBalanceAccess does not reveal or change balance; it’s an auditable access proof.
- verifyAccountStatus reveals only status, not amounts.

## Integration sketch (React/TS)
```ts
import { useEffect, useRef, useState } from 'react';
import type { BankAPI } from '@midnight-bank/bank-api';
import { firstValueFrom } from 'rxjs';

const SESSION_TIMEOUT_MS = 5 * 60_000;

type Props = { api: BankAPI };

export function AccountPanel({ api }: Props) {
  const [masked, setMasked] = useState(true);
  const [state, setState] = useState(awaitState(api));
  const lastAuthAtRef = useRef<number | null>(null);

  useEffect(() => {
    const sub = api.state$.subscribe(setState);
    const t = setInterval(() => {
      if (lastAuthAtRef.current && Date.now() - lastAuthAtRef.current > SESSION_TIMEOUT_MS) {
        setMasked(true); lastAuthAtRef.current = null;
      }
    }, 5000);
    return () => { sub.unsubscribe(); clearInterval(t); };
  }, [api]);

  async function unlockBalance(pin: string) {
    await api.authenticateBalanceAccess(pin);
    lastAuthAtRef.current = Date.now();
    setMasked(false);
  }

  async function onCreate(pin: string, initial: string) {
    await api.createAccount(pin, initial);
    await api.verifyAccountStatus(pin);
  }

  async function onDeposit(pin: string, amount: string) {
    await api.deposit(pin, amount);
    await api.verifyAccountStatus(pin);
  }

  async function onWithdraw(pin: string, amount: string) {
    await api.withdraw(pin, amount);
    await api.verifyAccountStatus(pin);
  }

  return null;
}

async function awaitState(api: BankAPI) { return await firstValueFrom(api.state$); }
```

## Testing
- Positive lifecycle: create → authenticate → deposit → withdraw → verify.
- Negative: wrong PIN on tx, verify fails when requirements not met, re-auth timeout remasks.

## Checklist
- Mask by default; unlock with authenticateBalanceAccess.
- Re-auth on inactivity; never store PIN.
- Verify after impactful actions or via CTA.
- Drive UI from `state$`; don’t guess values.
