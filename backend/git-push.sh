#!/bin/bash

# ==========================================
# One-Click Git Push Script
# ==========================================
# Fill in your GitHub credentials below, then run this script to commit and push changes

# GitHub Configuration (FILL THESE IN)
# GITHUB_USERNAME="your_username"
# REPOSITORY_URL="https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"

# Or use SSH (recommended - no token needed)
# REPOSITORY_URL="git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git"

# Commit Message (customize or leave as default)
COMMIT_MESSAGE="fix: Secure SQL injection vulnerability in cars.js bulk-delete endpoint"

# ==========================================
# Script starts here - no need to edit below
# ==========================================

echo "=========================================="
echo "🚀 Git Push Script"
echo "=========================================="

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️  No changes to commit."
    exit 0
fi

# Show current status
echo ""
echo "📋 Current git status:"
git status

echo ""
echo "📝 Changes to be committed:"
git diff --stat

# Confirm before proceeding
echo ""
read -p "Continue with commit? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 1
fi

# Add all changes
echo ""
echo "➕ Adding all changes..."
git add .

# Commit changes
echo "✅ Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Check if remote is configured
if git remote get-url origin > /dev/null 2>&1; then
    echo "📡 Remote already configured, using existing remote..."
    git push origin main
else
    echo "🔧 Setting up remote..."
    git remote add origin "$REPOSITORY_URL"
    git push -u origin main
fi

echo ""
echo "=========================================="
echo "✅ Done! Changes pushed to GitHub"
echo "=========================================="
