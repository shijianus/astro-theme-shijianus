#!/bin/bash
set -e

echo "Setting up Cloudflare D1 database..."
npx wrangler d1 create shijianus-blog-db > d1-output.txt 2>&1
cat d1-output.txt

# Extract the database_id using awk or sed
DB_ID=$(grep -o 'database_id = ".*"' d1-output.txt | cut -d '"' -f 2)

if [ ! -z "$DB_ID" ]; then
  echo "Updating wrangler.jsonc with DB_ID: $DB_ID"
  sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.jsonc
  echo "Applying migrations locally..."
  npx wrangler d1 migrations apply shijianus-blog-db --local
  
  echo "Applying migrations to remote..."
  npx wrangler d1 migrations apply shijianus-blog-db --remote
else
  echo "Failed to create DB or extract ID. Check d1-output.txt."
  exit 1
fi
