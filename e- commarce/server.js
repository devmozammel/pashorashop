const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';

// cPanel provides the port via process.env.PORT
// If not provided, default to 3000
const port = process.env.PORT || 3000;

// The standalone server is located in .next/standalone/server.js
// But usually, we copy the contents of .next/standalone to the root.
// We want this script to be the entry point for cPanel Node.js Selector.

console.log('Starting Next.js standalone server on port:', port);

// Point to the standalone server
// Note: In some cPanel setups, you might need to use path.join
require('./.next/standalone/server.js');
