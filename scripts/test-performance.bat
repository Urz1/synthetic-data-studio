@echo off
REM Performance Testing Script for Windows
REM Tests all zero-latency optimizations

setlocal enabledelayedexpansion

set API_URL=%1
if "%API_URL%"=="" set API_URL=http://localhost:8000

set WEB_URL=%2
if "%WEB_URL%"=="" set WEB_URL=http://localhost:3000

set PASSED=0
set FAILED=0

echo.
echo 🧪 Testing Performance Optimizations
echo ======================================
echo API URL: %API_URL%
echo Web URL: %WEB_URL%
echo.

REM Test 1: No redirects
echo 1️⃣ Testing for 307 redirects...
curl -s -o nul -w "%%{http_code}" "%API_URL%/api/projects" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="200" (
    echo    ✅ No redirects (200 OK^)
    set /a PASSED+=1
) else (
    echo    ❌ Got status code: %STATUS%
    set /a FAILED+=1
)
del temp_status.txt
echo.

REM Test 2: Trailing slash handling
echo 2️⃣ Testing trailing slash handling...
curl -s -o nul -w "%%{http_code}" "%API_URL%/api/projects/" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="200" (
    echo    ✅ Both /api/projects and /api/projects/ return 200
    set /a PASSED+=1
) else (
    echo    ❌ Trailing slash got: %STATUS%
    set /a FAILED+=1
)
del temp_status.txt
echo.

REM Test 3: ETag support
echo 3️⃣ Testing ETag support...
curl -s -I "%API_URL%/api/projects" | findstr /i "etag" > temp_etag.txt
set /p ETAG_LINE=<temp_etag.txt
if not "%ETAG_LINE%"=="" (
    echo    ✅ ETag present
    set /a PASSED+=1
    
    REM Extract ETag value (basic parsing)
    for /f "tokens=2" %%a in ("!ETAG_LINE!") do set ETAG=%%a
    
    REM Test 304 response
    curl -s -o nul -w "%%{http_code}" -H "If-None-Match: !ETAG!" "%API_URL%/api/projects" > temp_status.txt
    set /p STATUS=<temp_status.txt
    if "!STATUS!"=="304" (
        echo    ✅ 304 Not Modified working
        set /a PASSED+=1
    ) else (
        echo    ❌ Expected 304, got: !STATUS!
        set /a FAILED+=1
    )
    del temp_status.txt
) else (
    echo    ❌ No ETag header found
    set /a FAILED+=2
)
del temp_etag.txt
echo.

REM Test 4: Cache-Control headers
echo 4️⃣ Testing API Cache-Control headers...
curl -s -I "%API_URL%/api/projects" | findstr /i "cache-control" > temp_cache.txt
set /p CACHE=<temp_cache.txt
if not "%CACHE%"=="" (
    echo    ✅ Cache-Control: %CACHE%
    set /a PASSED+=1
) else (
    echo    ❌ No Cache-Control header
    set /a FAILED+=1
)
del temp_cache.txt
echo.

REM Test 5: Preconnect links
echo 5️⃣ Testing preconnect links...
curl -s "%WEB_URL%" | findstr /i "preconnect" > temp_preconnect.txt
for /f %%a in ('type temp_preconnect.txt ^| find /c /v ""') do set COUNT=%%a
if !COUNT! gtr 0 (
    echo    ✅ Found !COUNT! preconnect link(s^)
    set /a PASSED+=1
) else (
    echo    ❌ No preconnect links found
    set /a FAILED+=1
)
del temp_preconnect.txt
echo.

REM Test 6: DNS prefetch
echo 6️⃣ Testing DNS prefetch...
curl -s "%WEB_URL%" | findstr /i "dns-prefetch" > temp_dns.txt
for /f %%a in ('type temp_dns.txt ^| find /c /v ""') do set COUNT=%%a
if !COUNT! gtr 0 (
    echo    ✅ Found !COUNT! dns-prefetch link(s^)
    set /a PASSED+=1
) else (
    echo    ⚠️  No dns-prefetch links found
    set /a FAILED+=1
)
del temp_dns.txt
echo.

REM Test 7: GZip compression
echo 7️⃣ Testing compression...
curl -s -I -H "Accept-Encoding: gzip" "%API_URL%/api/projects" | findstr /i "content-encoding: gzip" > temp_gzip.txt
set /p GZIP=<temp_gzip.txt
if not "%GZIP%"=="" (
    echo    ✅ GZip compression enabled
    set /a PASSED+=1
) else (
    echo    ⚠️  GZip not detected (may be handled by proxy^)
)
del temp_gzip.txt
echo.

REM Test 8: Security headers
echo 8️⃣ Testing security headers...
set SECURITY_COUNT=0
curl -s -I "%WEB_URL%" > temp_headers.txt
findstr /i "X-Content-Type-Options" temp_headers.txt >nul 2>&1
if !errorlevel!==0 set /a SECURITY_COUNT+=1
findstr /i "X-Frame-Options" temp_headers.txt >nul 2>&1
if !errorlevel!==0 set /a SECURITY_COUNT+=1
findstr /i "Referrer-Policy" temp_headers.txt >nul 2>&1
if !errorlevel!==0 set /a SECURITY_COUNT+=1
del temp_headers.txt

if !SECURITY_COUNT! geq 2 (
    echo    ✅ Found !SECURITY_COUNT! security headers
    set /a PASSED+=1
) else (
    echo    ⚠️  Only found !SECURITY_COUNT! security headers
    set /a FAILED+=1
)
echo.

REM Summary
echo ======================================
echo 📊 Test Results:
echo    ✅ Passed: %PASSED%
if %FAILED% gtr 0 (
    echo    ❌ Failed: %FAILED%
    echo.
    echo ⚠️  Some tests failed. Review the output above.
    exit /b 1
) else (
    echo    ✨ All tests passed!
    echo.
    echo 🎉 All performance optimizations working correctly!
    exit /b 0
)
