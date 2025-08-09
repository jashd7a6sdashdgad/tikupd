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
  Code
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

const categoryIcons = {
  productivity: Clock,
  automation: Zap,
  communication: Mail,
  finance: DollarSign,
  health: Calendar
};

const categoryColors = {
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
  
  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load workflow templates
  useEffect(() => {
    loadWorkflowTemplates();
  }, []);

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
        setStatus('✅ Workflow deployed to N8N successfully!');
        setTimeout(() => setStatus(''), 3000);
      } else {
        console.error('Failed to create workflow:', result.message);
        setError('Failed to deploy workflow to N8N');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('Error deploying workflow to N8N');
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
    const IconComponent = categoryIcons[template.category];
    const colorClass = categoryColors[template.category];

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
              <IconComponent className="h-6 w-6 text-white" />
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
              <Button size="sm" onClick={(e) => {
                e.stopPropagation();
                createWorkflowInN8N(template);
              }}>
                <Play className="h-3 w-3 mr-1" />
                Deploy
              </Button>
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
      {/* Header */}
      <ModernCard gradient="blue" blur="lg" className="mb-8">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Smart Workflow Builder</h1>
              <p className="text-gray-600">Create, manage, and automate your workflows with AI assistance</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'builder', label: 'Visual Builder', icon: Workflow },
              { id: 'voice', label: 'Voice Control', icon: Mic }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'outline'}
                className={cn(
                  'flex items-center gap-2',
                  activeTab === tab.id && 'bg-gradient-to-r from-purple-500 to-indigo-600'
                )}
                onClick={() => setActiveTab(tab.id as any)}
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
                  <Button variant="outline" size="sm" onClick={() => saveWorkflow()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportWorkflow()}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  {(generatedWorkflow || selectedTemplate) && (
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-600"
                      onClick={() => createWorkflowInN8N(generatedWorkflow || selectedTemplate!)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Deploy to N8N
                    </Button>
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
                    <MicOff className="h-8 w-8 text-white" />
                  ) : (
                    <Mic className="h-8 w-8 text-white" />
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
                  'text-white font-semibold px-8 py-3',
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