'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ModernCard } from '@/components/ui/ModernCard';
import { RefreshCw, Table, Download, Building2, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface BalanceReportEntry {
  bankAccountType: string;
  availableBalance: number;
  lastUpdatedRow: number;
  balanceSource: string;
  lastUpdatedDate?: string;
}

interface BalanceReportData {
  reportTitle: string;
  generatedAt: string;
  totalAccounts: number;
  balanceReport: BalanceReportEntry[];
  columnInfo: {
    bankColumnHeader: string;
    dateColumnHeader: string;
    creditCardBalanceHeader: string;
    debitCardBalanceHeader: string;
  };
}

export default function BalanceReportPage() {
  const [reportData, setReportData] = useState<BalanceReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/balance-report');
      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
        console.log('✅ Balance report data:', result.data);
      } else {
        setError(result.error || 'Failed to fetch balance report');
      }
    } catch (err) {
      console.error('Balance report error:', err);
      setError('Network error - could not fetch balance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceReport();
  }, []);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} OMR`;
  };

  const exportToCsv = () => {
    if (!reportData) return;

    const csvHeaders = ['Bank & Account Type', 'Available Balance (OMR)', 'Last Updated Row', 'Balance Source', 'Last Updated Date'];
    const csvRows = reportData.balanceReport.map(entry => [
      entry.bankAccountType,
      entry.availableBalance.toFixed(2),
      entry.lastUpdatedRow.toString(),
      entry.balanceSource,
      entry.lastUpdatedDate || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Latest Available Balances</h1>
          <p className="text-gray-600">Real-time balance report from Google Sheets data</p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={fetchBalanceReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh Report'}
          </Button>
          
          {reportData && (
            <Button
              onClick={exportToCsv}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <ModernCard gradient="none" className="border-red-200 bg-red-50">
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Report</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </ModernCard>
        )}

        {/* Loading State */}
        {loading && (
          <ModernCard gradient="none" className="border-blue-200 bg-blue-50">
            <div className="p-12 text-center">
              <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-bold text-blue-800 mb-2">Fetching Latest Balances</h3>
              <p className="text-blue-600">Reading data from Google Sheets...</p>
            </div>
          </ModernCard>
        )}

        {/* Report Data */}
        {reportData && (
          <>
            {/* Summary */}
            <ModernCard gradient="blue" blur="lg">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Table className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{reportData.reportTitle}</h2>
                    <p className="text-white/80">Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-white" />
                      <span className="text-white font-semibold">Total Accounts</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{reportData.totalAccounts}</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-white" />
                      <span className="text-white font-semibold">Data Source</span>
                    </div>
                    <p className="text-white">Google Sheets (Real-time)</p>
                  </div>
                </div>
              </div>
            </ModernCard>

            {/* Column Information */}
            <ModernCard gradient="none" className="border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Data Source Columns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Bank/Account:</span>
                    <span className="ml-2 text-gray-800">{reportData.columnInfo.bankColumnHeader}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <span className="ml-2 text-gray-800">{reportData.columnInfo.dateColumnHeader}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Credit Card Balance:</span>
                    <span className="ml-2 text-gray-800">{reportData.columnInfo.creditCardBalanceHeader}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Debit Card Balance:</span>
                    <span className="ml-2 text-gray-800">{reportData.columnInfo.debitCardBalanceHeader}</span>
                  </div>
                </div>
              </div>
            </ModernCard>

            {/* Balance Table */}
            <ModernCard gradient="none" className="border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Latest Available Balances</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Bank & Account Type</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Available Balance</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Updated Row</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Balance Source</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.balanceReport.map((entry, index) => (
                        <tr key={entry.bankAccountType} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-800">{entry.bankAccountType}</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-green-600 text-lg">{formatCurrency(entry.availableBalance)}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                              Row {entry.lastUpdatedRow}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              entry.balanceSource === 'Credit Card Balance' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-teal-100 text-teal-800'
                            }`}>
                              {entry.balanceSource}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-600 text-sm">
                            {entry.lastUpdatedDate || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {reportData.balanceReport.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Balance Data Found</h3>
                    <p className="text-gray-500">No valid balance entries were found in the balance columns.</p>
                  </div>
                )}
              </div>
            </ModernCard>
          </>
        )}
      </div>
    </div>
  );
}