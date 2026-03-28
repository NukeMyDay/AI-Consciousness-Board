#!/bin/sh
if [ ! -f /app/data/app.db ]; then
  cp /app/data/app.db.default /app/data/app.db
  echo "Initialized database with seed data"
fi
exec node build
