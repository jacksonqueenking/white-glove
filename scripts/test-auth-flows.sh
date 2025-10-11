#!/bin/bash

# White Glove Authentication Flow Testing Script
# This script tests all authentication endpoints

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-test+$(date +%s)@example.com}"

echo "🧪 Testing White Glove Authentication Flows"
echo "============================================"
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    ((TESTS_FAILED++))
  fi
}

# Function to check if server is running
check_server() {
  echo "Checking if server is running..."
  if curl -s -f -o /dev/null "$BASE_URL"; then
    print_result 0 "Server is running"
  else
    echo -e "${RED}Server is not running at $BASE_URL${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
  fi
}

# Test 1: Magic Link Request
test_magic_link() {
  echo ""
  echo "📧 Test 1: Magic Link Request"
  echo "----------------------------"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/magic-link" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_EMAIL\",
      \"userType\": \"client\"
    }")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    if echo "$BODY" | grep -q "success"; then
      print_result 0 "Magic link request successful"
      echo "   Response: $BODY"
    else
      print_result 1 "Magic link request returned 200 but unexpected body"
      echo "   Response: $BODY"
    fi
  else
    print_result 1 "Magic link request failed with status $HTTP_CODE"
    echo "   Response: $BODY"
  fi
}

# Test 2: Invalid Email Validation
test_invalid_email() {
  echo ""
  echo "🔍 Test 2: Invalid Email Validation"
  echo "-----------------------------------"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/magic-link" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "invalid-email",
      "userType": "client"
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Invalid email properly rejected"
  else
    print_result 1 "Invalid email should return 400, got $HTTP_CODE"
    echo "   Response: $BODY"
  fi
}

# Test 3: Password Signup
test_password_signup() {
  echo ""
  echo "🔐 Test 3: Password Signup"
  echo "-------------------------"

  UNIQUE_EMAIL="test+signup$(date +%s)@example.com"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/password?action=signup" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$UNIQUE_EMAIL\",
      \"password\": \"TestPass123!\",
      \"confirmPassword\": \"TestPass123!\",
      \"name\": \"Test User\",
      \"userType\": \"client\"
    }")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    if echo "$BODY" | grep -q "success"; then
      print_result 0 "Password signup successful"
      echo "   Created user: $UNIQUE_EMAIL"
    else
      print_result 1 "Signup returned 200 but unexpected response"
      echo "   Response: $BODY"
    fi
  else
    print_result 1 "Password signup failed with status $HTTP_CODE"
    echo "   Response: $BODY"
  fi
}

# Test 4: Weak Password Rejection
test_weak_password() {
  echo ""
  echo "🛡️  Test 4: Weak Password Rejection"
  echo "-----------------------------------"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/password?action=signup" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test+weak@example.com\",
      \"password\": \"weak\",
      \"confirmPassword\": \"weak\",
      \"name\": \"Test User\",
      \"userType\": \"client\"
    }")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Weak password properly rejected"
  else
    print_result 1 "Weak password should return 400, got $HTTP_CODE"
    echo "   Response: $BODY"
  fi
}

# Test 5: Password Reset Request
test_password_reset() {
  echo ""
  echo "🔄 Test 5: Password Reset Request"
  echo "--------------------------------"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/reset-password?action=request" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_EMAIL\"
    }")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Password reset request successful"
  else
    print_result 1 "Password reset failed with status $HTTP_CODE"
    echo "   Response: $BODY"
  fi
}

# Test 6: Rate Limit Headers
test_rate_limit_headers() {
  echo ""
  echo "⏱️  Test 6: Rate Limit Headers"
  echo "------------------------------"

  RESPONSE=$(curl -s -i -X POST "$BASE_URL/api/auth/magic-link" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_EMAIL\",
      \"userType\": \"client\"
    }")

  if echo "$RESPONSE" | grep -q "X-RateLimit-Limit"; then
    print_result 0 "Rate limit headers present"
    echo "   Headers found:"
    echo "$RESPONSE" | grep "X-RateLimit"
  else
    echo -e "${YELLOW}⚠ WARNING${NC}: Rate limit headers not found (Redis may not be configured)"
    echo "   This is expected if UPSTASH_REDIS_REST_URL is not set"
  fi
}

# Test 7: CORS and Security Headers
test_security_headers() {
  echo ""
  echo "🔒 Test 7: Security Headers"
  echo "--------------------------"

  RESPONSE=$(curl -s -i "$BASE_URL")

  HEADERS_PRESENT=0

  if echo "$RESPONSE" | grep -q "X-Frame-Options"; then
    ((HEADERS_PRESENT++))
  fi

  if [ $HEADERS_PRESENT -gt 0 ]; then
    print_result 0 "Security headers present"
  else
    print_result 1 "Security headers missing"
  fi
}

# Run all tests
main() {
  check_server
  test_magic_link
  test_invalid_email
  test_password_signup
  test_weak_password
  test_password_reset
  test_rate_limit_headers
  test_security_headers

  echo ""
  echo "============================================"
  echo "Test Results:"
  echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
  echo -e "${RED}Failed: $TESTS_FAILED${NC}"
  echo "============================================"

  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
  fi
}

# Run main function
main
