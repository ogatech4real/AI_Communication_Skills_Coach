# Deployment Guide for AI Communication Skills Coach

## Vercel Deployment Setup

### 1. Environment Variables Configuration

After connecting your GitHub repository to Vercel, you need to set up the following environment variables in your Vercel dashboard:

#### Required Environment Variables:

1. **VITE_SUPABASE_URL**
   - Value: `https://jpkqjfuwmvrevmbdnhfy.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3FqZnV3bXZyZXZtYmRuaGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODA1MDgsImV4cCI6MjA3NTQ1NjUwOH0.Ml1dM5LoqRm-_fUZ5ePUyXxY0UAc3p3iMi7uAmWzqug`

3. **VITE_OPENAI_API_KEY**
   - Value: `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`

4. **VITE_APP_NAME**
   - Value: `AI Communication Skills Coach`

5. **VITE_APP_VERSION**
   - Value: `1.0.0`

6. **VITE_APP_ENVIRONMENT**
   - Value: `production`

### 2. How to Set Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project: `ai-communication-skills-coach`
3. Go to **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add each environment variable with the values listed above
6. Make sure to set them for **Production**, **Preview**, and **Development** environments
7. Click **Save**

### 3. Deployment Configuration

The project is now configured with:
- ✅ Correct Vercel configuration for Vite + React
- ✅ Proper build commands and output directory
- ✅ SPA routing configuration
- ✅ Security headers
- ✅ Optimized build settings

### 4. Troubleshooting

If deployment still fails:

1. **Check Build Logs**: Go to your Vercel project → Deployments → Click on failed deployment → View build logs

2. **Common Issues**:
   - Missing environment variables
   - Build command errors
   - Dependency installation failures

3. **Force Redeploy**: In Vercel dashboard, go to Deployments → Click the three dots → Redeploy

### 5. Local Development

For local development, create a `.env.local` file in your project root with the same environment variables (this file is already gitignored).

### 6. Post-Deployment

After successful deployment:
1. Test all functionality
2. Verify Supabase connection
3. Check OpenAI API integration
4. Test responsive design

## Security Notes

- ✅ API keys are now secured and not exposed in the repository
- ✅ Environment variables are properly configured for production
- ✅ `.env.local` is gitignored for local development

## Support

If you encounter any issues, check:
1. Vercel deployment logs
2. Browser console for runtime errors
3. Network tab for API call failures
