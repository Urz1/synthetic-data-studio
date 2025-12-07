# HMR (Hot Module Replacement) Troubleshooting

## Fixed Issues

The following changes have been made to prevent HMR errors:

### 1. **Disabled Turbopack** (Main Fix)
- Modified `package.json` dev script to use webpack: `next dev --turbo=false`
- Turbopack in Next.js 16 has known HMR stability issues

### 2. **Webpack Configuration**
- Added stable module IDs and runtime chunking
- Configured file watching with polling
- Prevents module factory deletion during HMR

### 3. **Error Boundaries**
- Added global error boundary that auto-recovers from HMR errors
- App-level error page with user-friendly messages
- Automatic page refresh on HMR errors in development

### 4. **OAuth Callback Fix**
- Changed from `router.push()` to `window.location.href` for hard navigation
- Prevents auth state issues after OAuth completion

## If You Still See HMR Errors

### Quick Fixes (in order of effectiveness):

1. **Full Clean Restart** (Most Effective)
   ```bash
   # Stop dev server (Ctrl+C)
   Remove-Item -Recurse -Force .next
   pnpm dev
   ```

2. **Clear Browser State**
   - F12 → Application → Clear Storage → Clear site data
   - Or use incognito mode

3. **Hard Refresh**
   - `Ctrl + Shift + R` (Windows/Linux)
   - `Cmd + Shift + R` (Mac)

4. **Check for File Locks**
   ```powershell
   # Windows: Restart VS Code or your editor
   # Sometimes editors lock .next files
   ```

### Development Best Practices:

1. **Avoid These Patterns:**
   - ❌ Don't use `Math.random()` in render (SSR mismatch)
   - ❌ Don't call `setState` directly in `useEffect` without guards
   - ❌ Don't import dynamic modules during render

2. **Use These Patterns:**
   - ✅ Use `useId()` for stable IDs
   - ✅ Add `eslint-disable-next-line react-hooks/exhaustive-deps` for intentional effect deps
   - ✅ Use `window.location.href` for post-auth redirects

3. **File Save Practices:**
   - Save one file at a time when possible
   - Wait for HMR to complete before saving another file
   - If multiple files need changing, stop dev server → make changes → restart

### Still Having Issues?

If HMR errors persist after these fixes:

1. Check if it's a specific component causing issues
2. Try commenting out recent changes to isolate the problem
3. Verify all imports are correct and modules exist
4. Check `node_modules` integrity: `pnpm install --force`

### Emergency Fallback

If nothing else works, you can temporarily disable Fast Refresh:

```javascript
// next.config.mjs
const nextConfig = {
  // ... other config
  reactStrictMode: false,
  
  // Add this to disable Fast Refresh
  experimental: {
    reactRefresh: false,
  },
}
```

⚠️ This will require full page reloads on every change, so only use as a last resort.
