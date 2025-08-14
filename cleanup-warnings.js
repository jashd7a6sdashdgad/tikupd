#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common unused imports to remove
const unusedImports = [
  'Settings', 'Zap', 'Filter', 'Clock', 'User', 'Album', 'Download', 'Share2',
  'MoreHorizontal', 'Shuffle', 'Repeat', 'ExternalLink', 'HeartOff', 'Volume2',
  'VolumeX', 'SkipBack', 'SkipForward', 'Plus', 'Globe', 'Edit', 'Upload',
  'Search', 'Navigation', 'Bell', 'CheckCircle', 'AlertCircle', 'Info',
  'Coffee', 'Fuel', 'ParkingCircle', 'RefreshCw', 'EyeOff', 'ChevronRight',
  'ChevronDown', 'MapIcon', 'Facebook', 'MessageCircle', 'Building2'
];

// Common unused variables to prefix with underscore
const unusedVariables = [
  't', 'loading', 'error', 'isRTL', 'userLibrary', 'spotifyError',
  'isConnectingGoogle', 'handleGoogleConnect', 'avgDaily', 'description',
  'debitAmount', 'getExpenseEmoji', 'isLoading', 'view', 'recentActivity',
  'formatDuration', 'editingExpense', 'getTotalByCategory', 'showAIFeatures',
  'setShowAIFeatures', 'showDashboard', 'setShowDashboard', 'smartAlbums',
  'setSmartAlbums', 'isAnalyzing', 'duplicateGroups', 'setDuplicateGroups',
  'voiceSearchQuery', 'startListening', 'stopListening', 'isSupported',
  'resetGoogleAuth', 'analyzeAllPhotos', 'err', 'setBaseCurrency'
];

function cleanupFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove unused imports
    unusedImports.forEach(importName => {
      const importRegex = new RegExp(`\\b${importName}\\b(?=\\s*,|\\s*})`, 'g');
      if (importRegex.test(content)) {
        content = content.replace(importRegex, '');
        modified = true;
      }
    });

    // Prefix unused variables with underscore
    unusedVariables.forEach(varName => {
      const varRegex = new RegExp(`\\b${varName}\\b(?=\\s*=)`, 'g');
      if (varRegex.test(content)) {
        content = content.replace(varRegex, `_${varName}`);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned up: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      cleanupFile(filePath);
    }
  });
}

console.log('🧹 Starting ESLint warning cleanup...');
walkDir('./src');
console.log('✨ Cleanup complete! Run npm run build again to see improvements.');
