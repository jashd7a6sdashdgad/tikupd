// Test the bank analysis function with mock data
const mockExpenseData = [
  // Headers
  ['From', 'Account Number', 'Account Type/Name', 'Date', 'Credit Amount', 'Debit Amount', 'Category', 'Description', 'Credit Card Balance', 'Debit Card Balance', 'ID'],
  
  // Sample transactions - Ahli Bank Saving Debit Account
  ['Bank', '12345', 'Saving Debit Account (Tofer)', '2025-08-01', '0', '50.500', 'Food', 'Supermarket Purchase', '', '1250.750', 'TXN001'],
  ['Bank', '12345', 'Saving Debit Account (Tofer)', '2025-08-02', '0', '25.250', 'Transport', 'Taxi Fare', '', '1225.500', 'TXN002'],
  ['Bank', '12345', 'Saving Debit Account (Tofer)', '2025-08-03', '500.000', '0', 'Income', 'Salary Deposit', '', '1725.500', 'TXN003'],
  
  // Sample transactions - Ahli (Wafrah) 
  ['Bank', '67890', 'Debit Card (Wafrah)', '2025-08-01', '0', '100.000', 'Shopping', 'Mall Purchase', '', '2500.000', 'TXN004'],
  ['Bank', '67890', 'Debit Card (Wafrah)', '2025-08-02', '200.000', '0', 'Savings', 'Monthly Savings', '', '2700.000', 'TXN005'],
  
  // Sample transactions - Ahli Bank Main Credit Card
  ['Bank', '11111', 'Credit Card', '2025-08-01', '0', '75.500', 'Food', 'Restaurant', '150.750', '', 'TXN006'],
  ['Bank', '11111', 'Credit Card', '2025-08-02', '0', '120.250', 'Entertainment', 'Cinema', '271.000', '', 'TXN007'],
  
  // Sample transactions - Ahli Bank Overdraft Current Account
  ['Bank', '22222', 'Overdraft Current Account', '2025-08-01', '0', '300.000', 'Business', 'Office Supplies', '', '800.000', 'TXN008'],
  ['Bank', '22222', 'Overdraft Current Account', '2025-08-02', '150.000', '0', 'Income', 'Business Income', '', '950.000', 'TXN009'],
  
  // Sample transactions - Bank Muscat Main Debit Account  
  ['Bank', '33333', 'Bank Muscat IBKY/IBE Main Debit Account', '2025-08-01', '0', '45.750', 'Utilities', 'Electric Bill', '', '3200.250', 'TXN010'],
  ['Bank', '33333', 'Bank Muscat IBKY/IBE Main Debit Account', '2025-08-02', '0', '85.500', 'Medical', 'Pharmacy', '', '3114.750', 'TXN011']
];

