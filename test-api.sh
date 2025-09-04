#!/bin/bash

echo "🧪 Testing Customer Identity Service..."

BASE_URL="http://localhost:3000"

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq -r '.status' | grep -q "ok" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Test brand creation
echo "2. Testing brand creation..."
BRAND_RESPONSE=$(curl -s -X POST "$BASE_URL/identity/brand" \
  -H "Content-Type: application/json" \
  -d '{"id": "test-brand", "name": "Test Brand", "slug": "test-brand"}')
echo "$BRAND_RESPONSE" | jq -r '.name' | grep -q "Test Brand" && echo "✅ Brand creation passed" || echo "❌ Brand creation failed"

# Test session identification
echo "3. Testing session identification..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/identity/identify" \
  -H "Content-Type: application/json" \
  -d '{"provider": "amplitude", "externalSessionId": "test_sess_123", "brandId": "test-brand"}')
echo "$SESSION_RESPONSE" | jq -r '.provider' | grep -q "amplitude" && echo "✅ Session identification passed" || echo "❌ Session identification failed"

# Test customer linking
echo "4. Testing customer linking..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/identity/link-login" \
  -H "Content-Type: application/json" \
  -d '{"provider": "amplitude", "externalSessionId": "test_sess_123", "brandId": "test-brand", "email": "test@example.com"}')
echo "$CUSTOMER_RESPONSE" | jq -r '.email' | grep -q "test@example.com" && echo "✅ Customer linking passed" || echo "❌ Customer linking failed"

# Test customer lookup
echo "5. Testing customer lookup..."
LOOKUP_RESPONSE=$(curl -s "$BASE_URL/identity/customer-for-session?provider=amplitude&externalSessionId=test_sess_123")
echo "$LOOKUP_RESPONSE" | jq -r '.email' | grep -q "test@example.com" && echo "✅ Customer lookup passed" || echo "❌ Customer lookup failed"

echo ""
echo "🎉 All tests completed!"
echo ""
echo "Service is running at: $BASE_URL"
echo "Neo4j Browser: http://localhost:7474"
