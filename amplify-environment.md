# AWS Amplify Environment Variables Setup

## Required Environment Variables

Set these in your Amplify Console under **Environment Variables**:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### OpenAI Configuration (Optional)
```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key (if needed)
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-amplify-domain.amplifyapp.com
```

## How to Set in Amplify Console

1. Go to **AWS Amplify Console**
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Add each variable with the exact names above
5. Click **Save** and **Redeploy**

## Important Notes

- **NEXT_PUBLIC_** variables are available in the browser
- **SUPABASE_SERVICE_ROLE_KEY** should be kept secret (server-side only)
- After setting variables, you must redeploy the app
- Use the same values as your local `.env.local` file

## Verification

After deployment, check that:
- Authentication works (Supabase connection)
- API routes respond correctly
- Calendar functionality works
- Voice features are operational
