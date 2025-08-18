# Transaction Handler Usage Guide

## Overview
The new transaction error handling system provides:
- **Consistent error messages** across all components
- **Automatic loading state management**
- **Success/error notifications**
- **Detailed error categorization**
- **Modular, reusable patterns**

## Quick Migration Guide

### ❌ Before (Old Pattern)
```typescript
const handleDeposit = async () => {
  if (!bankAPI) return;
  try {
    setLoading(true);
    setError(null);
    
    const pinInput = await getPin('Enter PIN');
    await bankAPI.deposit(pinInput, amount);
    
    setLoading(false);
    // No success feedback!
  } catch (err) {
    setError(err); // Generic error, poor UX
    setLoading(false);
  }
};
```

### ✅ After (New Pattern)
```typescript
import { useTransactionHandler } from '../utils/errorHandler';

// In component
const transactionHandler = useTransactionHandler(setLoading, setError, setSuccess);

const handleDeposit = async () => {
  if (!bankAPI) return;
  
  const amount = prompt('Enter deposit amount:') ?? '';
  if (!amount) return;
  
  await transactionHandler.execute(
    async () => {
      const pinInput = await getPin('Enter PIN', bankAPI);
      await bankAPI.deposit(pinInput, amount);
      return amount;
    },
    'deposit',
    {
      onSuccess: (amount) => {
        setSuccess(`✅ Successfully deposited $${amount}`);
      }
    }
  );
};
```

## Key Benefits

### 🎯 **Smart Error Messages**
- **PIN errors**: "Invalid PIN. Please check your PIN and try again."
- **Balance errors**: "Insufficient funds or invalid amount."
- **Network errors**: "Network connection error. Please try again."
- **Generic fallback**: "An unexpected error occurred during [operation]."

### 🔄 **Automatic State Management**
- `setLoading(true)` at start
- `setLoading(false)` at end
- `setError(null)` to clear previous errors
- `setSuccess(message)` for positive feedback

### 📝 **Operation-Specific Success Messages**
- Deposit: "✅ Deposit successful: $50.00"
- Withdrawal: "✅ Withdrawal successful: $25.00"
- Transfer: "✅ Transfer successful: sent $100 to alice"
- Authorization: "✅ Authorization approved for bob"

## Usage Patterns

### Pattern 1: Main Page Transaction
```typescript
const transactionHandler = useTransactionHandler(setLoading, setError, setSuccess);

await transactionHandler.execute(
  async () => {
    const pin = await getPin('Enter PIN', bankAPI);
    await bankAPI.someOperation(pin, data);
  },
  'operation name'
);
```

### Pattern 2: Modal/Dialog Transaction (Inline Errors)
```typescript
// Add modal-specific error/success states
const [modalError, setModalError] = useState<string | null>(null);
const [modalSuccess, setModalSuccess] = useState<string | null>(null);

// Modal transaction handler
const modalHandler = useModalTransactionHandler(
  setLoading, 
  setModalError, 
  setModalSuccess,
  {
    useGlobalError: (error) => error && onError(error),
    useGlobalSuccess: (message) => message && onSuccess(message)
  }
);

// Usage in modal operation
await modalHandler.execute(
  async () => {
    const pin = await getPin('Enter PIN', bankAPI);
    const result = await bankAPI.someOperation(pin, data);
    return result;
  },
  'operation name',
  {
    onSuccess: (result) => {
      // Custom success handling
      setTimeout(() => {
        setShowModal(false);
        setModalError(null);
        setModalSuccess(null);
        // Refresh data
      }, 1500);
    },
    useGlobalNotifications: true // Also show on main page
  }
);

// In modal JSX
{modalError && (
  <Alert severity="error" sx={{ mb: 3 }}>
    <Typography variant="body2">
      <strong>Error:</strong> {modalError}
    </Typography>
  </Alert>
)}

{modalSuccess && (
  <Alert severity="success" sx={{ mb: 3 }}>
    <Typography variant="body2">
      <strong>Success:</strong> {modalSuccess}
    </Typography>
  </Alert>
)}
```

### Pattern 3: Simple Transaction
```typescript
await transactionHandler.execute(
  async () => {
    const pin = await getPin('Enter PIN', bankAPI);
    await bankAPI.someOperation(pin, data);
  },
  'operation name'
);
```

### Pattern 2: Custom Success Handling
```typescript
await transactionHandler.execute(
  async () => {
    const pin = await getPin('Enter PIN', bankAPI);
    const result = await bankAPI.someOperation(pin, data);
    return result;
  },
  'operation name',
  {
    onSuccess: (result) => {
      setCustomState(result);
      // Custom success logic
    }
  }
);
```

### Pattern 3: Custom Error Handling
```typescript
await transactionHandler.execute(
  async () => {
    // operation
  },
  'operation name',
  {
    onError: (error) => {
      if (error.type === 'authorization') {
        // Handle auth errors specially
        redirectToAuth();
      }
    }
  }
);
```

## Component Integration

### Required State Variables
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

// Initialize handler
const transactionHandler = useTransactionHandler(setLoading, setError, setSuccess);
```

### UI Error/Success Display
```typescript
{error && (
  <Alert severity="error" sx={{ mb: 2 }}>
    {error}
  </Alert>
)}

{success && (
  <Alert severity="success" sx={{ mb: 2 }}>
    {success}
  </Alert>
)}
```

## Migration Checklist

### For Each Component:
- [ ] Import `useTransactionHandler`
- [ ] Add `setSuccess` state if missing
- [ ] Initialize transaction handler
- [ ] Replace try-catch blocks with `transactionHandler.execute()`
- [ ] Add success/error UI display
- [ ] Test all transaction paths

### Components to Update:
- [ ] `AuthorizationPanel.tsx` - request, approve, send functions
- [ ] `AuthorizationNotifications.tsx` - approve, claim functions
- [ ] `DisclosurePanel.tsx` - grant, verify, revoke functions
- [ ] `BankDetails.tsx` - account creation
- [ ] `JoinBank.tsx` - bank joining

## Error Categories

The system automatically categorizes errors:

| Type | Examples | User Message |
|------|----------|--------------|
| `pin` | "Invalid PIN", "Authentication failed" | "Invalid PIN. Please check your PIN and try again." |
| `balance` | "Insufficient funds", "Invalid amount" | "Insufficient funds or invalid amount." |
| `authorization` | "Not authorized", "Permission denied" | "You do not have permission for this operation." |
| `network` | "Connection failed", "Timeout" | "Network connection error. Please try again." |
| `validation` | "Invalid format", "Required field" | "Invalid input. Please check your data." |
| `unknown` | Anything else | "An unexpected error occurred during [operation]." |

## Advanced Usage

### Custom Error Parsing
```typescript
import { parseTransactionError } from '../utils/errorHandler';

const error = parseTransactionError(rawError, 'custom operation');
console.log(error.type, error.userMessage);
```

### Direct Handler Usage
```typescript
import { handleTransactionOperation } from '../utils/errorHandler';

await handleTransactionOperation(
  async () => { /* operation */ },
  'operation name',
  {
    setLoading,
    setError,
    setSuccess,
    onSuccess: (result) => { /* custom logic */ }
  }
);
```

## Benefits Summary

✅ **User Experience**
- Clear, actionable error messages
- Consistent success feedback
- Professional transaction handling

✅ **Developer Experience**  
- Reduced boilerplate code
- Consistent patterns across app
- Easy to maintain and debug

✅ **Maintenance**
- Centralized error logic
- Easy to add new error types
- Consistent logging and monitoring