
const assert = require('assert');

// ==========================================
// 1. Mock Logic from content.js (Simulation)
// ==========================================

function isUrlExcluded(excludedUrls, currentHost) {
    if (!Array.isArray(excludedUrls) || excludedUrls.length === 0) {
        return false;
    }
    
    // Normalize current host
    currentHost = currentHost.toLowerCase().replace(/^www\./, '');
    
    return excludedUrls.some(url => {
        const trimmedUrl = url.toLowerCase().trim().replace(/^www\./, '');
        // Support wildcard: *.domain.com or just domain.com
        if (trimmedUrl.startsWith('*.')) {
            const rootDomain = trimmedUrl.slice(2);
            return currentHost === rootDomain || currentHost.endsWith('.' + rootDomain);
        }
        return currentHost === trimmedUrl || currentHost.endsWith('.' + trimmedUrl);
    });
}

// ==========================================
// 2. Test Cases
// ==========================================

console.log('Running BlueLight Filter Pro Test Suite...');

// Test Group 1: URL Exclusion Logic
console.log('\n[Test 1] Testing URL Exclusion Logic...');

const testCases = [
    {
        urls: ['google.com'],
        host: 'google.com',
        expected: true,
        desc: 'Exact match'
    },
    {
        urls: ['google.com'],
        host: 'www.google.com',
        expected: true,
        desc: 'Subdomain match with base domain rule'
    },
    {
        urls: ['*.youtube.com'],
        host: 'www.youtube.com',
        expected: true,
        desc: 'Wildcard subdomain match'
    },
    {
        urls: ['*.youtube.com'],
        host: 'youtube.com',
        expected: true,
        desc: 'Wildcard root domain match'
    },
    {
        urls: ['example.com'],
        host: 'google.com',
        expected: false,
        desc: 'No match'
    },
    {
        urls: [],
        host: 'google.com',
        expected: false,
        desc: 'Empty exclusion list'
    }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = isUrlExcluded(test.urls, test.host);
    if (result === test.expected) {
        console.log(`  ✓ Case ${index + 1}: ${test.desc} - Passed`);
        passed++;
    } else {
        console.error(`  ✗ Case ${index + 1}: ${test.desc} - Failed`);
        console.error(`    Expected: ${test.expected}, Got: ${result}`);
        console.error(`    Rule: ${JSON.stringify(test.urls)}, Host: ${test.host}`);
        failed++;
    }
});

// Test Group 2: Settings Validation (Mock)
console.log('\n[Test 2] Testing Settings Validation...');

function validateSettings(settings) {
    const errors = [];
    if (!settings) return ['Settings object is null/undefined'];
    if (!settings.bgColor) errors.push('Missing bgColor');
    if (!settings.textColor) errors.push('Missing textColor');
    return errors;
}

const settingsTests = [
    {
        settings: { bgColor: '#000000', textColor: '#FFFFFF' },
        expectedErrors: 0
    },
    {
        settings: { bgColor: '#000000' },
        expectedErrors: 1
    },
    {
        settings: null,
        expectedErrors: 1
    }
];

settingsTests.forEach((test, index) => {
    const errors = validateSettings(test.settings);
    if (errors.length === test.expectedErrors) {
        console.log(`  ✓ Case ${index + 1}: Expected ${test.expectedErrors} errors, got ${errors.length} - Passed`);
        passed++;
    } else {
        console.error(`  ✗ Case ${index + 1}: Expected ${test.expectedErrors} errors, got ${errors.length} - Failed`);
        console.error(`    Errors: ${JSON.stringify(errors)}`);
        failed++;
    }
});

console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) {
    console.error('CRITICAL: Some tests failed. Please fix the logic before deployment.');
    process.exit(1);
} else {
    console.log('SUCCESS: All core logic tests passed.');
}
