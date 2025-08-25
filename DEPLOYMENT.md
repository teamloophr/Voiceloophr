# 🚀 AWS Amplify Deployment Guide

## Prerequisites

- AWS Account with Amplify access
- GitHub repository with your VoiceLoopHR code
- Supabase project configured
- Environment variables ready

## Step 1: Connect Repository

1. **Go to AWS Amplify Console**
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click **New app** → **Host web app**

2. **Connect to GitHub**
   - Choose **GitHub** as your repository source
   - Authorize AWS to access your GitHub account
   - Select your `VoiceLoopHR` repository
   - Choose the branch (usually `main` or `master`)

## Step 2: Configure Build Settings

1. **Build Settings**
   - Amplify will auto-detect Next.js
   - Use the `amplify.yml` file we created
   - Build command: `pnpm build`
   - Output directory: `.next`

2. **Environment Variables**
   - Go to **App settings** → **Environment variables**
   - Add all required variables (see `amplify-environment.md`)
   - **Important**: Set `NEXT_PUBLIC_APP_URL` to your Amplify domain

## Step 3: Deploy

1. **Review and Deploy**
   - Review your build settings
   - Click **Save and deploy**
   - Wait for build to complete (usually 5-10 minutes)

2. **Monitor Build**
   - Watch the build logs for any errors
   - Common issues: missing environment variables, build failures

## Step 4: Post-Deployment

1. **Test Your App**
   - Navigate to your Amplify URL
   - Test all major features:
     - ✅ Authentication (sign in/sign up)
     - ✅ Calendar functionality
     - ✅ Voice features
     - ✅ Document upload
     - ✅ AI assistant

2. **Custom Domain (Optional)**
   - Go to **Domain management**
   - Add your custom domain
   - Configure SSL certificate

## Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify `pnpm` is available in build environment
- Check build logs for specific error messages

### Runtime Errors
- Verify Supabase connection
- Check API routes are working
- Ensure environment variables are accessible

### Performance Issues
- Enable Amplify's CDN
- Optimize images and assets
- Monitor build times and bundle sizes

## Environment Variables Reference

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app.amplifyapp.com

# Optional
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
```

## Support

- **AWS Amplify Docs**: [https://docs.aws.amazon.com/amplify/](https://docs.aws.amazon.com/amplify/)
- **Next.js Deployment**: [https://nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **GitHub Issues**: Create an issue in your repository

---

**Your VoiceLoopHR app is now ready for production! 🎉**
