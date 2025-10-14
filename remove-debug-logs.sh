#!/bin/bash

# Script to remove debug console.log statements after confirming the fix works

echo "Removing debug logs from useCurrentUser hook..."

# Remove debug logs from useCurrentUser.tsx
sed -i.bak '/console.log.*useCurrentUser/d' lib/hooks/useCurrentUser.tsx

echo "Removing debug logs from AppShell..."

# Remove debug logs from AppShell.tsx
sed -i.bak '/console.log.*AppShell/d' components/layout/AppShell.tsx

echo "Done! Backup files created with .bak extension"
echo ""
echo "To restore if needed:"
echo "  mv lib/hooks/useCurrentUser.tsx.bak lib/hooks/useCurrentUser.tsx"
echo "  mv components/layout/AppShell.tsx.bak components/layout/AppShell.tsx"
