#!/bin/sh
set -e

echo "🚀 Sentinel Hub - Starting..."

# Run database migrations.
# - On first run: creates all tables from scratch.
# - On subsequent runs: applies only new migrations (safe to run multiple times).
# - If the DB already has the schema but no migration history (P3005),
#   we baseline it so future migrations can be tracked correctly.
echo "📦 Running database migrations..."

if npx prisma migrate deploy 2>&1; then
  echo "✅ Migrations applied successfully."
else
  echo "⚠️  migrate deploy failed. Attempting to baseline existing schema..."
  # Mark all existing migrations as already applied without re-running them.
  # This handles the case where the DB was created outside of Prisma migrations.
  npx prisma migrate resolve --applied "$(ls prisma/migrations | grep -v migration_lock | head -1)" 2>/dev/null || true
  npx prisma migrate deploy
  echo "✅ Baseline complete."
fi

# Start the Next.js application
echo "🌐 Starting Next.js server..."
exec npm start
