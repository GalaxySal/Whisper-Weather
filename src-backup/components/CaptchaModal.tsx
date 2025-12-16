import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { authService } from '@/services/auth';

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  email: string;
}

export const CaptchaModal: React.FC<CaptchaModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [captchaToken, setCaptchaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load hCaptcha script
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.async = true;
      script.onload = () => {
        // hCaptcha loaded
        console.log('hCaptcha loaded');
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (!captchaToken) {
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await authService.verifyCaptcha(captchaToken);
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        console.error('CAPTCHA verification failed');
      }
    } catch (error) {
      console.error('CAPTCHA error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaCallback = (token: string) => {
    setCaptchaToken(token);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold">Security Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          For your security, please complete this verification to continue.
        </p>

        {/* hCaptcha Widget */}
        <div className="mb-4">
          <div
            className="h-captcha"
            data-sitekey="YOUR_HCAPTCHA_SITE_KEY"
            data-callback={handleCaptchaCallback}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!captchaToken || isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};
