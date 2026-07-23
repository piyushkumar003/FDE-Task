# Netlify Deployment & Environment Variables Guide

This guide provides step-by-step instructions for deploying **Nexus AI Workspace Console** (both frontend Vite SPA and Express backend serverless functions) to **Netlify**.

---

## 1. Required Netlify Build Settings

In your Netlify Site Settings, verify the following configuration matches your build dashboard:
- **Base directory**: `/`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- **Node Version**: `20` (configured automatically via `netlify.toml`)

---

## 2. Required Environment Variables

Configure the following environment variables in your **Netlify Project Settings → Build & deploy → Environment**:

| Environment Variable Name | Required | Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` (or `FDE`) | **Yes** | Google Gemini API key for AI agent reasoning and natural language processing. | `AIzaSy...` |
| `GOOGLE_CLIENT_ID` | **Yes** | Google Cloud OAuth 2.0 Client ID for Google Workspace integration (Calendar, Tasks, Gmail, Drive, Contacts). | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google Cloud OAuth 2.0 Client Secret. | `GOCSPX-xxxxx` |
| `APP_URL` | **Yes** | The public URL of your deployed Netlify site (used for OAuth redirect callbacks). | `https://your-site-name.netlify.app` |

---

## 3. Google Cloud Console & OAuth Redirect URI Setup

To ensure Google OAuth login works correctly on Netlify:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** → **Credentials**.
3. Edit your OAuth 2.0 Client ID.
4. Under **Authorized redirect URIs**, add your Netlify callback URL:
   ```text
   https://your-site-name.netlify.app/api/auth/callback
   ```
5. Save the configuration.

---

## 4. Netlify Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Netlify (**Add new site** → **Import an existing project**).
2. **Set Environment Variables**: Add `GEMINI_API_KEY` (or `FDE`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_URL`.
3. **Deploy**: Click **Deploy site**. Netlify will build the Vite frontend into `dist/` and compile the Express backend into `netlify/functions/api.ts` automatically using `serverless-http`!
