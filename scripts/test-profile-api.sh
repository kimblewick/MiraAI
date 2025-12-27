#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}==> Getting Cognito Configuration from AWS...${NC}"

# Get User Pool ID by name
USER_POOL_ID=$(aws cognito-idp list-user-pools \
  --max-results 10 \
  --region us-east-1 \
  --query 'UserPools[?Name==`mira-user-pool-dev`].Id' \
  --output text)

if [ -z "$USER_POOL_ID" ]; then
    echo -e "${RED}✗ User Pool 'mira-user-pool-dev' not found${NC}"
    echo "Available User Pools:"
    aws cognito-idp list-user-pools \
      --max-results 10 \
      --region us-east-1 \
      --query 'UserPools[].[Name,Id]' \
      --output table
    exit 1
fi

echo -e "${GREEN}✓ User Pool ID: $USER_POOL_ID${NC}"

# Get App Client ID
APP_CLIENT_ID=$(aws cognito-idp list-user-pool-clients \
  --user-pool-id $USER_POOL_ID \
  --region us-east-1 \
  --query 'UserPoolClients[0].ClientId' \
  --output text)

if [ -z "$APP_CLIENT_ID" ]; then
    echo -e "${RED}✗ App Client not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ App Client ID: $APP_CLIENT_ID${NC}"

# Test credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPassword123!"

echo -e "\n${BLUE}==> Creating test user...${NC}"

# Try to create user (ignore error if already exists)
CREATE_RESULT=$(aws cognito-idp sign-up \
  --client-id $APP_CLIENT_ID \
  --username $TEST_EMAIL \
  --password $TEST_PASSWORD \
  --user-attributes Name=email,Value=$TEST_EMAIL \
  --region us-east-1 2>&1 || true)

if [[ $CREATE_RESULT == *"UsernameExistsException"* ]]; then
    echo -e "${YELLOW}⚠ User already exists${NC}"
else
    echo -e "${GREEN}✓ User created${NC}"
fi

# Confirm user
CONFIRM_RESULT=$(aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $USER_POOL_ID \
  --username $TEST_EMAIL \
  --region us-east-1 2>&1 || true)

if [[ $CONFIRM_RESULT == *"NotAuthorizedException"* ]] || [[ $CONFIRM_RESULT == *"already confirmed"* ]]; then
    echo -e "${YELLOW}⚠ User already confirmed${NC}"
else
    echo -e "${GREEN}✓ User confirmed${NC}"
fi

echo -e "\n${BLUE}==> Checking App Client auth flows...${NC}"

# Check if USER_PASSWORD_AUTH is enabled
AUTH_FLOWS=$(aws cognito-idp describe-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $APP_CLIENT_ID \
  --region us-east-1 \
  --query 'UserPoolClient.ExplicitAuthFlows' \
  --output json)

if [[ ! $AUTH_FLOWS =~ "ALLOW_USER_PASSWORD_AUTH" ]]; then
    echo -e "${YELLOW}⚠ Enabling USER_PASSWORD_AUTH...${NC}"
    aws cognito-idp update-user-pool-client \
      --user-pool-id $USER_POOL_ID \
      --client-id $APP_CLIENT_ID \
      --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
      --region us-east-1 > /dev/null
    echo -e "${GREEN}✓ Auth flow enabled${NC}"
else
    echo -e "${GREEN}✓ Auth flow already enabled${NC}"
fi

echo -e "\n${BLUE}==> Getting JWT token...${NC}"

# Get token
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $APP_CLIENT_ID \
  --auth-parameters USERNAME=$TEST_EMAIL,PASSWORD=$TEST_PASSWORD \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
    echo -e "${RED}✗ Failed to get token${NC}"
    echo "Debug: Try logging in manually:"
    echo "  aws cognito-idp initiate-auth \\"
    echo "    --auth-flow USER_PASSWORD_AUTH \\"
    echo "    --client-id $APP_CLIENT_ID \\"
    echo "    --auth-parameters USERNAME=$TEST_EMAIL,PASSWORD=$TEST_PASSWORD \\"
    echo "    --region us-east-1"
    exit 1
fi

echo -e "${GREEN}✓ Token obtained${NC}"
echo "Token (first 50 chars): ${TOKEN:0:50}..."

# Save token
cd ..
echo $TOKEN > token.txt
echo "Token saved to: token.txt"

echo -e "\n${BLUE}==> Testing Profile API...${NC}"

API_URL="https://jwlaxtz15k.execute-api.us-east-1.amazonaws.com/profile"

# Test profile creation
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "birth_date": "1990-01-15",
    "birth_time": "14:30",
    "birth_location": "New York, NY",
    "birth_country": "United States"
  }')

# Extract HTTP code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
if command -v jq &> /dev/null; then
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo "$BODY"
fi

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Profile created successfully! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "\n${RED}✗ Authentication failed (401)${NC}"
    echo "This usually means:"
    echo "  - JWT token is invalid or expired"
    echo "  - API Gateway authorizer is not configured correctly"
elif [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "\n${RED}✗ Validation failed (400)${NC}"
    echo "Check the error details above"
else
    echo -e "\n${RED}✗ Request failed (HTTP $HTTP_CODE)${NC}"
fi

echo -e "\n${BLUE}==> Useful commands:${NC}"
echo "View Lambda logs:"
echo "  aws logs tail /aws/lambda/mira-api-dev --region us-east-1 --follow"
echo ""
echo "Test again with saved token:"
echo "  TOKEN=\$(cat token.txt)"
echo "  curl -H \"Authorization: Bearer \$TOKEN\" -H \"Content-Type: application/json\" \\"
echo "    -X POST $API_URL \\"
echo "    -d '{\"birth_date\":\"1990-01-15\",\"birth_time\":\"14:30\",\"birth_location\":\"New York, NY\",\"birth_country\":\"United States\"}'"
echo ""
echo "Verify profile in DynamoDB:"
echo "  aws dynamodb scan --table-name mira-user-profiles-dev --region us-east-1"