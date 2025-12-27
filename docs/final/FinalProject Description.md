# Final Project Submission


This master document defines **every requirement** your team must meet for the final project. Treat it as a contract, read it carefully, and if it is written here, you are expected to do it.

Earlier phases (e.g. Project Proposal, Project Progress) helped you plan and begin implementing your project. This final phase requires you to finish the application, deploy it correctly, test it, document it thoroughly, and present it professionally. The goal is not simply “having something that sort of works,” but delivering a final product that looks, feels, and behaves like a serious, real-world cloud application.

The final project is designed to bring together everything you have learned this semester: cloud architecture, networking, virtualization and containers, compute, storage and databases, IAM, security, reliability, IaC, serverless, monitoring, CI/CD, testing, and cost-awareness. Your final deliverable must show that you can apply these concepts in an integrated way, not just in isolation.

The project is also about communication and reflection. You must demonstrate that you can explain what you built, why you built it that way, how it works behind the scenes, what went wrong, and what you would do differently next time. The clarity of your explanations matters. By the time you submit, your repository should look like something you would be proud to show a hiring manager, another faculty member, or a professional collaborator.

**Key submission components:**

* Working application
* Repo with sections outline below
* Final architectural, ERD and budget documents
* Modified README
* RunningProject.md
* Final Report
* Any missing files from the previous assignment
* Downloadable Demo Video link
* Final presentation slides

**Everything should be submitted through your team's repo in the `main` branch.** Only the `main` branch will count for grading purposes. Do no rebase or destroy any branches.

**Key Dates:**

**Tuesday, December 9th**

* Arrive by 6PM to class, as we will begin the presentations on time.
* Your app must be fully functional and ready for a demo by 6PM
	* Your slide deck should be in your repo by 1PM this day (Prof GS will pull all the repos at 1PM to check the presentation slides).

**Thursday, December 11th, before 11:59PM**

* Deadline for submitting everything else in this assignment, including the video, the full repo, the final document, etc. 	


## Integrating Course Concepts

Your final system must clearly demonstrate:

- Cloud architecture (how your components fit together)
- IAM roles for you to work as a team
- Security and privacy considerations  
- VPC networking (subnets, routing, security groups)  
- Compute (Lambda, containers, or VMs)  
- Storage / databases (SQL, NoSQL, S3, etc.)  
- IAM and security (roles, policies, least privilege)  
- Reliability and multi-AZ design  
- Monitoring and logging  
- Infrastructure as Code (Terraform, SAM, etc.)  
- CI/CD with automated testing  
- Cost-conscious design choices  

Everything in this document is required unless explicitly stated as optional.


## Team Collaboration Expectations

Every team member is expected to contribute and to understand the entire system, not just their part. During the final presentation, Q&A, or in follow-up questions, any team member may be asked to explain any portion of the project. If someone cannot explain a part of the project at all, that signals a lack of engagement.

All team members must appear in the group video, contribute to the demo and documentation, and be present and active during the final in-class presentation.

Additionally, there will be an individual component to the final project.

--

## Requirements

This section defines everything you must submit. If you are unsure whether something is required, assume that it is, unless this document explicitly says otherwise.

At a high level, your final submission must include:

1. A fully functioning cloud application.  
2. A complete documentation package (`/docs/final`).  
3. A working CI/CD pipeline with automated testing in your assigned GitHub repo.  
4. A video of your project.  
5. A final in-class presentation.  
6. A completed README (and additional markdown documents).  


By the final submission, your application must:

- Be deployed in a real cloud provider (AWS strongly preferred, others only with explicit justification).  
- Be reachable by a real user: for example, through a web UI, an API endpoint, or a documented client.  
- Use a properly configured VPC, subnets, security groups, and IAM roles.  
- Run in at least two Availability Zones for reliability.  
- Use appropriate storage (database, S3, etc.), with clearly documented data flows.  
- Handle basic errors gracefully.  

The application must not be a mockup or work in progress. It should represent the best working version your team can deliver within the course timeline.


### Infrastructure as Code (IaC)

Your infrastructure must be created and updated using IaC. Manual point-and-click in the console is **not** sufficient for this project.

Requirements:

- All IaC must be stored under `/infra/`.  
- The IaC must create your networking layer, compute resources, storage, IAM roles/policies, and any other major resources you depend on.  
- You must be able to destroy and recreate your environment using the IaC tools.  
- IaC files must be formatted, readable, and commented where appropriate.  
- Your documentation must explain how to run the IaC and what it does.


