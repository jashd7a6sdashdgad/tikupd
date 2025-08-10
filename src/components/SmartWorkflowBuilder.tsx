'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModernCard } from '@/components/ui/ModernCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Zap,
  Play,
  Square,
  Mic,
  MicOff,
  Plus,
  Download,
  Upload,
  Settings,
  Trash2,
  Edit,
  Copy,
  Save,
  FileText,
  Calendar,
  Mail,
  DollarSign,
  Sun,
  MapPin,
  Clock,
  ArrowRight,
  GitBranch,
  Workflow,
  Brain,
  Sparkles,
  Volume2,
  Eye,
  Code,
  X,
  Globe
} from 'lucide-react';
import { WorkflowTemplate, WorkflowNode } from '@/lib/n8nMCP';

interface WorkflowBuilderProps {
  className?: string;
}

interface WorkflowCanvas {
  nodes: WorkflowNode[];
  connections: any[];
  scale: number;
  offset: { x: number; y: number };
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  productivity: Clock,
  automation: Zap,
  communication: Mail,
  finance: DollarSign,
  health: Calendar
};

const categoryColors: Record<string, string> = {
  productivity: 'from-blue-500 to-indigo-600',
  automation: 'from-purple-500 to-pink-600',
  communication: 'from-green-500 to-emerald-600',
  finance: 'from-amber-500 to-orange-600',
  health: 'from-red-500 to-pink-600'
};

