# Project Title: Mira
Short project summary (2–3 sentences).
> This repository contains the full implementation of our CS6620 Cloud Computing Final Project. The application provides an AI-powered astrology chat assistant that generates personalized birth charts and interpretations.

---

### Team Members
- Full Name: Erdun E
- Full Name: Raj Kavathekar
- Full Name: Davie Wu

**Team Roles**
Describe what role each team member will take in this project and the tasks assigned to each member. 
> Erdun E: Project Manager, Backend Expert, Software developer  
> Raj Kavathekar: Senior Prompt Enginer, Frontend Expert, Web developer  
> Davie Wu: Site Reliability Engineer, Infrastructure Expert, Junior Developer

---

### Repository Structure

Your repo must follow this layout:

```
/.github/    # CICD, Pull request template
/app/        # Application source code
/data/       # Data plan, data requirements or scripts
/infra/      # IaC (Terraform/SAM/etc)
/docs/       # Architecture, ERD, progress report, budget
/scripts/    # Optional bash scripts
/roles/      # json policies to follow for IAM roles
/.gitignore/ # Ignore the log, cache and other docs
README.md    # Project overview and documentation
```

---

### Project Overview

#### Brief Description / Context
A brief description/context of the problem you are approaching and problem understanding. 

* Why is this topic relevant?
  * AI emotional-support systems are increasingly important as users seek accessible, personalized guidance tools that are in compliance to mental health and user safety guardrails. The astrology aspect allows users to off-load some personal issues they face that are beyond their control, this allows them to reflect emotionally while having hard times be easy to swallow. The project explores how AI can deliver empathetic, context-aware responses while maintaining data security and reliability on the cloud.
* Who does this topic affect? Where does it happen? When did it happen?
  * This application primarily benefits individuals seeking lightweight emotional support or personal reflection in their daily lives. It is designed for users who follow horoscopes and want an interactive, AI-driven experience. 
  * Mira is relevant in everyday contexts where users want brief, private, and accessible emotional support and especially during stressful or uncertain moments. It is globally applicable and always available, leveraging cloud scalability to ensure 24/7 access across time zones and devices.
* What are your motivations for addressing this topic?
  * Our team is interested in building AI chatbots and exploring how to host both the frontend and backend fully on the cloud. We’re curious about how an AI chatbot can interpret horoscope and astrology data to offer emotional support and real-time guidance to users. This project lets us combine technical exploration with a topic that feels engaging and personally meaningful.


**Proposed Solution:**  
High-level description of the application, key features, and user flow.
> - AI Astrology chatbot, that provides users with relevant astrology informartion, features and readings.
> - AI Chat, Visualizations such as birth and various other charts, Horoscope Readings, customized profiles
> - User creates account -> New user creates profile and puts in information -> Redirected to chat (Existing Users directly go to chat) -> We pull user information such as chat history and artifacts to provide it to that specific user -> User chats with AI -> API Calls -> Data is stored on our backend such as chat logs and artifects

**Cloud Provider:**  
AWS / GCP / Azure (with justification).
> AWS, we are using it as we have credits for it through our student account and we have academic experience with it through our class.

**Programming Languages in this Project:**  
Python/Java, and other programming languages approved by Prof GS for other parts of your project
> Backend: Python  
> Scripts: Bash  
> Infra: Terraform  
> Frontend: Javascript, HTML, CSS

---

### Architecture

Your diagram must:

* Use official cloud icons
* Use solid arrows for synchronous calls, dashed for asynchronous
* Include high-level labels describing each component’s purpose
* Include clear boundaries (public vs private)

