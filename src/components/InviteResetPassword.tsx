import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

export default function InviteResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Invalid invitation link');
      setValidating(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/invite/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired invitation token');
        setValidating(false);
        setLoading(false);
        return;
      }

      setUserInfo(data);
      setValidating(false);
      setLoading(false);
    } catch (error: any) {
      setError('Failed to validate invitation token. Please try again.');
      setValidating(false);
      setLoading(false);
    }
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0) {
      setPasswordErrors(validatePassword(value));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      setError('Please fix the password requirements');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/auth/invite/${token}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setError('Failed to reset password. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-white text-xl">Validating invitation link...</div>
      </div>
    );
  }

  if (error && !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="text-red-600" size={64} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="text-green-600" size={64} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Password Reset Successful!</h2>
          <p className="text-gray-600 mb-6 text-center">
            Your password has been reset successfully. Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-main-100 p-4 rounded-full">
            <Lock className="text-main" size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Set Your Password</h2>
        <p className="text-gray-600 mb-6 text-center">
          Welcome, <span className="font-semibold">{userInfo?.name}</span>!
          <br />
          Please set a password for your account.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <ul className="mt-2 text-xs text-red-600 space-y-1">
                {passwordErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-2 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">Password Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>At least 6 characters</li>
              <li>At least one uppercase letter</li>
              <li>At least one lowercase letter</li>
              <li>At least one number</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting || passwordErrors.length > 0 || password !== confirmPassword}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-main hover:text-main-800"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