export default function SmartWorkflowBuilder({ className }: WorkflowBuilderProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'templates' | 'builder' | 'voice'>('templates');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [workflowCanvas, setWorkflowCanvas] = useState<WorkflowCanvas>({
    nodes: [],
    connections: [],
    scale: 1,
    offset: { x: 0, y: 0 }
  });
  
  // Status and error handling
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load workflow templates
  useEffect(() => {
    loadWorkflowTemplates();
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadWorkflowTemplates = async () => {
    try {
      const response = await fetch('/api/workflows?action=templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Generate workflow from description
  const generateWorkflow = async () => {
    if (!customDescription.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          description: customDescription,
          context: {
            userPreferences: {
              language: 'en',
              timezone: 'UTC'
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedWorkflow(result.data);
        setWorkflowCanvas({
          nodes: result.data.nodes,
          connections: result.data.connections,
          scale: 1,
          offset: { x: 0, y: 0 }
        });
        setActiveTab('builder');
      } else {
        console.error('Failed to generate workflow:', result.message);
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save workflow to local storage
  const saveWorkflow = async (workflow?: WorkflowTemplate) => {
    const workflowToSave = workflow || generatedWorkflow || selectedTemplate;
    if (!workflowToSave) {
      setError('No workflow to save');
      return;
    }
    
    try {
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      const updatedWorkflows = [...savedWorkflows, {
        ...workflowToSave,
        savedAt: new Date().toISOString()
      }];
      
      localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
      setStatus('✅ Workflow saved locally!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      setError('Failed to save workflow');
    }
  };

  // Export workflow as JSON
  const exportWorkflow = (workflow?: WorkflowTemplate) => {
    const workflowToExport = workflow || generatedWorkflow || selectedTemplate;
    if (!workflowToExport) {
      setError('No workflow to export');
      return;
    }
    
    try {
      const dataStr = JSON.stringify(workflowToExport, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${workflowToExport.name.replace(/\s+/g, '-').toLowerCase()}-workflow.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setStatus('✅ Workflow exported successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error: any) {
      console.error('Error exporting workflow:', error);
      setError('Failed to export workflow');
    }
  };

  // Create workflow in N8N
  const createWorkflowInN8N = async (workflow: WorkflowTemplate) => {
    try {
      console.log(`🚀 Deploying workflow "${workflow.name}" to N8N...`);
      setStatus('🔧 Deploying workflow to N8N...');
      setError('');
      
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          workflow: workflow
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Workflow created in N8N:', result.data);
        setStatus(`✅ Workflow "${workflow.name}" deployed to N8N successfully!`);
        setTimeout(() => setStatus(''), 5000);
      } else {
        console.error('Failed to create workflow:', result.message);
        
        // Show specific error message from the API
        const errorMessage = result.message || 'Failed to deploy workflow to N8N';
        setError(`❌ Deployment failed: ${errorMessage}`);
        
        // Provide helpful suggestions based on error type
        if (errorMessage.includes('N8N configuration')) {
          setError('❌ N8N is not configured. Please check your N8N_API_URL and N8N_API_KEY environment variables.');
        } else if (errorMessage.includes('connect')) {
          setError('❌ Cannot connect to N8N. Please ensure N8N is running and accessible.');
        } else {
          setError(`❌ Deployment failed: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('❌ Network error: Unable to communicate with N8N service. Please check your connection.');
    }
  };

  // Voice command execution
  const executeVoiceCommand = async (command: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute-voice',
          voiceCommand: command,
          conditions: {
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Voice command executed:', result.data);
      } else {
        console.error('Failed to execute voice command:', result.message);
      }
    } catch (error) {
      console.error('Error executing voice command:', error);
    }
  };

  // Mock deployment for development/testing
  const mockDeploy = async () => {
    const workflowToMock = selectedTemplate || generatedWorkflow;
    if (!workflowToMock) {
      setError('No workflow selected for mock deployment');
      return;
    }

    try {
      setStatus('🔧 Running mock deployment...');
      setError('');
      
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock result
      const mockResult = {
        id: `mock_${workflowToMock.id}_${Date.now()}`,
        name: workflowToMock.name,
        active: true,
        webhookUrl: `https://mock-n8n.example.com/webhook/${workflowToMock.id}`,
        nodes: workflowToMock.nodes.length,
        connections: workflowToMock.connections.length
      };
      
      console.log('✅ Mock deployment completed:', mockResult);
      setStatus(`✅ Mock deployment successful! Workflow "${workflowToMock.name}" would be deployed with ${mockResult.nodes} nodes and ${mockResult.connections} connections.`);
      
      // Save to local storage as a "deployed" workflow
      try {
        const deployedWorkflows = JSON.parse(localStorage.getItem('mockDeployedWorkflows') || '[]');
        const updatedDeployed = [...deployedWorkflows, {
          ...mockResult,
          originalWorkflow: workflowToMock,
          deployedAt: new Date().toISOString()
        }];
        localStorage.setItem('mockDeployedWorkflows', JSON.stringify(updatedDeployed));
      } catch (storageError) {
        console.warn('Failed to save mock deployment to localStorage:', storageError);
      }
      
      setTimeout(() => setStatus(''), 8000);
    } catch (error) {
      console.error('Mock deployment error:', error);
      setError('Mock deployment failed. Please try again.');
    }
  };

  // Voice recording functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Process voice command (would need speech-to-text)
        processVoiceCommand(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceCommand = async (audioBlob: Blob) => {
    // This would integrate with speech-to-text service
    // For now, we'll simulate with a sample command
    const sampleCommand = "Create a workflow to track my daily expenses";
    await executeVoiceCommand(sampleCommand);
  };

  const renderTemplateCard = (template: WorkflowTemplate) => {
    const IconComponent = categoryIcons[template.category] || Clock;
    const colorClass = categoryColors[template.category] || 'from-gray-500 to-gray-600';

    return (
      <ModernCard
        key={template.id}
        gradient="none"
        blur="md"
        className="cursor-pointer transition-all duration-300 hover:scale-105"
        onClick={() => setSelectedTemplate(template)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${colorClass} rounded-xl shadow-lg`}>
              <IconComponent className="h-6 w-6 text-black font-bold" />
            </div>
            <Badge variant="secondary" className="capitalize">
              {template.category}
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {template.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Workflow className="h-3 w-3" />
              {template.nodes.length} nodes
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                setWorkflowCanvas({
                  nodes: template.nodes,
                  connections: template.connections,
                  scale: 1,
                  offset: { x: 0, y: 0 }
                });
                setActiveTab('builder');
              }}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  exportWorkflow(template);
                }} className="hover:bg-green-50">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Button size="sm" onClick={(e) => {
                  e.stopPropagation();
                  createWorkflowInN8N(template);
                }} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-bold">
                  <Play className="h-3 w-3 mr-1" />
                  Deploy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ModernCard>
    );
  };

  const renderWorkflowCanvas = () => {
    return (
      <div className="relative w-full h-96 bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {workflowCanvas.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Workflow Loaded</h3>
              <p className="text-sm text-gray-500">Select a template or generate a new workflow</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full p-4">
            {workflowCanvas.nodes.map((node, index) => (
              <div
                key={node.id}
                className="absolute bg-white border-2 border-blue-200 rounded-lg p-3 shadow-md min-w-32 cursor-move hover:border-blue-400 transition-colors"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: `scale(${workflowCanvas.scale})`
                }}
              >
                <div className="text-xs font-medium text-gray-700 mb-1">
                  {node.name}
                </div>
                <div className="text-xs text-gray-500">
                  {node.type.split('.').pop()}
                </div>
              </div>
            ))}
            
            {/* Render connections */}
            <svg className="absolute inset-0 pointer-events-none">
              {workflowCanvas.connections.map((connection, index) => {
                const sourceNode = workflowCanvas.nodes.find(n => n.id === connection.sourceNode);
                const targetNode = workflowCanvas.nodes.find(n => n.id === connection.targetNode);
                
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <line
                    key={index}
                    x1={sourceNode.position.x + 64}
                    y1={sourceNode.position.y + 25}
                    x2={targetNode.position.x}
                    y2={targetNode.position.y + 25}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                </marker>
              </defs>
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('smart-workflow-builder', className)}>
      {/* Status Messages */}
      {status && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700">
          {status}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
          {(error.includes('N8N configuration') || error.includes('N8N is not configured')) && (
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => setShowSetupGuide(true)}
                size="sm"
                variant="outline"
                className="bg-white hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Show N8N Setup Guide
              </Button>
              <Button
                onClick={() => mockDeploy()}
                size="sm"
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-600"
              >
                <Code className="h-4 w-4 mr-2" />
                Try Mock Deploy
              </Button>
            </div>
          )}
        </div>
      )}

      {/* N8N Setup Guide Modal */}
      {showSetupGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">N8N Setup Guide</h2>
                <Button onClick={() => setShowSetupGuide(false)} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">🚀 Quick Setup</h3>
                  <p className="text-blue-700">
                    To connect your personal assistant with N8N, you need to set up environment variables in your deployment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-600" />
                        Environment Variables
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">N8N_API_URL</h4>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                          https://your-n8n-instance.com
                        </code>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">N8N_API_KEY</h4>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                          your-n8n-api-key-here
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-purple-600" />
                        N8N Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-2">
                        <p>1. Enable API access in N8N settings</p>
                        <p>2. Generate an API key in N8N</p>
                        <p>3. Set your N8N instance URL</p>
                        <p>4. Restart your application</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Development Mode</h3>
                  <p className="text-yellow-700 text-sm">
                    If you're running in development mode, you can test workflows without N8N by using the mock mode. 
                    Real deployment requires a running N8N instance.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">📚 Learn More</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Need help setting up N8N? Check out these resources:
                  </p>
                  <div className="space-y-1 text-sm">
                    <a href="https://docs.n8n.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                      • N8N Official Documentation
                    </a>
                    <a href="https://docs.n8n.io/api/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                      • N8N API Documentation
                    </a>
                    <a href="https://community.n8n.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                      • N8N Community Forum
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button onClick={() => setShowSetupGuide(false)}>
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <ModernCard gradient="blue" blur="lg" className="mb-8">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <Brain className="h-8 w-8 text-black font-bold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Smart Workflow Builder</h1>
              <p className="text-gray-600">Create, manage, and automate your workflows with AI assistance</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'templates' as const, label: 'Templates', icon: FileText },
              { id: 'builder' as const, label: 'Visual Builder', icon: Workflow },
              { id: 'voice' as const, label: 'Voice Control', icon: Mic }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'outline'}
                className={cn(
                  'flex items-center gap-2',
                  activeTab === tab.id && 'bg-gradient-to-r from-purple-500 to-indigo-600'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </ModernCard>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Generate Custom Workflow */}
          <ModernCard gradient="purple" blur="lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-800">Generate Custom Workflow</h2>
              </div>
              
              <div className="flex gap-3">
                <Input
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe your workflow (e.g., 'Send me a daily summary of unread emails')"
                  className="flex-1"
                />
                <Button 
                  onClick={generateWorkflow}
                  disabled={!customDescription.trim() || isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </div>
          </ModernCard>

          {/* Pre-built Templates */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pre-built Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(renderTemplateCard)}
            </div>
          </div>
        </div>
      )}

      {/* Visual Builder Tab */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Workflow Canvas */}
          <ModernCard gradient="none" blur="lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Visual Workflow Editor</h2>
                <div className="flex gap-2">
                  {(generatedWorkflow || selectedTemplate) && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => saveWorkflow(generatedWorkflow || selectedTemplate!)}
                        className="hover:bg-blue-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportWorkflow(generatedWorkflow || selectedTemplate!)}
                        className="hover:bg-green-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-bold"
                        onClick={() => createWorkflowInN8N(generatedWorkflow || selectedTemplate!)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Deploy to N8N
                      </Button>
                    </>
                  )}
                  {!generatedWorkflow && !selectedTemplate && (
                    <div className="text-sm text-gray-500 italic py-2">
                      Generate or select a workflow to enable export options
                    </div>
                  )}
                </div>
              </div>
              
              {renderWorkflowCanvas()}
            </div>
          </ModernCard>

          {/* Workflow Details */}
          {(generatedWorkflow || selectedTemplate) && (
            <ModernCard gradient="green" blur="lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {(generatedWorkflow || selectedTemplate)?.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {(generatedWorkflow || selectedTemplate)?.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {(generatedWorkflow || selectedTemplate)?.nodes.length}
                    </div>
                    <div className="text-sm text-gray-500">Nodes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {(generatedWorkflow || selectedTemplate)?.connections.length}
                    </div>
                    <div className="text-sm text-gray-500">Connections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {(generatedWorkflow || selectedTemplate)?.trigger.type}
                    </div>
                    <div className="text-sm text-gray-500">Trigger</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {(generatedWorkflow || selectedTemplate)?.category}
                    </div>
                    <div className="text-sm text-gray-500">Category</div>
                  </div>
                </div>
              </div>
            </ModernCard>
          )}
        </div>
      )}

      {/* Voice Control Tab */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          <ModernCard gradient="orange" blur="lg">
            <div className="p-6 text-center">
              <div className="mb-6">
                <div className={cn(
                  'w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300',
                  isRecording 
                    ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse scale-110' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:scale-105'
                )}>
                  {isRecording ? (
                    <MicOff className="h-8 w-8 text-black font-bold" />
                  ) : (
                    <Mic className="h-8 w-8 text-black font-bold" />
                  )}
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Voice Workflow Control</h2>
              <p className="text-gray-600 mb-6">
                {isRecording 
                  ? 'Listening for your workflow command...' 
                  : 'Tap to start voice control for your workflows'
                }
              </p>
              
              <Button
                size="lg"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={cn(
                  'text-black font-bold font-semibold px-8 py-3',
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                )}
              >
                {isRecording ? 'Stop Recording' : 'Start Voice Control'}
              </Button>
            </div>
          </ModernCard>

          {/* Voice Commands Help */}
          <ModernCard gradient="none" blur="lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice Commands</h3>
              <div className="space-y-3">
                {[
                  'Create a workflow to track my expenses',
                  'Run my morning routine workflow',
                  'Set up email summarization',
                  'Start expense tracking workflow',
                  'Show me my calendar for today'
                ].map((command, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Volume2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">"{command}"</span>
                  </div>
                ))}
              </div>
            </div>
          </ModernCard>
        </div>
      )}
    </div>
  );
}