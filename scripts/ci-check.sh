#!/bin/bash

# CI Check Script
# Runs all checks that will run in CI
# Use this before creating a PR to ensure it will pass

set -e

echo "╔════════════════════════════════════════╗"
echo "║     Running Local CI Checks            ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2 passed${NC}"
  else
    echo -e "${RED}❌ $2 failed${NC}"
    FAILED=1
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1/3 Type Checking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm type-check
print_status $? "Type check"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2/3 Linting (Mobile)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm lint --filter mobile
print_status $? "Lint check"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3/3 Format Checking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm format:check
print_status $? "Format check"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ All CI checks passed!             ║${NC}"
  echo -e "${GREEN}║  You're ready to push!                 ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ Some checks failed                 ║${NC}"
  echo -e "${RED}║  Please fix the errors above           ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Tip: Run 'pnpm format' to auto-fix formatting issues${NC}"
  exit 1
fi
