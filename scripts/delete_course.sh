#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<EOF
Usage: delete_course.sh -t TOKEN -c COURSE_ID [-u API_BASE] [-y] [--dry-run]

Environment variables:
  TOKEN       JWT token (or set via -t)
  COURSE_ID   Course id to delete (or set via -c)
  API_BASE    API base URL (default: http://localhost:3000)

Options:
  -t, --token       JWT token
  -c, --course-id   Course ID to delete
  -u, --api-base    API base URL (default: http://localhost:3000)
  -y, --yes         Skip confirmation
  --dry-run         Show command without executing
  -h, --help        Show this help

Example:
  TOKEN=\"your_jwt_token\" COURSE_ID=\"642f1a2b3c4d5e6f7a8b9c0d\" \
    ./scripts/delete_course.sh -u http://localhost:3000

EOF
}

# Defaults
API_BASE="http://localhost:3000"
DRY_RUN=0
CONFIRM=1
TOKEN=""
COURSE_ID=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--token)
      TOKEN="$2"; shift 2;;
    -c|--course-id)
      COURSE_ID="$2"; shift 2;;
    -u|--api-base)
      API_BASE="$2"; shift 2;;
    -y|--yes)
      CONFIRM=0; shift;;
    --dry-run)
      DRY_RUN=1; shift;;
    -h|--help)
      show_help; exit 0;;
    *)
      echo "Unknown option: $1" >&2; show_help; exit 1;;
  esac
done

# Allow env vars
TOKEN="${TOKEN:-${TOKEN_ENV:-}}"
COURSE_ID="${COURSE_ID:-${COURSE_ID_ENV:-}}"

# If still empty, read from ENV
TOKEN="${TOKEN:-${TOKEN}}"
COURSE_ID="${COURSE_ID:-${COURSE_ID}}"

if [[ -z "$TOKEN" || -z "$COURSE_ID" ]]; then
  echo "Error: TOKEN and COURSE_ID are required." >&2
  show_help
  exit 1
fi

DELETE_URL="${API_BASE%/}/api/courses/${COURSE_ID}"

if [[ $CONFIRM -eq 1 ]]; then
  read -p "Are you sure you want to DELETE course ${COURSE_ID} at ${DELETE_URL}? [y/N] " ans
  case "$ans" in
    [Yy]|[Yy][Ee][Ss]) ;;
    *) echo "Aborted."; exit 0;;
  esac
fi

CMD=(curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X DELETE "$DELETE_URL" -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/json")

if [[ $DRY_RUN -eq 1 ]]; then
  echo "DRY RUN: ${CMD[*]}"
  exit 0
fi

# Execute
RESPONSE="$(${CMD[*]})" || true
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\r' | sed -n 's/.*HTTP_STATUS:\([0-9][0-9][0-9]\)$/\1/p')
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

if [[ -z "$HTTP_STATUS" ]]; then
  echo "No HTTP status returned. Raw response:\n$RESPONSE"
  exit 1
fi

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "Deleted successfully (HTTP $HTTP_STATUS)"
  echo "$BODY"
  exit 0
else
  echo "Delete failed (HTTP $HTTP_STATUS)" >&2
  echo "$BODY" >&2
  exit 1
fi
