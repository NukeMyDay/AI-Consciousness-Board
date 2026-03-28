#!/bin/sh

# Run migrations
npx drizzle-kit migrate

# Seed if database is empty (first run)
if [ ! -f /app/data/.seeded ]; then
  npx tsx src/lib/server/db/seed.ts
  npx tsx src/lib/server/db/seed-paths.ts
  npx tsx src/lib/server/db/seed-feeds.ts
  touch /app/data/.seeded
fi

# Start the app
node build
