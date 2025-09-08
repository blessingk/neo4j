#!/bin/bash

# Customer Identity API Test Script
# Make sure your server is running on http://localhost:3000

BASE_URL="http://localhost:3000"

echo "🧪 Testing Customer Identity API..."
echo "=================================="

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s -X GET "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s -X GET "$BASE_URL/health"
echo -e "\n"

# Test 2: Create Brand
echo "2. Creating Brand..."
curl -s -X POST "$BASE_URL/identity/brand" \
  -H "Content-Type: application/json" \
  -d '{"id": "test-brand", "name": "Test Brand", "slug": "test-brand"}' | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/identity/brand" \
  -H "Content-Type: application/json" \
  -d '{"id": "test-brand", "name": "Test Brand", "slug": "test-brand"}'
echo -e "\n"

# Test 3: Create Customer Session
echo "3. Creating Customer Session..."
curl -s -X POST "$BASE_URL/identity/customer-session" \
  -H "Content-Type: application/json" \
  -d '{"internalSessionId": "session-123", "email": "customer@example.com", "brandId": "test-brand", "brazeSession": "braze-123", "amplitudeSession": "amp-123"}' | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/identity/customer-session" \
  -H "Content-Type: application/json" \
  -d '{"internalSessionId": "session-123", "email": "customer@example.com", "brandId": "test-brand", "brazeSession": "braze-123", "amplitudeSession": "amp-123"}'
echo -e "\n"

# Test 4: Quick Identify Customer
echo "4. Quick Identifying Customer..."
curl -s -X GET "$BASE_URL/identity/quick-identify-customer?internalSessionId=session-123" | jq '.' 2>/dev/null || curl -s -X GET "$BASE_URL/identity/quick-identify-customer?internalSessionId=session-123"
echo -e "\n"

# Test 5: Find Customer by Session
echo "5. Finding Customer by Session..."
curl -s -X GET "$BASE_URL/identity/find-customer-by-session?brazeSession=braze-123&amplitudeSession=amp-123&internalSessionId=session-123&email=customer@example.com" | jq '.' 2>/dev/null || curl -s -X GET "$BASE_URL/identity/find-customer-by-session?brazeSession=braze-123&amplitudeSession=amp-123&internalSessionId=session-123&email=customer@example.com"
echo -e "\n"

# Test 6: Get Customer Session
echo "6. Getting Customer Session..."
curl -s -X GET "$BASE_URL/identity/customer-session?internalSessionId=session-123" | jq '.' 2>/dev/null || curl -s -X GET "$BASE_URL/identity/customer-session?internalSessionId=session-123"
echo -e "\n"

# Test 7: Update Customer Session
echo "7. Updating Customer Session..."
curl -s -X POST "$BASE_URL/identity/update-customer-session" \
  -H "Content-Type: application/json" \
  -d '{"internalSessionId": "session-123", "email": "updated@example.com", "brandId": "test-brand", "brazeSession": "braze-456", "amplitudeSession": "amp-456"}' | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/identity/update-customer-session" \
  -H "Content-Type: application/json" \
  -d '{"internalSessionId": "session-123", "email": "updated@example.com", "brandId": "test-brand", "brazeSession": "braze-456", "amplitudeSession": "amp-456"}'
echo -e "\n"

# Test 8: Legacy Identify
echo "8. Testing Legacy Identify..."
curl -s -X POST "$BASE_URL/identity/identify" \
  -H "Content-Type: application/json" \
  -d '{"provider": "braze", "externalSessionId": "braze-123", "brandId": "test-brand"}' | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/identity/identify" \
  -H "Content-Type: application/json" \
  -d '{"provider": "braze", "externalSessionId": "braze-123", "brandId": "test-brand"}'
echo -e "\n"

echo "✅ API Testing Complete!"