**Miro Diagram:**  
[Click here to view the architecture diagram](https://miro.com/app/board/uXjVJsOlhH8=/?share_link_id=35191105301)
Additionally include a PDF copy of your architecture under `\docs`.


Answer the following questions.

**List every service/tool you are using, with an explanation of why you chose that particular service for your application.**
This includes specific services in your cloud provided, as well as external tools we've used during the semester (e.g. Docker, Terraform)
> Cloud Services: S3, Cognito, Bedrock, DynamoDB, Lambda, VPC, API Gateway, Secrets Manager  

> We are using S3 to host our static website and user artifacts as we learned how to do it in class and for ease of acces, we are using Cognito for authentication and security due to it's seamless integration with AWS backend and JWT. We are using Bedrock due to it's plethora of LLMs so we can test out different models from different providers to see which fits best for our task instead of committing to one through purchasing API credits. We are using DynamoDB to store the User Profile and Conversations as it is recommended by AWS to store chat history due to it's scaling features and low latency. We are using Lambda as we want our project to run on serverless architecture through Lambda functions, for convenience and scaling based on usage, we are hosting the backend on our VPC through AWS which we will access through our API Gateway and store keys in the Secrets Manager.

> Developer Tools: Terraform, Base44, Cursor, VSCode  
> Project Management: Miro, Notion, Slack, Github

**How will users access your app? (VPC, Subnets, Security Groups)**
> User → Cloudfront → Authentication → Request send to API Gateway to call the lambdas.

**Where will your application run? (Serverless, containers, VMs)**
> Serverless through Lambda functions and regional services.

**How will resources and developers authenticate and authorize? (IAM roles, users or policies)**
> IAM roles → admin, user(readonly)

**How will your app handle failures? (AZs, backups, etc)**
Your app must be in at least 2 AZs to ensure reliability
> Hosting on 2+ AZs, redundant design


**How will you manage latency and costs through auto-scaling/load balancing?**
> We will manage latency by using CloudFront to route users efficiently, since we are serverless, we will handle costs through a pay-as-you-go-system to incur it on demand and by setting billing alarms to make sure 

---
### Infrastructure as Code
As a requirement for this project, you must develop IaC. Define how this will look for your particular project, and how you will do IaC and with which tools (e.g. Terraform).

>For our project's IaC, we are using serverless architecure, using Terraform we are defining Lambda functions and creating service modules that we plan on using for our backend. With the help of terraform we are planning and applying these changes and requesting services for our project through AWS.

---
### IAM Roles and Policies
Outline the IAM Roles you need to create for this project and explain why each role is necessary.
> Roles:  
> Davie: Administrator, is responsible for applying changes and allocating resources on AWS through Terraform.  
> Raj and Erdun: Power User, have same access as administrator and can view and allocate resources through the AWS console.

For this phase you must complete all IAM policies and store them in this repo under `\roles`.


---

### Project Budget

Use the [website](https://instances.vantage.sh/) already provided to you during the course to create a project budget. Under `\docs`, you should add a spreadsheet with all the different resources you plan to use during the project and the projected cost.

Use the structure below for your spreadsheet. Feel free to add additional columns.

| Service | Resource | Estimated usage time | Total Estimated cost |
|---|---|---|---|

Add up time and cost at the end of the columns.

---

### References

Any resources or citations should be listed here
[]  
Astrology API: https://github.com/g-battaglia/v4.astrologer-api

---

### Demo video
[5MinVideo](https://drive.google.com/file/d/1Sy8Eb1_7Cw-riR4t4dP1GMPRweUN8jyP/view?usp=sharing)

---

### Use of Generative AI (Full Disclosure)

Tool usage (summary):

- **ChatGPT**: Used to rephrase and polish wording in our README, progress documents, and this final report, and to refine pull request descriptions based on text we had already written.
- **Claude AI**: Used to talk through debugging strategies and understand error messages or edge cases; we then wrote and modified the actual code ourselves.
- **Base44**: Used at the very beginning of the project to scaffold an initial React frontend template provided as part of the course resources; we customized and extended this code manually and did not use Base44 for cloud infrastructure, Terraform, or report writing.
- **Cursor AI assistant**: Used inside the IDE for small refactors, formatting, and comment/variable name suggestions, and to surface potential bugs; we treated these as hints and only committed changes we understood.
- **Arcade**: Used solely to record and share our demo video; it did not generate any code or written project content.

We did **not** use any Generative AI tools to generate cloud-related code (including Terraform, AWS configuration, or CI/CD), to write tests or data models, or to design our architecture. All technical decisions, infrastructure definitions, and application logic were created by the team, with AI tools used only to improve clarity, organization, and presentation of material we authored ourselves. 
