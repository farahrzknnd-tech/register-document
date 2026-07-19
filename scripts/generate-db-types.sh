#!/usr/bin/env bash

set -Eeuo pipefail

OUTPUT_FILE="src/lib/database.types.ts"
TEMP_FILE="$(mktemp)"

cleanup() {
  rm -f "$TEMP_FILE"
}

trap cleanup EXIT

echo "Generating Supabase database types..."

supabase gen types typescript --local > "$TEMP_FILE"

if [[ ! -s "$TEMP_FILE" ]]; then
  echo "ERROR: Supabase menghasilkan file types kosong."
  exit 1
fi

if ! grep -Eq 'export (type|interface) Database' "$TEMP_FILE"; then
  echo "ERROR: Generated types tidak mengekspor Database."
  exit 1
fi

mv "$TEMP_FILE" "$OUTPUT_FILE"
trap - EXIT

echo "Database types generated: $OUTPUT_FILE"
