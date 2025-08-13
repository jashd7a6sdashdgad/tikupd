'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/lib/translations';
import { 
  Mail, 
  Send, 
  Inbox, 
  Search, 
  Mic,
  RefreshCw,
  User,
  Trash2,
  Brain,
  Sparkles,
  Tag,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { emailIntelligence, EmailMessage as SmartEmailMessage } from '@/lib/emailIntelligence';
import EmailTemplatesPanel from '@/components/EmailTemplatesPanel';

interface EmailMessage {
  id: string;
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
  };
  // AI-enhanced properties
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  category?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiSummary?: string;
  suggestedActions?: string[];
  isSpam?: boolean;
  confidence?: number;
}

export default function EmailPage() {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Compose form fields
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | undefined>(undefined);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [smartMessages, setSmartMessages] = useState<EmailMessage[]>([]);

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript, 
    isSupported 
  } = useVoiceInput();

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (transcript && !isListening) {
      // Parse voice input for email composition
      parseVoiceEmail(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/gmail/messages${query}`);
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setMessages([]);
          setSmartMessages([]);
          return;
        }
      }
      
      if (data.success) {
        const rawMessages = Array.isArray(data.data) ? data.data : [];
        if (rawMessages.length === 0) {
          console.log('📧 No emails found in your Gmail inbox');
        }
        // Apply AI intelligence to classify messages
        const enhancedMessages = rawMessages.map((msg: EmailMessage) => 
          emailIntelligence.classifyEmail(msg as SmartEmailMessage)
        );
        setMessages(enhancedMessages);
        setSmartMessages(enhancedMessages);
      } else {
        console.error('Failed to fetch messages:', data.message);
        // If authentication error, show re-auth prompt
        if (data.message?.includes('authentication') || data.error?.includes('authentication')) {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/gmail/unread-count');
      if (response.status === 401) {
        setUnreadCount(0);
        return;
      }
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const parseVoiceEmail = (voiceInput: string) => {
    const input = voiceInput.toLowerCase();
    
    // Try to parse "send email to [email] about [subject] saying [body]"
    const emailPattern = /send\s+(?:an?\s+)?email\s+to\s+(.+?)\s+(?:about\s+|with\s+subject\s+)(.+?)(?:\s+saying\s+(.+))?$/i;
    const match = input.match(emailPattern);
    
    if (match) {
      setEmailTo(match[1].trim());
      setEmailSubject(match[2].trim());
      if (match[3]) {
        setEmailBody(match[3].trim());
      }
      setShowCompose(true);
    } else {
      // Just fill in what we can understand
      if (input.includes('email')) {
        setShowCompose(true);
        setEmailBody(voiceInput);
      }
    }
  };

  const sendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      alert(t('name'));
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/gmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: emailBody
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        alert(t('send') + ' ' + t('email'));
        setShowCompose(false);
        setEmailTo('');
        setEmailSubject('');
        setEmailBody('');
        fetchMessages();
      } else {
        alert(t('settingsError') + ': ' + (data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(t('settingsError'));
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm(t('delete') + ' ' + t('message') + '?')) {
      return;
    }

    setDeleting(messageId);
    try {
      const response = await fetch('/api/gmail/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchMessages();
        await fetchUnreadCount();
      } else {
        alert(t('settingsError') + ': ' + (data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(t('settingsError'));
    } finally {
      setDeleting(null);
    }
  };

  const getHeaderValue = (headers: any[], name: string) => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityEmoji = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '😱'; // Shocked/urgent face
      case 'high': return '😰';    // Anxious face
      case 'medium': return '😐';  // Neutral face
      case 'low': return '😌';     // Relieved face
      default: return '😐';       // Default neutral
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Work': return 'bg-blue-100 text-blue-800';
      case 'Personal': return 'bg-green-100 text-green-800';
      case 'Financial': return 'bg-yellow-100 text-yellow-800';
      case 'Shopping': return 'bg-purple-100 text-purple-800';
      case 'Travel': return 'bg-red-100 text-red-800';
      case 'Medical': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTemplateSelect = (template: any) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setShowCompose(true);
    setShowTemplates(false);
  };

  const handleSendReply = (content: string) => {
    if (selectedEmail) {
      const replyTo = getHeaderValue(selectedEmail.payload.headers, 'From');
      const originalSubject = getHeaderValue(selectedEmail.payload.headers, 'Subject');
      setEmailTo(replyTo);
      setEmailSubject(`Re: ${originalSubject}`);
      setEmailBody(content);
      setShowCompose(true);
      setShowTemplates(false);
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Mail className="h-8 w-8 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {t('emailTitle')}
                </h1>
                <p className="text-gray-600 font-medium mt-1">{t('profileDescription')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Inbox className="h-4 w-4" />
                <span className="text-gray-700">{unreadCount} {t('unreadEmails')}</span>
              </div>
              <Button onClick={fetchMessages} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </Button>
              <Button 
                onClick={() => setShowAIInsights(!showAIInsights)} 
                variant="outline" 
                size="sm"
                className={showAIInsights ? 'bg-blue-50 text-blue-700' : ''}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
              </Button>
              <Button 
                onClick={() => setShowTemplates(!showTemplates)} 
                variant="outline" 
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => setShowCompose(true)}>
                <Mail className="h-4 w-4 mr-2" />
                {t('compose')}
              </Button>
            </div>
          </div>
        </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Insights Panel */}
        {showAIInsights && smartMessages.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Email Intelligence Insights
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your email patterns and priorities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">High Priority</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {smartMessages.filter(m => m.priority === 'high' || m.priority === 'urgent').length}
                  </p>
                  <p className="text-sm text-gray-600">emails need attention</p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Categories</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {new Set(smartMessages.map(m => m.category).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-gray-600">detected</p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Spam Detected</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {smartMessages.filter(m => m.isSpam).length}
                  </p>
                  <p className="text-sm text-gray-600">suspicious emails</p>
                </div>
              </div>
              {/* Quick actions based on AI analysis */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setMessages(messages.filter(m => m.priority === 'urgent' || m.priority === 'high'))}
                >
                  Show High Priority Only
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setMessages(messages.filter(m => !m.isSpam))}
                >
                  Hide Spam
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setMessages(smartMessages)}
                >
                  Show All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Panel */}
        {showTemplates && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <EmailTemplatesPanel 
                onTemplateSelect={handleTemplateSelect}
                selectedEmail={selectedEmail}
                onSendReply={handleSendReply}
              />
            </CardContent>
          </Card>
        )}
        {/* Voice Compose */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('voiceInput')}</CardTitle>
            <CardDescription>{t('voiceDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={isListening ? stopListening : startListening}
                className={isListening ? 'voice-active bg-accent text-accent-foreground' : ''}
                disabled={!isSupported}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isListening ? t('stopRecording') : t('compose')}
              </Button>
              {transcript && (
                <p className="text-sm text-black italic">"{transcript}"</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compose Email Form */}
        {showCompose && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                {t('compose')} {t('email')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('to')}</label>
                <Input
                  type="email"
                  placeholder={t('email')}
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject')}</label>
                <Input
                  placeholder={t('subject')}
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('message')}</label>
                <textarea
                  rows={6}
                  placeholder={t('message')}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={sendEmail}
                  disabled={!emailTo || !emailSubject || !emailBody || sending}
                  loading={sending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('send')} {t('email')}
                </Button>
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder={t('search') + ' ' + t('email') + '...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchMessages()}
                  className="text-black"
                />
              </div>
              <Button onClick={fetchMessages}>
                <Search className="h-4 w-4 mr-2" />
                {t('search')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Inbox className="h-5 w-5 mr-2" />
              {t('message')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => {
                  const from = getHeaderValue(message.payload.headers, 'From');
                  const subject = getHeaderValue(message.payload.headers, 'Subject');
                  const date = getHeaderValue(message.payload.headers, 'Date');
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`p-4 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                        message.isSpam ? 'bg-red-50 border border-red-200' : 
                        message.priority === 'urgent' ? 'bg-red-50 border-l-4 border-l-red-500' :
                        message.priority === 'high' ? 'bg-orange-50 border-l-4 border-l-orange-500' :
                        'bg-muted hover:bg-muted/80'
                      }`}
                      onClick={() => setSelectedEmail(message)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-black" />
                            <span className="font-medium text-black">{from}</span>
                            <span className="text-sm text-black">{formatDate(date)}</span>
                            {message.priority && (
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(message.priority)} flex items-center gap-1`}>
                                <span>{getPriorityEmoji(message.priority)}</span>
                                {message.priority.toUpperCase()}
                              </span>
                            )}
                            {message.sentiment && (
                              <span className="text-sm">
                                {getSentimentIcon(message.sentiment)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-black">{subject}</h4>
                            {message.category && (
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(message.category)}`}>
                                {message.category}
                              </span>
                            )}
                            {message.isSpam && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                SPAM
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-black line-clamp-2">
                            {message.aiSummary || message.snippet}
                          </p>
                          
                          {message.suggestedActions && message.suggestedActions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {message.suggestedActions.slice(0, 2).map((action, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  💡 {action}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmail(message);
                              setShowTemplates(true);
                            }}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            disabled={deleting === message.id}
                          >
                            <Trash2 className={`h-4 w-4 ${deleting === message.id ? 'animate-spin' : 'text-red-500'}`} />
                          </Button>
                        </div>
                      </div>
                      
                      {message.confidence && message.confidence < 0.7 && (
                        <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                          ⚠️ Low AI confidence ({Math.round(message.confidence * 100)}%) - please verify categorization
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-black">No emails to display</p>
                <p className="text-sm text-black mt-2">
                  {searchQuery ? 'Try adjusting your search.' : 'You can still use templates to compose emails.'}
                </p>
                <div className="flex gap-3 justify-center mt-6">
                  <Button 
                    onClick={() => setShowTemplates(true)}
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Email Templates
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  );
}