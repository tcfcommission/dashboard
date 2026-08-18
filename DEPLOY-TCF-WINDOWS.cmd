@echo off
setlocal
title TCF Command Centre - Vercel Deployment
cd /d "%~dp0"

echo.
echo =====================================================
echo   TCF COMMAND CENTRE - DIRECT VERCEL DEPLOYMENT
echo =====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install the current Node.js LTS from https://nodejs.org/ then run this file again.
  pause
  exit /b 1
)

echo [1/4] Signing into Vercel...
call npx --yes vercel@59.1.4 login
if errorlevel 1 goto :failed

echo.
echo [2/4] Linking the existing tcf6/dashboard project...
call npx --yes vercel@59.1.4 link --yes --project dashboard --scope tcf6
if errorlevel 1 goto :failed

echo.
echo [3/4] Checking production environment-variable names...
call npx --yes vercel@59.1.4 env ls production
echo.
echo The production project needs these core variable names:
echo   NEXT_PUBLIC_SUPABASE_URL
echo   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
echo   SUPABASE_SERVICE_ROLE_KEY
echo   CRON_SECRET
echo   TCF_OWNER_USER_ID
echo   TCF_INGEST_SECRET
echo.
echo Provider variables such as Stripe and social API credentials can be added later.
echo Real secret values must be entered directly in Vercel, never pasted into chat.
echo.
start "" "https://vercel.com/tcf6/dashboard/settings/environment-variables"
echo Add any missing core variables in the Vercel page that just opened.
echo When they are saved, return here and press any key to deploy.
pause >nul

echo.
echo [4/4] Deploying the verified build to production...
call npx --yes vercel@59.1.4 deploy --prod --yes --scope tcf6
if errorlevel 1 goto :failed

echo.
echo =====================================================
echo   DEPLOYMENT FINISHED
echo =====================================================
echo Open: https://dashboard-navy-seven-25.vercel.app/
echo.
pause
exit /b 0

:failed
echo.
echo Deployment stopped because the previous step failed.
echo Nothing was deleted. Take a screenshot of this window and send it to Codex.
pause
exit /b 1
