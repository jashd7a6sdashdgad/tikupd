#!/bin/bash

echo "🚀 Setting up Vercel Blob Storage for Token Persistence"
echo "=============================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📦 Setting up Vercel Blob storage..."
echo ""
echo "Step 1: Create a Blob store in Vercel Dashboard:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Storage tab"
echo "4. Click 'Create Database'"
echo "5. Select 'Blob' storage"
echo "6. Give it a name like 'tokens-storage'"
echo "7. Copy the BLOB_READ_WRITE_TOKEN"
echo ""
echo "Alternative: Use Vercel CLI to create store:"
echo "vercel blob store"
echo "Follow the prompts to create a new blob store"
echo ""
echo "Step 2: Add token to environment variables:"
echo "vercel env add BLOB_READ_WRITE_TOKEN"
echo ""
echo "Or add it manually in your Vercel dashboard:"
echo "1. Go to your project settings"
echo "2. Navigate to Environment Variables"  
echo "3. Add: BLOB_READ_WRITE_TOKEN with the token value"
echo "4. Make sure to set it for all environments (Development, Preview, Production)"
echo ""
echo "🎯 Once set up, your tokens will persist across deployments!"
echo ""
echo "Test your setup by visiting: /api/debug/storage-status"