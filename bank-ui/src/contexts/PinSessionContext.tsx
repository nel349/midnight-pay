import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Alert } from '@mui/material';
import { ThemedButton } from '../components/ThemedButton';

interface PinSessionContextType {
  getPin: (message?: string) => Promise<string>;
  clearSession: () => void;
  isSessionActive: () => boolean;
}

const PinSessionContext = createContext<PinSessionContextType | null>(null);

const PIN_SESSION_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface PinSessionProviderProps {
  children: React.ReactNode;
}

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

  const isSessionActive = useCallback((): boolean => {
    if (!cachedPin || !sessionExpiry) return false;
    return Date.now() < sessionExpiry;
  }, [cachedPin, sessionExpiry]);

  const clearSession = useCallback(() => {
    setCachedPin(null);
    setSessionExpiry(null);
  }, []);

  const getPin = useCallback(async (message?: string): Promise<string> => {
    // If we have a valid cached PIN, return it
    if (isSessionActive() && cachedPin) {
      return cachedPin;
    }

    // Clear expired session
    if (!isSessionActive()) {
      clearSession();
    }

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

      // Cache the PIN and set expiry
      setCachedPin(pinInput);
      setSessionExpiry(Date.now() + PIN_SESSION_DURATION);
      
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
            helperText="Your PIN will be cached securely for 10 minutes"
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