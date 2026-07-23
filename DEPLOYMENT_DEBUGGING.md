# Vercel Deployment Troubleshooting & Audit Guide

This document provides a comprehensive audit of potential failure modes when deploying **Nexus AI Workspace Console** to Vercel, along with step-by-step diagnostic checks, configuration corrections, and remediation workflows.

---

## 1. Executive Summary of Common Vercel Deployment Failures

When deploying a full-stack Node.js / Express / Vite application with serverless functions to Vercel, failures generally fall into four categories:
1. **Build Script & Bundling Failures**: Mismatched build outputs, missing dependencies, or incorrect esbuild bundling targets.
2. **Serverless Function Routing & Entry Point Errors**: Misconfigured `vercel.json` rewrites causing 404s or 500 errors on API routes or static assets.
3. **Missing Environment Variables**: Runtime crashes during module initialization due to missing API keys or OAuth secrets.
4. **Node.js Runtime & ES Module / CommonJS Conflicts**: Import/export discrepancies between client-side Vite bundles and server-side CommonJS compiled entry points (`dist/server.cjs`).

---

## 2. Step-by-Step Audit of Build Configuration

### A. `package.json` Scripts Audit
Ensure your `package.json` scripts precisely match the production build requirements for Vercel:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs"
  }
}
```
- **Potential Issue**: If `esbuild` is missing from `devDependencies` or `dependencies`, the build will fail immediately with `command not found: esbuild`.
- **Remediation**: Ensure `esbuild` and `tsx` are declared in `package.json`.

### B. `vercel.json` Routing Audit
For a custom Express server handling both API routes and static frontend assets on Vercel, the routing configuration must route all traffic through the compiled server entry point (`dist/server.cjs`), or use Vercel Serverless Functions.
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/dist/server.cjs"
    }
  ]
}
```
- **Potential Issue**: Pointing rewrites to individual API folders while also running a custom Express server causes route collision. Using a single server entry point via `dist/server.cjs` delegates routing cleanly to Express.

---

## 3. Dependency Version & Lockfile Audit

- **Package Managers**: Vercel automatically detects `package-lock.json`, `pnpm-lock.yaml`, or `bun.lock`. Ensure your lockfile is committed to Git.
- **External Packages**: When bundling with esbuild (`--packages=external`), ensure native Node modules or database connectors (e.g., `express`) are listed in `dependencies` rather than `devDependencies` if Vercel prunes dev dependencies during production builds.

---

## 4. Environment Variables Checklist on Vercel Dashboard

Ensure the following environment variables are configured in your Vercel Project Settings → Environment Variables:

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Google Gemini 2.5 Pro API key for AI agent reasoning. |
| `GOOGLE_CLIENT_ID` | **Yes** | Google Cloud OAuth 2.0 Client ID for Google Workspace access. |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google Cloud OAuth 2.0 Client Secret. |
| `GOOGLE_REDIRECT_URI` | **Yes** | Fully qualified production callback URL (e.g., `https://your-app.vercel.app/api/auth/callback`). |
| `NODE_ENV` | **Auto** | Automatically set to `production` by Vercel. |

---

## 6. Understanding the "Using TypeScript 5.8.3" Log & Serverless Routing Fix

### A. What the Log Means
When you see:
```text
Using TypeScript 5.8.3 (local user-provided)
Using TypeScript 5.8.3 (local user-provided)
```
This is an **informational log** from Vercel's build environment indicating that Vercel has detected TypeScript in your `devDependencies` and is initializing the TypeScript compiler for type checking or compilation. **This log itself is not an error.** However, if a build fails immediately after this log, it means the subsequent build step (`npm run build` or Vercel's serverless function compilation) encountered a configuration mismatch or route conflict.

### B. The Root Cause & Remediation
- **Cause**: Previously, `vercel.json` attempted to route all traffic to a custom bundled Express server (`dist/server.cjs`), which conflicts with Vercel's serverless function architecture where endpoints reside in `/api/`.
- **Solution**: We have reconfigured `vercel.json` and `package.json` to use standard Vercel Serverless Functions (`/api/*`) combined with Vite static frontend bundling (`dist/`).
- **Updated `vercel.json`**:
  ```json
  {
    "version": 2,
    "outputDirectory": "dist",
    "rewrites": [
      {
        "source": "/api/(.*)",
        "destination": "/api/$1"
      },
      {
        "source": "/((?!api/).*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- **Updated `package.json` Build Script**:
  ```json
  "build": "vite build"
  ```
This ensures Vercel compiles `/api/*.ts` files natively into serverless functions and builds the React frontend into `dist/` cleanly without failing.
