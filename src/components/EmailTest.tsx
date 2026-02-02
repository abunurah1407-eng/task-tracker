import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Send, CheckCircle, XCircle, ArrowLeft, Loader } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type EmailTemplate = 'invitation' | 'password-reset' | 'weekly-reminder' | 'follow-up' | 'task-assigned';

interface TemplateInfo {
  name: string;
  description: string;
  icon: typeof Mail;
}

const templates: Record<EmailTemplate, TemplateInfo> = {
  invitation: {
    name: 'Invitation Email',
    description: 'Test the account invitation email template',
    icon: Mail,
  },
  'password-reset': {
    name: 'Password Reset Email',
    description: 'Test the password reset email template',
    icon: Mail,
  },
  'weekly-reminder': {
    name: 'Weekly Reminder Email',
    description: 'Test the weekly task reminder email template',
    icon: Mail,
  },
  'follow-up': {
    name: 'Follow-up Email',
    description: 'Test the task follow-up email template',
    icon: Mail,
  },
  'task-assigned': {
    name: 'Task Assigned Email',
    description: 'Test the task assignment notification email template',
    icon: Mail,
  },
};

export default function EmailTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('invitation');
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; invitationLink?: string; resetLink?: string } | null>(null);

  // Only allow admin access
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only administrators can access this page.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.testEmailTemplate(selectedTemplate, testEmail);
      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to send test email',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Email Template Testing</h1>
              <p className="text-gray-600">Test all email templates by sending them to a test email address</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Template</h2>
              <div className="space-y-2">
                {(Object.keys(templates) as EmailTemplate[]).map((template) => {
                  const templateInfo = templates[template];
                  const Icon = templateInfo.icon;
                  const isSelected = selectedTemplate === template;
                  
                  return (
                    <button
                      key={template}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setResult(null);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-main bg-main-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={20}
                          className={isSelected ? 'text-main' : 'text-gray-500'}
                        />
                        <div>
                          <div className={`font-semibold ${isSelected ? 'text-main' : 'text-gray-900'}`}>
                            {templateInfo.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {templateInfo.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Test Form and Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Test Email</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Email Address *
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                    placeholder="test@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The test email will be sent to this address
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        Testing: {templates[selectedTemplate].name}
                      </h3>
                      <p className="text-sm text-blue-700">
                        {templates[selectedTemplate].description}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTest}
                  disabled={loading || !testEmail}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-main text-white font-semibold rounded-lg hover:bg-main-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Sending Test Email...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>

                {result && (
                  <div
                    className={`rounded-lg p-4 border-2 ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3
                          className={`font-semibold mb-1 ${
                            result.success ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          {result.success ? 'Email Sent Successfully!' : 'Email Failed'}
                        </h3>
                        <p
                          className={`text-sm ${
                            result.success ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {result.message}
                        </p>
                        {result.invitationLink && (
                          <div className="mt-3 p-3 bg-white rounded border border-green-200">
                            <p className="text-xs text-gray-600 mb-1">Invitation Link:</p>
                            <p className="text-xs font-mono text-gray-800 break-all">
                              {result.invitationLink}
                            </p>
                          </div>
                        )}
                        {result.resetLink && (
                          <div className="mt-3 p-3 bg-white rounded border border-green-200">
                            <p className="text-xs text-gray-600 mb-1">Reset Link:</p>
                            <p className="text-xs font-mono text-gray-800 break-all">
                              {result.resetLink}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