## Documentation (`/docs/final`)

All final documentation must live under:

```text
/docs/final/
```

At minimum, `/docs/final` must contain:

- `final_report.pdf` (this can also be in markdown)  
	- Architecture diagrams (PDF and Miro link)  
	- Final ERD diagrams (if applicable) 
	- CI/CD and testing evidence (screenshots, descriptions)  
	- Cloud screenshots (VPC, subnets, SGs, compute, storage, IAM, logs, metrics)  
	- The feedback from the progress phase should be reflected in your final documents. Include a section highlighting what feedback you received and how you incorporated it into your project.
- Final presentation slides in pdf format, with the following name: `final_slides_teamname.pdf`.
- Link to your required video 
- Any extra supporting documents you reference in your report  


### Final Report Structure

Your final report must be written in complete, well-structured paragraphs. It must exist in both Markdown and PDF formats.

Required sections (in order):

1. **Executive Summary** – High-level explanation of the problem, the solution, who benefits, and why the project matters. No deep technical detail here; think of it as what you would tell a non-technical stakeholder.  

2. **Architecture Documentation** – A detailed narrative of your system’s architecture. This must:
   - Link to your Miro diagram.  
   - Link to your architecture PDF (exported from Miro or similar).  
   - Explain each major component, what it does, and why you chose it.  
   - Describe your VPC layout (public/private subnets, routing, NAT gateway or not, etc.).  
   - Explain how IAM is set up: which roles exist, what policies they use, and why.  
   - Explain how your system uses multiple AZs and how it responds to failures.  
   - Your architectural choices should be clearly explained and justified.

3. **Integration of Course Concepts** – At least one substantial paragraph (preferably more) per major topic from the class, clearly explaining how your project implements or engages each concept. Do not speak in generalities; tie it to your actual architecture and code.

4. **Cloud Evidence** – A curated set of screenshots showing that your infrastructure exists and matches your documentation. Every screenshot must have a short caption and clearly show what is being displayed. Screenshots must cover: VPC, subnets, route tables, security groups, compute resources, storage services, logs, metrics, and IAM roles/policies.

5. **Data models** – If your project uses structured or semi-structured data, include:
   - A description of what data you handle and why.  
   - Where the data comes from (users, APIs, datasets, etc.).  
   - How the data is stored and accessed.  
   - An up-to-date ERD in PDF format that matches your actual implementation.  

6. **Integrating Feedback** – Include a section highlighting what feedback you received and how you incorporated it into your project. Be specific about when the feedback was given (e.g. proposal, progress, etc).

7. **Challenges, Lessons Learned, and Future Work** – A reflective section that:
   - Describes specific problems your team ran into (technical, organizational, or design-related).  
   - Explains how you tried to solve them.  
   - States what you would change if you had more time.  
   - Identifies concrete future work and extensions that would improve the system.  

9. **Use of Generative AI (Full Disclosure)** – See section below for specifics.

Please add a table of contents. You may include additional sections as long as the above sections are included.

---

## Repository Structure

Your repository must follow this structure exactly (you may add more, but not omit or radically change this layout):

```text
/app/                     # Application source code
/data/                    # Data scripts, data schema, etc.
/infra/                   # All IaC
/docs/
   /project_progress/       # Project progress docs
   /final/                  # All final deliverables
   /final/presentation/     # Final slide deck
   /final/architecture/     # Architecture diagrams (PDF)
   /final/data models/      # ERD diagrams (PDF)
   /final/budget		        # Final budget
   /final/RunningProject.md # Markdown explaining the structure of your project and running it
   ...                      # Any additional final docs
/roles/                     # IAM role and policy JSON/YAML
/scripts/                   # Optional helper scripts
README.md                   # Final README 
```

If you need extra folders, you may add them, but they should not contradict this structure.

---

## Final Presentation (In-Class on December 9)

Your team must deliver a 15-minute presentation (plus a short 5-10 minute Q&A) in class on Tuesday, December 9.

The presentation must have the following components:

- **Introduction** - present the problem and your solution clearly. Explain the context of the problem you are solving and why it matters to you.
- **Scope** - explain the functionality as well as the limitations of your project.
- **Architecture** - Explain your architecture at a high level (do not just read the diagram, interpret it).  Make sure to justify why you chose those
particular cloud resources for your project. 
- **Demo** - Show a short live demo of your app  
- **Reflection** - Describe major challenges and what you learned.  
- **Future Work** - Briefly outline future work, i.e., if you had more time, what else you would do? Or what would you do differently? 

