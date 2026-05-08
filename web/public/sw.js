/* Minimal Service Worker to resolve 404 errors in the console */

self.addEventListener('install', (event) => {
    // console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
    // console.log('Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
    // No-op - just pass through
});
