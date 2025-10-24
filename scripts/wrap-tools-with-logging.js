#!/usr/bin/env node
/**
 * Script to wrap all tool execute functions with logging
 */

const fs = require('fs');
const path = require('path');

const toolsPath = path.join(__dirname, '../lib/agents/tools.ts');
let content = fs.readFileSync(toolsPath, 'utf8');

// Pattern to match execute functions that aren't already wrapped
const executePattern = /execute: async \(([^)]+)\) => \{/g;

// Replace each occurrence
let replacements = 0;
content = content.replace(executePattern, (match, params) => {
  // Check if this is already wrapped with withToolLogging
  const beforeMatch = content.substring(Math.max(0, content.indexOf(match) - 100), content.indexOf(match));
  if (beforeMatch.includes('withToolLogging')) {
    return match; // Already wrapped, skip
  }

  replacements++;
  return `execute: withToolLogging(\n        'TOOL_NAME_PLACEHOLDER',\n        async (${params}) => {`;
});

console.log(`Made ${replacements} replacements`);
console.log('Note: You need to manually replace TOOL_NAME_PLACEHOLDER with actual tool names');

fs.writeFileSync(toolsPath, content);
console.log('File updated!');
