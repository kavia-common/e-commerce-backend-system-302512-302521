#!/bin/bash
cd /home/kavia/workspace/code-generation/e-commerce-backend-system-302512-302521/express_api_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

