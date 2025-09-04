
import React, { useState } from 'react';
import { X, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed: () => void;
}

const SubscriptionModal = ({ isOpen, onClose, onSubscribed }: SubscriptionModalProps) => {
  const { signInWithGoogle, signInWithPhone, verifyOtp, updateSubscriptionStatus } = useAuth();
  const [authMethod, setAuthMethod] = useState<'choose' | 'phone' | 'otp'>('choose');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      await updateSubscriptionStatus('subscribed');
      toast.success('Successfully subscribed!');
      onSubscribed();
      onClose();
    } catch (error) {
      toast.error('Failed to sign in with Google');
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithPhone(phoneNumber);
      setAuthMethod('otp');
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error('Failed to send OTP');
      console.error('Phone sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(phoneNumber, otp);
      await updateSubscriptionStatus('subscribed');
      toast.success('Successfully subscribed!');
      onSubscribed();
      onClose();
    } catch (error) {
      toast.error('Invalid OTP');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setAuthMethod('choose');
    setPhoneNumber('');
    setOtp('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Subscribe to Stay Connected
          </h2>
          <p className="text-gray-600">
            Get unlimited access to all news and remove ads
          </p>
        </div>

        {authMethod === 'choose' && (
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button
              onClick={() => setAuthMethod('phone')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Continue with Phone
            </Button>
          </div>
        )}

        {authMethod === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setAuthMethod('choose')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handlePhoneSignIn}
                disabled={isLoading}
                className="flex-1"
              >
                Send OTP
              </Button>
            </div>
          </div>
        )}

        {authMethod === 'otp' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
              
              <div className="flex justify-center mb-4">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setAuthMethod('phone')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleOtpVerification}
                disabled={isLoading || otp.length !== 6}
                className="flex-1"
              >
                Verify & Subscribe
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