// Copy the bank analysis function from the API
function analyzeBankDataDirect(expenseData) {
  const bankTypes = [
    'Ahli Bank Saving Debit Account',
    'Ahli (Wafrah)', 
    'Ahli Bank Overdraft Current Account',
    'Ahli Bank Main Credit Card',
    'Bank Muscat Main Debit Account'
  ];

  const headers = expenseData[0] || [];
  const dataRows = expenseData.slice(1);

  const bankIndex = headers.findIndex(h => h && (
    h.toLowerCase().includes('account type') || 
    h.toLowerCase().includes('account name') ||
    h.toLowerCase().includes('account type/name') ||
    h.toLowerCase().includes('bank')
  ));
  const creditAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('credit amount'));
  const debitAmountIndex = headers.findIndex(h => h && h.toLowerCase().includes('debit amount'));
  
  // Find balance columns
  const creditCardBalanceIndex = headers.findIndex(h => h && (
    h.toLowerCase().includes('credit card balance') ||
    h.toLowerCase().trim() === 'credit card balance' ||
    h.trim() === 'Credit Card Balance'
  ));
  
  const debitCardBalanceIndex = headers.findIndex(h => h && (
    h.toLowerCase().includes('debit card balance') ||
    h.toLowerCase().trim() === 'debit card balance' ||
    h.trim() === 'Debit Card Balance'
  ));
  
  console.log('🏦 Bank analysis setup:', {
    bankIndex,
    creditAmountIndex,
    debitAmountIndex,
    creditCardBalanceIndex,
    debitCardBalanceIndex,
    headersCount: headers.length,
    dataRowsCount: dataRows.length
  });

  const bankData = {};
  let totalExpenses = 0;

  // Initialize bank data
  bankTypes.forEach(bank => {
    bankData[bank] = { 
      amount: 0, 
      count: 0, 
      transactions: [], 
      availableBalance: 0,
      creditAmount: 0,
      debitAmount: 0
    };
  });
  
  // Process balance data first
  const balanceData = {};
  
  dataRows.forEach((row, rowIndex) => {
    const bankName = row[bankIndex] || '';
    if (!bankName.trim()) return;
    
    // Check for balance in appropriate columns
    let balance = 0;
    
    if (creditCardBalanceIndex !== -1) {
      const rawValue = row[creditCardBalanceIndex];
      if (rawValue !== undefined && rawValue !== '' && rawValue !== null) {
        const parsed = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsed) && parsed !== 0) {
          balance = parsed;
        }
      }
    }
    
    if (balance === 0 && debitCardBalanceIndex !== -1) {
      const rawValue = row[debitCardBalanceIndex];
      if (rawValue !== undefined && rawValue !== '' && rawValue !== null) {
        const parsed = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsed) && parsed !== 0) {
          balance = parsed;
        }
      }
    }
    
    if (balance !== 0) {
      const existingEntry = balanceData[bankName];
      const actualRowNumber = rowIndex + 2;
      
      if (!existingEntry || actualRowNumber > existingEntry.lastUpdatedRow) {
        balanceData[bankName] = {
          balance: balance,
          lastUpdatedRow: actualRowNumber
        };
      }
    }
  });

  // Process transactions
  dataRows.forEach(row => {
    const bankName = row[bankIndex] || '';
    
    let creditAmount = 0;
    let debitAmount = 0;
    
    if (creditAmountIndex !== -1 && debitAmountIndex !== -1) {
      creditAmount = parseFloat(row[creditAmountIndex] || '0');
      debitAmount = parseFloat(row[debitAmountIndex] || '0');
    }

    // Match bank names
    let matchedBank = null;
    const normalizedBankName = bankName.toLowerCase().trim();
    
    // Exact matches first
    if (normalizedBankName === 'debit card (wafrah)') {
      matchedBank = 'Ahli (Wafrah)';
    } else if (normalizedBankName === 'overdraft current account') {
      matchedBank = 'Ahli Bank Overdraft Current Account';
    } else if (normalizedBankName === 'credit card') {
      matchedBank = 'Ahli Bank Main Credit Card';
    } else if (normalizedBankName === 'saving debit account (tofer)') {
      matchedBank = 'Ahli Bank Saving Debit Account';
    } else if (normalizedBankName.includes('bank muscat') && normalizedBankName.includes('ibky')) {
      matchedBank = 'Bank Muscat Main Debit Account';
    } else {
      // Fallback patterns
      if (normalizedBankName.includes('wafrah') || normalizedBankName.includes('wafra')) {
        matchedBank = 'Ahli (Wafrah)';
      } else if (normalizedBankName.includes('overdraft')) {
        matchedBank = 'Ahli Bank Overdraft Current Account';
      } else if (normalizedBankName.includes('credit') && normalizedBankName.includes('card')) {
        matchedBank = 'Ahli Bank Main Credit Card';
      } else if (normalizedBankName.includes('muscat')) {
        matchedBank = 'Bank Muscat Main Debit Account';
      } else if (normalizedBankName.includes('tofer') || (normalizedBankName.includes('saving') && normalizedBankName.includes('debit'))) {
        matchedBank = 'Ahli Bank Saving Debit Account';
      }
    }

    if (matchedBank && (creditAmount !== 0 || debitAmount !== 0)) {
      const totalAmount = Math.abs(creditAmount) + Math.abs(debitAmount);
      bankData[matchedBank].amount += totalAmount;
      bankData[matchedBank].count += 1;
      bankData[matchedBank].transactions.push(row);
      bankData[matchedBank].creditAmount += creditAmount;
      bankData[matchedBank].debitAmount += Math.abs(debitAmount);
      
      if (debitAmount > 0) {
        totalExpenses += debitAmount;
      }
    }
  });
  
  // Assign available balances to matched bank types
  Object.entries(balanceData).forEach(([bankName, balanceInfo]) => {
    let matchedBankType = null;
    const normalizedBankName = bankName.toLowerCase().trim();
    
    // Same matching logic as transactions
    if (normalizedBankName === 'debit card (wafrah)') {
      matchedBankType = 'Ahli (Wafrah)';
    } else if (normalizedBankName === 'overdraft current account') {
      matchedBankType = 'Ahli Bank Overdraft Current Account';
    } else if (normalizedBankName === 'credit card') {
      matchedBankType = 'Ahli Bank Main Credit Card';
    } else if (normalizedBankName === 'saving debit account (tofer)') {
      matchedBankType = 'Ahli Bank Saving Debit Account';
    } else if (normalizedBankName.includes('bank muscat') && normalizedBankName.includes('ibky')) {
      matchedBankType = 'Bank Muscat Main Debit Account';
    } else {
      // Fallback patterns
      if (normalizedBankName.includes('wafrah') || normalizedBankName.includes('wafra')) {
        matchedBankType = 'Ahli (Wafrah)';
      } else if (normalizedBankName.includes('overdraft')) {
        matchedBankType = 'Ahli Bank Overdraft Current Account';
      } else if (normalizedBankName.includes('credit') && normalizedBankName.includes('card')) {
        matchedBankType = 'Ahli Bank Main Credit Card';
      } else if (normalizedBankName.includes('muscat')) {
        matchedBankType = 'Bank Muscat Main Debit Account';
      } else if (normalizedBankName.includes('tofer') || (normalizedBankName.includes('saving') && normalizedBankName.includes('debit'))) {
        matchedBankType = 'Ahli Bank Saving Debit Account';
      }
    }
    
    if (matchedBankType && bankData[matchedBankType]) {
      bankData[matchedBankType].availableBalance = balanceInfo.balance;
    }
  });

  // Create bank analysis
  const bankAnalysis = bankTypes.map(bank => {
    const data = bankData[bank];
    const percentage = totalExpenses > 0 ? (data.debitAmount / totalExpenses) * 100 : 0;
    
    return {
      bankType: bank,
      amount: data.amount,
      creditAmount: data.creditAmount,
      debitAmount: data.debitAmount,
      percentage: percentage,
      transactionCount: data.count,
      availableBalance: data.availableBalance,
      insights: `Sample insight for ${bank}`,
      trend: 'stable',
      healthScore: 75
    };
  });

  return {
    bankAnalysis,
    totalExpenses
  };
}

// Test the function
console.log('🏦 Testing Bank-wise Analysis with Mock Data...\n');

const result = analyzeBankDataDirect(mockExpenseData);

console.log('📊 BANK-WISE BREAKDOWN RESULTS:\n');

result.bankAnalysis.forEach(bank => {
  console.log(`🏪 ${bank.bankType}:`);
  console.log(`  💰 Total Amount: ${bank.amount.toFixed(3)} OMR`);
  console.log(`  💳 Credit Amount: ${bank.creditAmount.toFixed(3)} OMR`);
  console.log(`  💸 Debit Amount: ${bank.debitAmount.toFixed(3)} OMR`);
  console.log(`  📈 Percentage: ${bank.percentage.toFixed(2)}%`);
  console.log(`  🔢 Transactions: ${bank.transactionCount}`);
  console.log(`  💰 Available Balance: ${bank.availableBalance.toFixed(3)} OMR`);
  console.log(`  ⚡ Health Score: ${bank.healthScore}`);
  console.log(`  📊 Trend: ${bank.trend}`);
  console.log('');
});

console.log(`💸 Total Expenses: ${result.totalExpenses.toFixed(3)} OMR`);
console.log('\n✅ Mock bank-wise analysis completed successfully!');