import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, XCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
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
      setError('Invalid password reset link');
      setValidating(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/reset-password/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired password reset token');
        setValidating(false);
        setLoading(false);
        return;
      }

      setUserInfo(data);
      setValidating(false);
      setLoading(false);
    } catch (error: any) {
      setError('Failed to validate password reset link. Please try again.');
      setValidating(false);
      setLoading(false);
    }
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (pwd.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    return errors;
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
        `${import.meta.env.VITE_API_URL || '/api'}/auth/reset-password/${token}`,
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

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      setError('Failed to reset password. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl">Validating password reset link...</div>
      </div>
    );
  }

  if (error && !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-2xl max-w-md w-full text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <XCircle className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-main hover:text-main-700 font-semibold text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-2xl max-w-md w-full text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You will be redirected to the login page shortly.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-main hover:text-main-700 font-semibold text-sm transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-2xl max-w-md w-full">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Enter your new password for <strong>{userInfo?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-900 font-semibold mb-2 text-sm">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordErrors(validatePassword(e.target.value));
                }}
                required
                className="w-full px-4 py-3 pr-10 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-gray-500" />
                ) : (
                  <Eye size={18} className="text-gray-500" />
                )}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <ul className="mt-2 text-xs text-blue-600 list-disc list-inside">
                {passwordErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-gray-900 font-semibold mb-2 text-sm">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} className="text-gray-500" />
                ) : (
                  <Eye size={18} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-2.5 rounded-lg flex items-center gap-2">
              <span className="text-blue-600">⚠</span>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || passwordErrors.length > 0}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <Lock size={18} />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

