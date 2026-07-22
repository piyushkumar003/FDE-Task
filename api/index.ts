console.log("Loading api/index");

import { createApp } from '../server/app';

console.log("Imported createApp");

const app = createApp();

console.log("Created app");

export default app;

