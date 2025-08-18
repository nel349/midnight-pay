import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Alert } from '@mui/material';
import { ThemedButton } from '../components/ThemedButton';

interface PinSessionContextType {
  getPin: (message?: string, bankAPI?: any) => Promise<string>;
  clearSession: () => void;
  isSessionActive: () => boolean;
}

interface PinSessionProviderProps {
  children: React.ReactNode;
}

const PinSessionContext = createContext<PinSessionContextType | null>(null);

const PIN_SESSION_DURATION_MINUTES = 20;
const PIN_SESSION_DURATION = PIN_SESSION_DURATION_MINUTES * 60 * 1000; // 10 minutes in milliseconds
const STORAGE_KEY = 'midnight-bank-pin-session';

// Simple XOR encryption for PIN storage (browser-only security)
const encryptPin = (pin: string, key: string): string => {
  const combined = pin + '|' + Date.now().toString();
  let result = '';
  for (let i = 0; i < combined.length; i++) {
    result += String.fromCharCode(combined.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
};

const decryptPin = (encrypted: string, key: string): { pin: string; timestamp: number } | null => {
  try {
    const decoded = atob(encrypted);
    let combined = '';
    for (let i = 0; i < decoded.length; i++) {
      combined += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    const parts = combined.split('|');
    if (parts.length !== 2) return null;
    return { pin: parts[0], timestamp: parseInt(parts[1]) };
  } catch {
    return null;
  }
};

// Generate a session-specific encryption key based on browser fingerprint
const getSessionKey = (): string => {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    window.location.origin
  ].join('|');
  
  // Simple hash function for browser-side key derivation
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'session-' + Math.abs(hash).toString(36);
};

export const PinSessionProvider: React.FC<PinSessionProviderProps> = ({ children }) => {
  const [cachedPin, setCachedPin] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pinPromiseRef = useRef<{
    resolve: (pin: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const currentBankAPIRef = useRef<any>(null);

  const isSessionActive = useCallback((): boolean => {
    if (!cachedPin || !sessionExpiry) return false;
    return Date.now() < sessionExpiry;
  }, [cachedPin, sessionExpiry]);

  // Storage management functions
  const saveToStorage = useCallback((pin: string, expiry: number) => {
    try {
      const sessionKey = getSessionKey();
      const encrypted = encryptPin(pin, sessionKey);
      const sessionData = {
        encrypted,
        expiry
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save PIN session to storage:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): { pin: string; expiry: number } | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const sessionData = JSON.parse(stored);
      if (!sessionData.encrypted || !sessionData.expiry) return null;
      
      const sessionKey = getSessionKey();
      const decrypted = decryptPin(sessionData.encrypted, sessionKey);
      if (!decrypted) return null;
      
      // Check if session is still valid
      if (Date.now() >= sessionData.expiry) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return { pin: decrypted.pin, expiry: sessionData.expiry };
    } catch (error) {
      console.warn('Failed to load PIN session from storage:', error);
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  const clearSession = useCallback(() => {
    setCachedPin(null);
    setSessionExpiry(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear PIN session storage:', error);
    }
  }, []);

  // Initialize from storage on component mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setCachedPin(stored.pin);
      setSessionExpiry(stored.expiry);
    }
  }, [loadFromStorage]);

  const getPin = useCallback(async (message?: string, bankAPI?: any): Promise<string> => {
    // If we have a valid cached PIN, return it immediately (no validation needed)
    if (isSessionActive() && cachedPin) {
      return cachedPin;
    }

    // Clear expired session
    if (!isSessionActive()) {
      clearSession();
    }

    // Store bankAPI reference for validation (only for new PIN entry)
    currentBankAPIRef.current = bankAPI;

    // Show PIN dialog and wait for user input
    return new Promise((resolve, reject) => {
      pinPromiseRef.current = { resolve, reject };
      setDialogMessage(message || 'Enter your PIN to continue');
      setPinInput('');
      setPinError(null);
      setShowDialog(true);
    });
  }, [cachedPin, isSessionActive, clearSession]);

  const handleDialogSubmit = async () => {
    if (!pinInput.trim()) {
      setPinError('PIN is required');
      return;
    }

    try {
      setLoading(true);
      setPinError(null);

      // Validate PIN if bankAPI is available
      if (currentBankAPIRef.current) {
        try {
          await currentBankAPIRef.current.verifyAccountStatus(pinInput);
        } catch (error) {
          setPinError('Incorrect PIN. Please try again.');
          return;
        }
      }

      const expiry = Date.now() + PIN_SESSION_DURATION;
      
      // Cache the PIN and set expiry
      setCachedPin(pinInput);
      setSessionExpiry(expiry);
      
      // Save to encrypted storage for persistence
      saveToStorage(pinInput, expiry);
      
      // Close dialog and resolve promise
      setShowDialog(false);
      setPinInput('');
      
      if (pinPromiseRef.current) {
        pinPromiseRef.current.resolve(pinInput);
        pinPromiseRef.current = null;
      }
    } catch (error) {
      setPinError('Failed to validate PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
    setPinInput('');
    setPinError(null);
    
    if (pinPromiseRef.current) {
      pinPromiseRef.current.reject(new Error('PIN entry cancelled'));
      pinPromiseRef.current = null;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleDialogSubmit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleDialogCancel();
    }
  };

  return (
    <PinSessionContext.Provider value={{ getPin, clearSession, isSessionActive }}>
      {children}
      
      {/* PIN Input Dialog */}
      <Dialog 
        open={showDialog} 
        onClose={handleDialogCancel}
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={false}
      >
        <DialogTitle>
          PIN Required
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {dialogMessage}
          </Typography>
          
          {pinError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {pinError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            label="PIN"
            type="password"
            fullWidth
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your PIN"
            helperText={`Your PIN will be stored securely for ${PIN_SESSION_DURATION_MINUTES} minutes`}
            disabled={loading}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <ThemedButton
            variant="outlined"
            onClick={handleDialogCancel}
            disabled={loading}
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            variant="primary"
            onClick={handleDialogSubmit}
            disabled={loading || !pinInput.trim()}
          >
            {loading ? 'Validating...' : 'Confirm'}
          </ThemedButton>
        </DialogActions>
      </Dialog>
    </PinSessionContext.Provider>
  );
};

export const usePinSession = (): PinSessionContextType => {
  const context = useContext(PinSessionContext);
  if (!context) {
    throw new Error('usePinSession must be used within a PinSessionProvider');
  }
  return context;
};