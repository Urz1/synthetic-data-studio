#!/usr/bin/env node

/**
 * Bundle Size Validator
 * 
 * Checks Next.js build output to ensure bundle sizes meet performance targets:
 * - Critical JS: ≤ 40kB (gzipped)
 * - Total First Load: ≤ 150kB (gzipped)
 * 
 * Run after: npm run build
 */

const fs = require('fs');
const path = require('path');

const TARGETS = {
    CRITICAL_JS: 40 * 1024,      // 40kB
    TOTAL_FIRST_LOAD: 150 * 1024, // 150kB
};

const COLORS = {
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    RED: '\x1b[31m',
    RESET: '\x1b[0m',
};

function formatBytes(bytes) {
    return (bytes / 1024).toFixed(2) + ' kB';
}

function checkBundleSize() {
    console.log('🔍 Analyzing Next.js bundle sizes...\n');

    const buildManifest = path.join(__dirname, '..', '.next', 'build-manifest.json');

    if (!fs.existsSync(buildManifest)) {
        console.error(`${COLORS.RED}❌ Build manifest not found. Run 'npm run build' first.${COLORS.RESET}`);
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf-8'));

    let totalSize = 0;
    let criticalSize = 0;
    const bundles = [];

    // Analyze pages
    for (const [page, files] of Object.entries(manifest.pages)) {
        let pageSize = 0;

        for (const file of files) {
            const filePath = path.join(__dirname, '..', '.next', file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                pageSize += stats.size;

                // First-party code is critical
                if (!file.includes('node_modules') && !file.includes('webpack')) {
                    criticalSize += stats.size;
                }
            }
        }

        bundles.push({ page, size: pageSize });
        totalSize += pageSize;
    }

    // Sort by size
    bundles.sort((a, b) => b.size - a.size);

    // Report results
    console.log('📦 Bundle Analysis:\n');

    bundles.slice(0, 10).forEach(({ page, size }) => {
        const color = size > TARGETS.TOTAL_FIRST_LOAD ? COLORS.RED : COLORS.GREEN;
        console.log(`  ${color}${page.padEnd(40)} ${formatBytes(size)}${COLORS.RESET}`);
    });

    console.log('\n📊 Summary:\n');

    // Critical JS check
    const criticalStatus = criticalSize <= TARGETS.CRITICAL_JS ? '✅' : '❌';
    const criticalColor = criticalSize <= TARGETS.CRITICAL_JS ? COLORS.GREEN : COLORS.RED;
    console.log(`  ${criticalStatus} Critical JS: ${criticalColor}${formatBytes(criticalSize)}${COLORS.RESET} / ${formatBytes(TARGETS.CRITICAL_JS)}`);

    // Total first load check
    const firstPage = bundles[0];
    const totalStatus = firstPage.size <= TARGETS.TOTAL_FIRST_LOAD ? '✅' : '❌';
    const totalColor = firstPage.size <= TARGETS.TOTAL_FIRST_LOAD ? COLORS.GREEN : COLORS.RED;
    console.log(`  ${totalStatus} First Load: ${totalColor}${formatBytes(firstPage.size)}${COLORS.RESET} / ${formatBytes(TARGETS.TOTAL_FIRST_LOAD)}`);

    // Recommendations
    if (criticalSize > TARGETS.CRITICAL_JS || firstPage.size > TARGETS.TOTAL_FIRST_LOAD) {
        console.log(`\n${COLORS.YELLOW}⚠️  Recommendations:${COLORS.RESET}`);

        if (criticalSize > TARGETS.CRITICAL_JS) {
            console.log('  • Use dynamic imports for non-critical components');
            console.log('  • Split large components into separate chunks');
            console.log('  • Review heavy dependencies (lodash, moment, etc.)');
        }

        if (firstPage.size > TARGETS.TOTAL_FIRST_LOAD) {
            console.log('  • Enable tree-shaking for unused exports');
            console.log('  • Use barrel imports carefully (import specific exports)');
            console.log('  • Consider code splitting with Next.js dynamic()');
        }
    } else {
        console.log(`\n${COLORS.GREEN}✨ All bundle size targets met!${COLORS.RESET}`);
    }

    process.exit(criticalSize > TARGETS.CRITICAL_JS || firstPage.size > TARGETS.TOTAL_FIRST_LOAD ? 1 : 0);
}

checkBundleSize();
