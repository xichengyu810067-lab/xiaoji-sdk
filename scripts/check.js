'use strict';

const major = Number(process.versions.node.split('.')[0]);

if (!Number.isInteger(major) || major < 18) {
  console.error('xiaoji-sdk requires Node.js 18 or newer.');
  process.exitCode = 1;
} else {
  console.log(`Node.js ${process.versions.node} satisfies the >=18 contract.`);
}

