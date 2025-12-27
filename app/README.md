# /app – Application Source Code

This folder contains all application logic for both the frontend and backend:
/app/
├── frontend/   # SPA (Base44 / React-based)
└── backend/    # AWS Lambda functions (API + Worker)
Each subfolder contains its own README with setup and development instructions.

The backend is deployed through AWS Lambda + API Gateway.  
The frontend is deployed through CloudFront + S3 using GitHub Actions.