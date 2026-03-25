document.addEventListener('DOMContentLoaded', () => {
    // Apply translations
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }

    // Display extension version
    const versionElement = document.getElementById('extVersion');
    if (versionElement) {
        const manifest = chrome.runtime.getManifest();
        versionElement.textContent = manifest.version;
    }

    // You can add more options-specific logic here if needed
    // For example, loading/saving specific settings that are only on the options page
}); 