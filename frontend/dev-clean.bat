@echo off
echo Cleaning Next.js cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Starting development server without Turbopack...
echo (Using webpack for stable HMR)
echo.

pnpm dev
