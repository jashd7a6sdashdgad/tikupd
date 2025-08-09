'use client';

import SmartWorkflowBuilder from '@/components/SmartWorkflowBuilder';

export default function WorkflowBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <SmartWorkflowBuilder />
      </div>
    </div>
  );
}