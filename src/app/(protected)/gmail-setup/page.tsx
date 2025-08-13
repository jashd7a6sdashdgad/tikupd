'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

export default function GmailSetupPage() {
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    hasGmailScope: boolean;
    userEmail?: string;
    tokenExpiry?: string;
    scopes?: string;
  }>({ isAuthenticated: false, hasGmailScope: false });
  const [checking, setChecking] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setChecking(true);
    try {
      // Check current authentication status
      const response = await fetch('/api/gmail/messages');
      const data = await response.json();
      
      if (data.success && data.data) {
        setAuthStatus({
          isAuthenticated: true,
          hasGmailScope: true,
          userEmail: 'Connected',
          scopes: 'Gmail access granted'
        });
      } else {
        setAuthStatus({
          isAuthenticated: false,
          hasGmailScope: false
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus({
        isAuthenticated: false,
        hasGmailScope: false
      });
    } finally {
      setChecking(false);
    }
  };

  const testGmailConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/gmail/messages');
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Gmail connection successful! Found ${data.data.total || 0} emails.`);
      } else {
        alert(`❌ Gmail connection failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`❌ Gmail connection failed: ${error}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const initiateGoogleAuth = () => {
    window.open('/api/auth/google', '_self');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Gmail Setup
              </h1>
              <p className="text-gray-600 font-medium mt-1">Connect your Gmail account for real email access</p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {checking ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : authStatus.isAuthenticated ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Gmail Connection Status
            </CardTitle>
            <CardDescription>
              Current authentication status for your Gmail account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentication:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    authStatus.isAuthenticated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {authStatus.isAuthenticated ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gmail Access:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    authStatus.hasGmailScope ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {authStatus.hasGmailScope ? 'Granted' : 'Required'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {authStatus.userEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account:</span>
                    <span className="text-sm text-gray-600">{authStatus.userEmail}</span>
                  </div>
                )}
                
                {authStatus.scopes && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Permissions:</span>
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={checkAuthStatus}
                variant="outline"
                disabled={checking}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
              
              {authStatus.isAuthenticated ? (
                <Button 
                  onClick={testGmailConnection}
                  disabled={testingConnection}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {testingConnection ? 'Testing...' : 'Test Gmail Connection'}
                </Button>
              ) : (
                <Button 
                  onClick={initiateGoogleAuth}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to connect your Gmail account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium">Click "Connect Gmail Account"</h4>
                  <p className="text-sm text-gray-600">This will redirect you to Google's OAuth consent screen</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium">Sign in to your Google account</h4>
                  <p className="text-sm text-gray-600">Use the Gmail account you want to connect</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium">Grant permissions</h4>
                  <p className="text-sm text-gray-600">Allow access to read, compose, and send emails</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <div>
                  <h4 className="font-medium">You're connected!</h4>
                  <p className="text-sm text-gray-600">Your real emails will now appear in the email page</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Info */}
        <Card>
          <CardHeader>
            <CardTitle>Required Permissions</CardTitle>
            <CardDescription>
              Here's what permissions we need and why
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Read emails</h4>
                    <p className="text-sm text-gray-600">View your inbox and email content</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Send emails</h4>
                    <p className="text-sm text-gray-600">Compose and send emails on your behalf</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Manage labels</h4>
                    <p className="text-sm text-gray-600">Organize emails with labels and folders</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Email metadata</h4>
                    <p className="text-sm text-gray-600">Access email headers and properties</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Privacy Note:</strong> Your email data is only accessed when you use the email features. 
                We don't store or share your emails - they're processed in real-time through Google's secure APIs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button 
            onClick={() => window.open('/email', '_self')}
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Email Page
          </Button>
          
          <Button 
            onClick={() => window.open('/dashboard', '_self')}
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}