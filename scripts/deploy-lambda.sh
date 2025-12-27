#!/bin/bash
# Lambda Deployment Script for Mira Backend
# Usage: ./deploy-lambda.sh [--skip-test]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LAMBDA_FUNCTION_NAME="mira-api-dev"
AWS_REGION="us-east-1"
API_GATEWAY_URL="https://jwlaxtz15k.execute-api.us-east-1.amazonaws.com"
BACKEND_DIR="app/backend"
DIST_DIR="dist"
ZIP_FILE="lambda-api.zip"

# Parse arguments
SKIP_TEST=false
if [[ "$1" == "--skip-test" ]]; then
    SKIP_TEST=true
fi

# Helper functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found. Please run this script from project root."
    echo "Current directory: $(pwd)"
    echo "Expected structure: team_chengdu_boyz/scripts/deploy-lambda.sh"
    exit 1
fi

print_step "Starting Lambda deployment for ${LAMBDA_FUNCTION_NAME}..."

# Step 1: Clean previous build
print_step "Cleaning previous build..."
cd "$BACKEND_DIR"
rm -rf "$DIST_DIR" "$ZIP_FILE"
print_success "Cleaned build artifacts"

# Step 2: Create distribution directory
print_step "Creating distribution directory..."
mkdir -p "$DIST_DIR"
print_success "Distribution directory created"

# Step 3: Copy application code
print_step "Copying application code..."
cp handler.py "$DIST_DIR/"
cp -r api common "$DIST_DIR/"
print_success "Application code copied"

# Step 4: Install dependencies
print_step "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt \
        -t "$DIST_DIR/" \
        --platform manylinux2014_x86_64 \
        --python-version 3.10 \
        --implementation cp \
        --only-binary=:all: \
        --quiet
    print_success "Dependencies installed"
else
    print_warning "No requirements.txt found, skipping dependencies"
fi

# Step 5: Create deployment package
print_step "Creating deployment package..."
cd "$DIST_DIR"
zip -r "../$ZIP_FILE" . -q
cd ..
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
print_success "Deployment package created (${ZIP_SIZE})"

# Step 6: Upload to Lambda
print_step "Uploading to Lambda function: ${LAMBDA_FUNCTION_NAME}..."
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$AWS_REGION" \
    --no-cli-pager > /dev/null

print_success "Code uploaded successfully"

# Step 7: Wait for Lambda to be ready
print_step "Waiting for Lambda to be ready..."
sleep 10
print_success "Lambda function ready"

# Step 8: Test the deployment
if [ "$SKIP_TEST" = false ]; then
    print_step "Testing health endpoint..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_GATEWAY_URL}/health")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_success "Health check passed (HTTP ${HTTP_CODE})"
        
        # Show response
        RESPONSE=$(curl -s "${API_GATEWAY_URL}/health")
        echo -e "${GREEN}Response:${NC} $RESPONSE"
    else
        print_error "Health check failed (HTTP ${HTTP_CODE})"
        echo "Run the following to check logs:"
        echo "  aws logs tail /aws/lambda/${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION} --since 2m"
        exit 1
    fi
else
    print_warning "Skipping health check test"
fi

# Step 9: Show Lambda info
print_step "Lambda function information:"
aws lambda get-function \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --query '{Runtime:Configuration.Runtime,MemorySize:Configuration.MemorySize,Timeout:Configuration.Timeout,LastModified:Configuration.LastModified}' \
    --output table

# Return to project root
cd ../..

echo ""
print_success "Deployment completed successfully! 🚀"
echo ""
echo "API Endpoints:"
echo "  Health: ${API_GATEWAY_URL}/health"
echo ""
echo "Useful commands:"
echo "  View logs:    aws logs tail /aws/lambda/${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION} --follow"
echo "  Test health:  curl ${API_GATEWAY_URL}/health"
echo ""