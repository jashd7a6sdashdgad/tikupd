'use client';

import React from 'react';
import CollapsibleBankCard from './CollapsibleBankCard';

const BankCardDemo = () => {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} OMR`;
  
  // Sample data matching your screenshots
  const bankData = [
    { category: 'Bank Muscat', amount: 0.43, total: 100 },
    { category: 'Ahli Bank (Credit)', amount: 16228.49, total: 100 },
    { category: 'General', amount: 25.44, total: 100 },
    { category: 'Ahli Bank (Cards)', amount: 12.90, total: 100 },
    { category: 'Food', amount: 85.50, total: 100 },
    { category: 'Transportation', amount: 42.75, total: 100 }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Bank Account Cards Demo</h2>
      
      {bankData.map((bank, index) => (
        <CollapsibleBankCard
          key={index}
          category={bank.category}
          amount={bank.amount}
          total={bank.total}
          formatCurrency={formatCurrency}
        />
      ))}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Features:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ Toggle buttons only appear for: Bank Muscat, Ahli Bank (Credit), Ahli Bank (Cards)</li>
          <li>✅ Smooth expand/collapse animation</li>
          <li>✅ Shows Credit and Debit breakdown when expanded</li>
          <li>✅ Maintains original styling and layout for all other cards</li>
          <li>✅ Responsive design with hover effects</li>
          <li>✅ All original category flags and colors preserved</li>
        </ul>
      </div>
    </div>
  );
};

export default BankCardDemo;