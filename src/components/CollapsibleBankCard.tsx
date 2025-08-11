'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Flag } from 'lucide-react';

interface CollapsibleBankCardProps {
  category: string;
  amount: number;
  total: number;
  formatCurrency: (amount: number) => string;
}

const CollapsibleBankCard = ({ category, amount, total, formatCurrency }: CollapsibleBankCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if this is one of the banks that should have toggle functionality
  const shouldHaveToggle = ['Bank Muscat', 'Ahli Bank (Credit)', 'Ahli Bank (Cards)'].includes(category);
  
  // Mock credit/debit data - you can replace this with real data
  const getBankDetails = (bankName: string) => {
    switch (bankName) {
      case 'Bank Muscat':
        return {
          credit: amount * 0.3,
          debit: amount * 0.7
        };
      case 'Ahli Bank (Credit)':
        return {
          credit: amount * 0.85,
          debit: amount * 0.15
        };
      case 'Ahli Bank (Cards)':
        return {
          credit: amount * 0.6,
          debit: amount * 0.4
        };
      default:
        return { credit: 0, debit: 0 };
    }
  };
  
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  const bankDetails = getBankDetails(category);
  
  const getGradientClass = (category: string) => {
    if (category === 'Ahli Bank (General)') return 'bg-gradient-to-r from-red-400 to-red-500';
    if (category === 'Ahli Bank (Cards)') return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (category === 'Ahli Bank (Credit)') return 'bg-gradient-to-r from-green-400 to-green-500';
    if (category === 'Ahli Bank (Debit)') return 'bg-gradient-to-r from-orange-400 to-orange-500';
    if (category === 'Bank Muscat') return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (category === 'Food') return 'bg-gradient-to-r from-green-400 to-green-500';
    if (category === 'Transportation') return 'bg-gradient-to-r from-orange-400 to-orange-500';
    if (category === 'Business') return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (category === 'Medical') return 'bg-gradient-to-r from-red-400 to-red-500';
    if (category === 'Entertainment') return 'bg-gradient-to-r from-purple-400 to-purple-500';
    if (category === 'Shopping') return 'bg-gradient-to-r from-pink-400 to-pink-500';
    if (category === 'Utilities') return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (category === 'Travel') return 'bg-gradient-to-r from-indigo-400 to-indigo-500';
    if (category === 'Education') return 'bg-gradient-to-r from-amber-400 to-amber-500';
    if (category === 'General') return 'bg-gradient-to-r from-gray-400 to-gray-500';
    if (category === 'Uncategorized') return 'bg-gradient-to-r from-slate-400 to-slate-500';
    if (category === 'Other Cards') return 'bg-gradient-to-r from-purple-400 to-purple-500';
    if (category.toLowerCase().includes('food') || category.toLowerCase().includes('restaurant')) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (category.toLowerCase().includes('transport') || category.toLowerCase().includes('gas')) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    if (category.toLowerCase().includes('shopping') || category.toLowerCase().includes('retail')) return 'bg-gradient-to-r from-pink-400 to-pink-500';
    if (category.toLowerCase().includes('entertainment')) return 'bg-gradient-to-r from-teal-400 to-teal-500';
    
    return 'bg-gradient-to-r from-cyan-400 to-cyan-500';
  };
  
  const getCategoryFlag = (category: string) => {
    // Bank flags
    if (category === 'Ahli Bank (Cards)') {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Ahli Cards
        </span>
      );
    }
    if (category === 'Bank Muscat') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Muscat
        </span>
      );
    }
    if (category === 'Ahli Bank (General)') {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Ahli
        </span>
      );
    }
    if (category === 'Ahli Bank (Credit)') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Credit
        </span>
      );
    }
    if (category === 'Ahli Bank (Debit)') {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Debit
        </span>
      );
    }
    if (category === 'Other Cards') {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Cards
        </span>
      );
    }
    
    // Category-based flags
    if (category.toLowerCase().includes('food') || category.toLowerCase().includes('restaurant') || category === 'Food') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
          🍽️
          Food
        </span>
      );
    }
    if (category.toLowerCase().includes('transport') || category.toLowerCase().includes('gas') || category === 'Transportation') {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
          🚗
          Transport
        </span>
      );
    }
    if (category.toLowerCase().includes('shopping') || category.toLowerCase().includes('retail') || category === 'Shopping') {
      return (
        <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full flex items-center gap-1">
          🛍️
          Shopping
        </span>
      );
    }
    if (category.toLowerCase().includes('entertainment') || category === 'Entertainment') {
      return (
        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full flex items-center gap-1">
          🎬
          Fun
        </span>
      );
    }
    if (category === 'Business') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
          💼
          Business
        </span>
      );
    }
    if (category === 'Medical') {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
          🏥
          Medical
        </span>
      );
    }
    if (category === 'Travel') {
      return (
        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1">
          ✈️
          Travel
        </span>
      );
    }
    if (category === 'Education') {
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
          📚
          Education
        </span>
      );
    }
    if (category === 'Utilities') {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
          ⚡
          Utilities
        </span>
      );
    }
    if (category === 'General') {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
          📋
          General
        </span>
      );
    }
    if (category === 'Uncategorized') {
      return (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full flex items-center gap-1">
          ❓
          Unknown
        </span>
      );
    }
    
    return null;
  };
  
  return (
    <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{category}</span>
          {getCategoryFlag(category)}
          {shouldHaveToggle && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
        </div>
        <span className="text-base font-bold text-gray-800">
          {formatCurrency(amount)}
        </span>
      </div>
      
      <div className="w-full bg-gray-300 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 shadow-sm ${getGradientClass(category)}`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
      
      {/* Collapsible Section */}
      {shouldHaveToggle && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
            {/* Credit Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Credit:</span>
                <span className="text-sm font-bold text-green-800">
                  {formatCurrency(bankDetails.credit)}
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max((bankDetails.credit / amount) * 100, 2)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Debit Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-red-700">Debit:</span>
                <span className="text-sm font-bold text-red-800">
                  {formatCurrency(bankDetails.debit)}
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max((bankDetails.debit / amount) * 100, 2)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleBankCard;