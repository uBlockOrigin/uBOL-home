# Configuration Template

## Supabase Credentials Setup

Before testing, you need to update the Supabase credentials in the following files:

1. **`custom/background/user-registration.js`**
   - Line ~8: `const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';`
   - Line ~9: `const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';`

2. **`custom/background/notifications.js`**
   - Line ~8: `const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';`
   - Line ~9: `const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';`

## How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon/public key** → Use as `SUPABASE_ANON_KEY` (NOT the service_role key!)

## Quick Setup Script

You can use this script to quickly update credentials:

```bash
# Set your credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"

# Update files (run from uBOL-home directory)
sed -i "s|https://YOUR_PROJECT_ID.supabase.co|$SUPABASE_URL|g" custom/background/user-registration.js
sed -i "s|YOUR_ANON_KEY|$SUPABASE_ANON_KEY|g" custom/background/user-registration.js

sed -i "s|https://YOUR_PROJECT_ID.supabase.co|$SUPABASE_URL|g" custom/background/notifications.js
sed -i "s|YOUR_ANON_KEY|$SUPABASE_ANON_KEY|g" custom/background/notifications.js
```

## Testing Checklist

After updating credentials:

1. ✅ Run database migrations in Supabase (see `database/supabase/SETUP_GUIDE.md`)
2. ✅ Update credentials in both files
3. ✅ Rebuild extension: `./build-scripts/build-custom.sh`
4. ✅ Load extension in Chrome
5. ✅ Check browser console for initialization logs
6. ✅ Create test notification in Supabase SQL Editor
7. ✅ Verify notification appears in browser

## Security Note

- **Never commit** these files with real credentials to git
- Use environment variables or build-time replacement for production
- The `anon` key is safe for frontend use (RLS policies protect the database)
