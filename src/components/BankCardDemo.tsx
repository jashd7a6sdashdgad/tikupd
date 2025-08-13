'use client';

import React from 'react';
import CollapsibleBankCard from './CollapsibleBankCard';

const BankCardDemo = () => {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} OMR`;
  
  // Real data based on actual banking structure
  const bankData = [
    { category: 'Bank Card ****1234', amount: 2437.71, total: 100 },
    { category: 'Credit Card ****5678', amount: 2672.51, total: 100 },
    { category: 'Groceries', amount: 125.5, total: 100 },
    { category: 'Fuel', amount: 45.75, total: 100 },
    { category: 'Dining', amount: 89.99, total: 100 },
    { category: 'Transportation', amount: 67.25, total: 100 },
    { category: 'Shopping', amount: 234.80, total: 100 }
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