#Project Progress Summary

In this markdown you should explain the following subsections in detail.

**Changes made since the Project Proposal**
> We made three key technical decisions after the initial proposal:  
> AI Service: Switched from OpenAI API to Amazon Bedrock for better AWS integration and multi-model flexibility. Bedrock provides native access to Claude and other models, simplifying our > serverless architecture.  
> Security Architecture: Added VPC with PrivateLink endpoints to protect sensitive user data. Lambda functions now run in private subnets and access AWS services through VPC endpoints instead of public internet, enhancing data privacy.  
> Performance Optimization: Designed caching mechanism (30-day TTL) for astrology charts to reduce external API costs and improve response times. Also added async processing infrastructure (SQS + EventBridge) for long-running tasks. Infrastructure is deployed; business logic implementation is ongoing.  
> Astrology API: Selected the specific Astrologer API (https://github.com/g-battaglia/Astrologer-API) which provides comprehensive birth chart generation with SVG visualization.  
> These changes demonstrate core course concepts (VPC, security, cost optimization, reliability) while keeping our original project vision.  

**How the Project Proposal feedback was incorporated**
> Professor GS provided feedback on our proposal and raised important questions during our Nov 14 architecture review regarding LLM model selection and database choice.  
> LLM Model Selection: In response to Prof GS's inquiry, we evaluated multiple options and selected Amazon Bedrock. This decision was based on its native AWS integration, multi-model support (including Claude), and simplified authentication through IAM rather than managing external API keys.  
> Database Selection: When asked about our database choice, we compared DynamoDB with alternatives (RDS, Aurora). We confirmed DynamoDB as the optimal choice because: (1) it fits our serverless architecture with automatic scaling, (2) our access patterns are simple key-value lookups (user profiles by user_id), (3) it requires no server management or capacity planning, and (4) pay-per-request billing aligns with our expected low-to-moderate traffic.  
> These discussions validated our technical approach and helped us articulate the rationale behind our architectural decisions.  

**Describe the minimal set of features your application needs to validate the idea.**
> Our MVP validates the core concept of AI-powered astrology guidance through five essential features:  
> User Authentication: Cognito-based login for secure, personalized sessions.  
> Profile Creation: Users input birth information (date, time, location, country), which is validated, stored in DynamoDB, and automatically calculates zodiac sign.  
> Astrology Chart Generation: Integration with Astrologer API to generate personalized birth charts, stored in S3.  
> AI Chat Response: Users ask questions and receive personalized guidance from Bedrock (Claude model) based on their astrological data.  
> Chat Interface: Frontend displays conversations and visualizes astrology charts.  
> These features demonstrate how AI can combine with astrological interpretation to provide accessible emotional support.  

**Completed work**
> Infrastructure: Deployed complete AWS architecture using Terraform, including VPC with multi-AZ setup (2 public subnets, 2 private subnets), NAT Gateway, Internet Gateway, and VPC endpoints for secure service access. Created DynamoDB tables (UserProfiles, Conversations), S3 buckets for frontend and artifacts, Cognito User Pool with Hosted UI, API Gateway with JWT authorizer, Lambda infrastructure modules, EventBridge event bus, SQS queue with DLQ, and Secrets Manager for API key storage.  
> Backend: Implemented Python project structure with API Gateway event handler wrapper, health check endpoint, and user profile creation endpoint. The profile endpoint validates user input (birth date, time, location, country), calculates zodiac signs, extracts user identity from JWT tokens, and stores data in DynamoDB. Created automated deployment scripts and Cognito integration test scripts. All unit tests passing (26/26 tests across validation and zodiac calculation modules).  
> Frontend: Initialized React application using Base44 framework, configured environment variables for AWS services, and integrated Cognito Hosted UI for authentication. Implemented profile creation form with proper validation and user experience flow.  
> DevOps: Established GitHub repository structure following course requirements, implemented branching strategy with PR templates, and created CI/CD pipeline with 5 automated checks (PR template validation, Python syntax, frontend build, Terraform validation, secrets scanning). All code quality checks (Black formatting, Flake8 linting) are enforced.  
> Integration Testing: Successfully tested end-to-end flow from user authentication through Cognito, profile creation via API Gateway, Lambda processing, and DynamoDB storage. Verified JWT token extraction and API security measures are working correctly.  

**Partial work**
> Astrology API Client (Backend - In Progress): Currently implementing the Python client module for the external Astrologer API integration. This client will handle HTTP requests through NAT Gateway, implement retry logic with exponential backoff, and enforce timeouts. The module structure is defined, and we are working on the API call implementation and error handling.
> Terraform Infrastructure Adjustments (Infrastructure - Ongoing): While core infrastructure is deployed, we continue making incremental adjustments as we integrate different components. Recent updates include adding POST /profile route to API Gateway and fine-tuning Lambda IAM permissions based on actual usage patterns.
> Frontend Integration (Frontend - In Progress): The React application structure is complete with Cognito authentication working. Currently integrating the profile creation flow with the backend API and optimizing page layouts for better user experience. The basic UI framework is functional, but refinements are ongoing based on backend API availability.
> All partial work is on track for completion before the Nov 23 MVP deadline.


**Challenges or blockers**
> Time Constraints: The primary challenge is the tight timeline for MVP delivery (Nov 23 deadline). With multiple components requiring integration, coordinating development across infrastructure, backend, and frontend has been time-intensive.  
> Integration Issues: We encountered several technical challenges during component integration. Lambda dependency packaging required troubleshooting Python 3.10 binary compatibility (specifically pydantic-core compilation). Understanding API Gateway HTTP API v2.0 event structure with JWT authorizer took additional debugging, as the event format differs from documentation examples.   Additionally, coordinating interface contracts between backend APIs and frontend components required iterative testing and adjustments.  
> Infrastructure Dependencies: Some backend features could not be tested until corresponding Terraform infrastructure was deployed, creating sequential dependencies that affected development velocity. For example, profile creation endpoint testing required API Gateway routes, VPC endpoints, and DynamoDB tables to be fully configured.  
> Team Coordination: While collaboration has been effective through daily standups and Slack, ensuring all team members have the latest infrastructure configurations and API specifications required careful communication and documentation.  
> Despite these challenges, we have maintained steady progress and remain on track for MVP completion. The lessons learned from integration debugging have improved our development workflow and testing strategies.  

**Plan for final submission**
> Nov 21-23 (MVP): Complete core chat functionality by implementing Astrology API Client, Bedrock Client, and Chat Handler that orchestrates profile lookup, chart generation, and AI responses. Frontend integrates chat UI to display conversations and charts.
> Nov 24-30 (Enhancement): Implement cache hit flow for performance optimization, add conversation history endpoint, complete Worker Lambda for async processing, and conduct comprehensive integration testing.
> Dec 1-6 (Testing): Execute end-to-end testing, validate monitoring and tracing, and fix bugs.
> Dec 7-9 (Presentation Prep): Finalize documentation, complete architecture diagrams, create presentation slides, and prepare demo with backup video.
> Dec 9-11 (Submission): Deliver presentation and submit final code with documentation.