All team members must participate with equal speaking roles. 

---

## CI/CD Pipeline and testing

You must show that your application is not only built and deployed, but that it can be **reliably tested and re-deployed** through automated workflows. You must implement a CI/CD pipeline, using **GitHub Actions**. Manual-only runs are not enough. The idea is that any meaningful change to your codebase should go through the same automated checks and deployment steps.

### Required Pipeline Stages

At a minimum, your pipeline must include the following stages:

 
* **Dependency Installation** – Install required packages or libraries in a clean, reproducible way.  
* **Automated Tests** – Run your full test suite (see 3.2). The pipeline must fail if tests fail.  
* **IaC Validation** – Validate your Terraform or SAM (or equivalent) configuration (e.g., `terraform validate`, `terraform fmt`, `sam validate`).  
*  **Build / Package Stage** – Build or package your application (e.g., jar, zip, container image).  
*  **Deployment Stage** – Deploy infrastructure and/or application changes using IaC and any necessary deploy commands.

You may add more stages (linting, code quality checks, etc.), but not fewer.

### Evidence of CI/CD

In your documentation, you must provide:

- Screenshots of successful pipeline runs (with date/time visible).  
- Screenshots or descriptions of at least one failed run (and how you fixed it).  
- Links to specific workflow runs in GitHub (or your CI system).  
- A textual explanation in your Final Report describing each stage, what it does, and why it matters.

---

## Testing Requirements

Your project must include **unit tests**. 

Unit tests must:

- Live in a clearly identifiable tests directory.  
- Test the core logic of your application.  
- Be runnable both locally and in the CI pipeline.  

Unit tests should cover normal cases and at least some edge or error conditions.

If you have time, you can include end-to-end testing or integration testing. For example, sending a request to your deployed API and asserting that the response has expected properties is an integration test.

As evidence of testing, you must provide:

- Screenshots of test results in GitHub Actions (or equivalent).  
- A written explanation in your Final Report describing:
  - What you decided to test.  
  - Why you prioritized those tests.  
  - What bugs or issues you found and fixed as a result.  
  - Which parts of the app would still benefit from more testing if you had more time.

---

## GenAI Usage Rules


You may use Generative AI **only** to improve the writing quality of text that you have already written yourselves. This includes:

- Grammar and spelling improvements.  
- Rephrasing sentences for clarity.  
- Smoothing transitions between paragraphs.  
- Making wording more concise or readable.  

In all cases, the underlying ideas, structure, and technical content must originate from your team and not from AI.


You are **not allowed** to use GenAI to:

- Generate cloud-related code. 
- Generate tests or IaC.  
- Design your architecture or choose services.  
- Write any part of your Final Report content from scratch.  
- Write your README.  
- Design your diagrams.  


**Mandatory GenAI Disclosure in the Final Report. **

Your Final Report must contain a dedicated section titled:

```markdown
## Use of Generative AI (Full Disclosure)
```

This section must:

- List every GenAI tool you used (ChatGPT, Copilot, etc.).  
- For each tool, explain what you used it for (e.g., “to polish the wording of a paragraph in the Executive Summary”).  
- Include prompt logs or working links in the section or in an appendix.  
- Explicitly state that no GenAI-generated content was used as original technical work or code.

Lack of disclosure, or incomplete disclosure, will be treated seriously.

---

## Video Requirement

You must submit **one video** as part of your final submission: a full application demo video.

This is a 5-minute (max) video, recorded in vertical or horizontal format, intended for a professional audience (e.g., LinkedIn).

Requirements:
 
- All team members must appear in the video.  
- The content must follow this structure:
  1. Why this problem matters.  
  2. Clear problem statement.  
  3. Architectural diagram and voiceover explaining it at a high level.  
  4. Demo - this is a screen-recorded demo that shows your application from the user’s perspective, start to finish.
  5. Final impact statement and “what’s next.”  

Your goal is to communicate *why your project is interesting and meaningful*, not just list technologies. The video must be easy to follow. Move the cursor slowly, speak clearly, and avoid jumping around.

You may use Zoom or [Loom](https://www.loom.com/) to record this video. If you wish to use other professional tools, that is fine, but not required.

**Submitting your video**

Add a section to your README called `Demo Video` and include the link to your video. The video MUST be downloadable. Do not include the video file in the repo.


---


## Markdown Additions

Please use the following template for `docs/final/RunningProject.md`:

Add the sections below to your `README`:

* Video
* Use of Generative AI (Full Disclosure)


