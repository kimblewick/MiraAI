## Repository Overview

This repository contains the full implementation of **Mira**, an AI-powered astrology companion built on AWS serverless architecture.

### Directory Structure

- `/.github` – GitHub configuration
  - `/workflows` – CI/CD pipelines
  - `pull_request_template.md` – PR template with required sections

- `/app` – Application source code
  - `/frontend` – React + Vite SPA with Tailwind CSS, shadcn/ui, and Cognito OAuth
  - `/backend` – Python 3.10 AWS Lambda functions (API handlers and shared utilities)

- `/docs` – Documentation
  - `/final` – Final report, architecture diagrams, budget, and screenshots
  - `project_progress.md` – Earlier phase documentation and milestones
  - `branching.md` – Git branching strategy

- `/infra` – Infrastructure as Code
  - `/terraform` – Terraform modules for AWS resources (VPC, Lambda, DynamoDB, Cognito, API Gateway, S3, Bedrock VPC endpoint, Secrets Manager)

- `/roles` – IAM policies
  - `AdministratorAccess.json` – Admin role policy
  - `PowerUserAccess.json` – Power user role policy

- `/scripts` – Automation scripts
  - `deploy-lambda.sh` – Backend Lambda deployment script
  - `test-profile-api.sh` – API testing script

- `.gitignore` – Specifies files and directories excluded from version control 

---

## How to Run the Application

### Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.10+** – Backend Lambda development
- **Node.js 18+** – Frontend development
- **npm** – Package management for frontend
- **Terraform 1.x** – Infrastructure as Code
- **AWS CLI v2** – Configured with valid credentials (`aws configure`)
- **Git** – Version control

### Local Setup

1. Clone and enter the repo
   ```
   git clone https://github.com/CloudComputingMIA2025/team_chengdu_boyz.git
   cd team_chengdu_boyz
   ```

2. Set up the backend (optional virtualenv recommended)
   ```
   cd app/backend
   python3 -m venv .venv
   source .venv/bin/activate        
   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
   The backend Lambda talks directly to AWS services, so ensure your shell has `AWS_PROFILE` or env vars pointing at an account with the required permissions/secrets.

3. Set up the frontend
   ```
   cd ../frontend
   npm install
   cp .env.example .env
   ```
   Update `.env` with non-secret values for:
   - `VITE_API_BASE_URL` – e.g. `https://<api-id>.execute-api.us-east-1.amazonaws.com`
   - `VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID`, `VITE_AWS_REGION`
   - Optional: `VITE_COGNITO_CALLBACK_URL`, `VITE_COGNITO_LOGOUT_URL`

4. Run the frontend locally
   ```
   cd ../app/frontend
   npm run build
   npm run dev
   ```
   The Vite dev server runs on `http://localhost:5173` and proxies API calls to the URL defined in `VITE_API_BASE_URL`. Backend handlers are typically exercised through the deployed API or via unit tests.

### Deploying to the Cloud

1. Provision infrastructure with Terraform
   ```b
   cd infra/terraform
   terraform init
   terraform fmt -recursive
   terraform validate
   terraform plan \
     -var="astrologer_api_key=<RAPID_API_KEY>" \
     -out tfplan
   terraform apply tfplan
   ```
   This creates the VPC, DynamoDB tables, Cognito pool, API Gateway, Lambda, S3 buckets, Bedrock VPC endpoint, and supporting resources. The backend state is stored in the S3 bucket defined in `backend.tf`.

2. Deploy the Lambda code
   ```
   cd ../../scripts
   ./deploy-lambda.sh 
   ```
   The script bundles `app/backend`, installs dependencies into `dist/`, uploads the zip to `mira-api-dev`, waits for the update, and calls the `/health` endpoint exposed via API Gateway.

3. Deploy the frontend
   ```
   cd ../app/frontend
   npm run build
   aws s3 sync dist/ s3://mira-dev-frontend-us-east-1 --delete
   aws cloudfront create-invalidation \
     --distribution-id <distribution_id> \
     --paths "/*"
   ```
   Replace the bucket and distribution values with the outputs from Terraform (`cloudfront_distribution_id`, `cloudfront_domain_name`). After invalidation, the SPA is available at the CloudFront URL.

4. Post-deploy verification
   - Confirm `https://<cloudfront-domain>/` loads the SPA.
   - Hit `https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com/health` to ensure the Lambda responds `200`.
   - Validate Cognito Hosted UI login at `https://<domain>.auth.us-east-1.amazoncognito.com/oauth2/authorize`.

### Running Tests

- Backend
  ```
  cd app/backend
  black . --check
  flake8 . --max-line-length=120 --ignore=E203,W503
  pytest                           # API wrapper/unit tests
  python common/api_wrapper.py     # quick smoke test for decorator
  ```

- Frontend
  ```
  cd app/frontend
  npm run lint
  npm run build
  ```

- Infrastructure
  ```
  cd infra/terraform
  terraform fmt -check -recursive
  terraform validate
  tfsec .                          
  ```

CI mirrors these commands through `.github/workflows/ci.yml`: Python syntax/Black/Flake8/isort, npm install + ESLint + Vite build, Terraform fmt/validate/tfsec, and repository-wide secret scans.

---

## Testing Summary

- **Unit tests** – Focused on shared backend utilities such as `common/api_wrapper.py`, ensuring request parsing, error handling, and response formatting behave correctly. These can be expanded with more Lambda-specific tests.

- **Static analysis / linting** – Black, Flake8, and isort enforce Python style; ESLint (with React hooks rules) keeps the frontend consistent; Vite build ensures the SPA remains production-ready. Terraform formatting/validation prevents misconfigurations from landing in `main`.

- **Integration checks** – `deploy-lambda.sh` automatically hits the `/health` endpoint after updating the Lambda. Frontend build + CloudFront invalidation serves as a sanity check that the SPA compiles against the current configuration. Terraform applies run through automated `tfsec` scans for infrastructure security.

- **CI/CD integration** – Every PR triggers the full CI workflow (PR template compliance, backend/frontend/Terraform/security jobs). On push to `dev` or `main`, the CD workflow redeploys Lambda, syncs the frontend to S3/CloudFront, runs Terraform with remote state, and publishes a summary of the deployment results.

- **Bugs caught via testing** – The linting and format checks routinely surface unused imports, inconsistent hook dependencies, or Terraform style drifts before review. The Lambda package-size guardrails in CI help avoid uploads that would exceed AWS limits, and tfsec has flagged permissive IAM/S3 defaults during development.
