#!/bin/bash

# Performance Testing Script
# Tests all zero-latency optimizations

API_URL="${1:-http://localhost:8000}"
WEB_URL="${2:-http://localhost:3000}"

PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo "🧪 Testing Performance Optimizations"
echo "======================================"
echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"
echo ""

# Test 1: No redirects
echo "1️⃣ Testing for 307 redirects..."
REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/projects")
if [ "$REDIRECT" = "200" ]; then
  echo -e "   ${GREEN}✅ No redirects (200 OK)${RESET}"
  ((PASSED++))
else
  echo -e "   ${RED}❌ Got status code: $REDIRECT${RESET}"
  ((FAILED++))
fi
echo ""

# Test 2: No trailing slash redirect
echo "2️⃣ Testing trailing slash handling..."
REDIRECT_SLASH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/projects/")
if [ "$REDIRECT_SLASH" = "200" ]; then
  echo -e "   ${GREEN}✅ Both /api/projects and /api/projects/ return 200${RESET}"
  ((PASSED++))
else
  echo -e "   ${RED}❌ Trailing slash got: $REDIRECT_SLASH${RESET}"
  ((FAILED++))
fi
echo ""

# Test 3: ETag support
echo "3️⃣ Testing ETag support..."
ETAG=$(curl -s -I "$API_URL/api/projects" | grep -i etag | awk '{print $2}' | tr -d '\r')
if [ -n "$ETAG" ]; then
  echo -e "   ${GREEN}✅ ETag present: $ETAG${RESET}"
  ((PASSED++))
  
  # Test 304 response
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "If-None-Match: $ETAG" "$API_URL/api/projects")
  if [ "$STATUS" = "304" ]; then
    echo -e "   ${GREEN}✅ 304 Not Modified working${RESET}"
    ((PASSED++))
  else
    echo -e "   ${RED}❌ Expected 304, got: $STATUS${RESET}"
    ((FAILED++))
  fi
else
  echo -e "   ${RED}❌ No ETag header found${RESET}"
  ((FAILED+=2))
fi
echo ""

# Test 4: Cache-Control headers (API)
echo "4️⃣ Testing API Cache-Control headers..."
CACHE=$(curl -s -I "$API_URL/api/projects" | grep -i cache-control)
if [ -n "$CACHE" ]; then
  echo -e "   ${GREEN}✅ $CACHE${RESET}"
  ((PASSED++))
else
  echo -e "   ${RED}❌ No Cache-Control header${RESET}"
  ((FAILED++))
fi
echo ""

# Test 5: Preconnect links
echo "5️⃣ Testing preconnect links..."
PRECONNECT=$(curl -s "$WEB_URL" | grep -c "preconnect")
if [ "$PRECONNECT" -gt 0 ]; then
  echo -e "   ${GREEN}✅ Found $PRECONNECT preconnect link(s)${RESET}"
  ((PASSED++))
else
  echo -e "   ${RED}❌ No preconnect links found${RESET}"
  ((FAILED++))
fi
echo ""

# Test 6: DNS prefetch
echo "6️⃣ Testing DNS prefetch..."
DNS_PREFETCH=$(curl -s "$WEB_URL" | grep -c "dns-prefetch")
if [ "$DNS_PREFETCH" -gt 0 ]; then
  echo -e "   ${GREEN}✅ Found $DNS_PREFETCH dns-prefetch link(s)${RESET}"
  ((PASSED++))
else
  echo -e "   ${YELLOW}⚠️  No dns-prefetch links found${RESET}"
  ((FAILED++))
fi
echo ""

# Test 7: Font optimization
echo "7️⃣ Testing font optimization..."
FONT_SWAP=$(curl -s "$WEB_URL/_next/static/css" 2>/dev/null | grep -c "font-display.*swap" || echo 0)
if [ "$FONT_SWAP" -gt 0 ]; then
  echo -e "   ${GREEN}✅ Fonts using display: swap${RESET}"
  ((PASSED++))
else
  echo -e "   ${YELLOW}⚠️  Cannot verify font-display (check Next.js build)${RESET}"
fi
echo ""

# Test 8: GZip compression
echo "8️⃣ Testing compression..."
GZIP=$(curl -s -I -H "Accept-Encoding: gzip" "$API_URL/api/projects" | grep -i "content-encoding: gzip")
if [ -n "$GZIP" ]; then
  echo -e "   ${GREEN}✅ GZip compression enabled${RESET}"
  ((PASSED++))
else
  echo -e "   ${YELLOW}⚠️  GZip not detected (may be handled by proxy)${RESET}"
fi
echo ""

# Test 9: Cookie optimization (no cookies on API lists)
echo "9️⃣ Testing cookie optimization..."
COOKIES=$(curl -s -I "$API_URL/api/projects" | grep -i "set-cookie" | wc -l)
if [ "$COOKIES" -eq 0 ]; then
  echo -e "   ${GREEN}✅ No cookies on list endpoints${RESET}"
  ((PASSED++))
else
  echo -e "   ${YELLOW}⚠️  Found $COOKIES cookie(s) on list endpoint${RESET}"
  ((FAILED++))
fi
echo ""

# Test 10: Security headers
echo "🔟 Testing security headers..."
SECURITY_COUNT=0
if curl -s -I "$WEB_URL" | grep -qi "X-Content-Type-Options"; then
  ((SECURITY_COUNT++))
fi
if curl -s -I "$WEB_URL" | grep -qi "X-Frame-Options"; then
  ((SECURITY_COUNT++))
fi
if curl -s -I "$WEB_URL" | grep -qi "Referrer-Policy"; then
  ((SECURITY_COUNT++))
fi

if [ "$SECURITY_COUNT" -ge 2 ]; then
  echo -e "   ${GREEN}✅ Found $SECURITY_COUNT security headers${RESET}"
  ((PASSED++))
else
  echo -e "   ${YELLOW}⚠️  Only found $SECURITY_COUNT security headers${RESET}"
  ((FAILED++))
fi
echo ""

# Summary
echo "======================================"
echo "📊 Test Results:"
echo -e "   ${GREEN}✅ Passed: $PASSED${RESET}"
if [ "$FAILED" -gt 0 ]; then
  echo -e "   ${RED}❌ Failed: $FAILED${RESET}"
else
  echo -e "   ${GREEN}✨ All tests passed!${RESET}"
fi
echo ""

# Exit code
if [ "$FAILED" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Some tests failed. Review the output above.${RESET}"
  exit 1
else
  echo -e "${GREEN}🎉 All performance optimizations working correctly!${RESET}"
  exit 0
fi
