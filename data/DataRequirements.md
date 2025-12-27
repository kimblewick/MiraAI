# Project Data Plan

If your project uses any data, whether it's user data, external API data, uploaded files, or internal logs, you must provide the following.



### Dataset Description (if applicable)
A brief description of the dataset/s you chose (e.g., number of variables, year, etc). Include an exact link to the dataset. 

* DO NOT  include the dataset in your repo! Please put it in your .gitignore, that way you can use the dataset in your local repos but it will not be reflected into your GitHub.
* Describe the format your data comes in
* Describe any relevant metadata
* List the variables (at a high level)

> Our project does **not** rely on a static offline dataset stored in the repo. Instead, we use:
>
> #### 1. External Horoscope API  
> - https://github.com/g-battaglia/Astrologer-API  
> - **Typical fields:**  
>   - `sign` — zodiac sign  
>   - `date` — date of horoscope  
>   - `horoscope` — text description  
>   - Optional: `mood`, `lucky_number`, `compatibility`  
>
> #### 2. Model / Analysis Outputs  
> - LLM-generated emotional guidance (AWS Bedrock)  
> - Image charts  
> - **Format:** JSON, SVG  
>
> We do *not* commit any datasets to the repository. Any local test data will be added to `.gitignore`.

--

### Storage and Database Decisions

**Where will you store data?**
Name the specific cloud resource/s you will use. Is it a database, an S3 bucket, etc. If you store multiple aspects of your application name each part. For example, an S3 bucket for a static website, and a PostgreSQL database

> S3 bucket for a static website and user artifactes  
> dynamoDB for chat history and user profile  

**Why did your team decide to use this specific resource/s?**
Justify your choice. There needs to be an architectural reason beyond "this is cool" or "this is the most popular".

> We are using S3 to host our static website and user artifacts as we learned how to do it in class and for ease of acces.  
> We are using DynamoDB to store the User Profile and Conversations as it is recommended by AWS to store chat history due to it's scaling features and low latency.

--

### ERD (Entity-Relationship Diagram)

You must create an ERD when using SQL or NoSQL storage. Your ERD must include all entities/tables/collections. Include the full ERD in the repo as a PDF. Please upload any diagrams to `/docs/` as PDF documents

Attributes

* Primary/foreign keys
* Relationship types

For NoSQL:

* Document structure
* Embedded vs referenced strategy
* Partition/sort keys (if DynamoDB)

Include a brief description of the ERD here, highlighting key intricacies/challenges from the ERD.
> We use a **NoSQL DynamoDB** design optimized for user-based access.
>
> #### Table: `mira-user-state-<env>`
> **PK:** `user_id`  
> **SK:** `sk`  
>
> **Item Types**
> - **User Profile Item**  
>   - `sk = "PROFILE"`  
>   - Fields: `zodiac_sign`, `birthdate`, `Country`, `city`, `name`
>
> - **Chat Summary Item**  
>   - `sk = "CHAT_SUMMARY#<TIMESTAMP>"`  
>   - Fields: `summary`, `topics`

--

### Data Access Patterns

Your design document must include a data plan answering the questions below.

**What data does your system need? Structured/unstructured**  
> **Structured:** user profiles  
> **Semi-structured / unstructured:** chat text, LLM responses, logs  

**Brief description of the purpose of each type of data**  
> - **User profiles:** personalize guidance  
> - **LLM output:** emotional support responses  
> - **Logs:** debugging + audit signals  

**Where does the data come from?**
If you have multiple data sources, elaborate on how each one is collected
Examples of data sources:

* Users
* External APIs
* Uploads
* Public datasets
* Logs or events

> - **Users:** chat messages, profile inputs  
> - **External APIs:** horoscope API, LLM API  
> - **System logs:** Lambda + API Gateway  

**Describe how your data enters your system?**
You may add diagrams here if it helps explain.
Examples:

* API ingestion
* Form submission
* File upload
* Scheduled jobs

> - User signs in via Cognito → frontend receives JWT  
> - Frontend sends messages to API Gateway  
> - API Gateway → Lambda (`chat-handler`)  
> - Lambda reads/writes DynamoDB, calls external APIs  
> - Optional async: EventBridge → SQS → worker Lambda  


**Are there specific challenges with the data you will store/generate?**
Consider any of the following that apply to your application:

* How will you ensure user privacy is respected and data is securely stored?
* If the data comes from an API, how will you ensure its validity?
* Are there any specific risks with the data your are storing (from a dataset or user)?

> - Must avoid storing raw sensitive messages → store summaries instead  
> - External APIs may fail → fallback responses required  
> - LLM output must be safety-checked  
> - Logs must not contain sensitive user content  
> - DynamoDB TTL needed for data retention  


**How will you access the data and respond with data back to your user?**

> Lambda handler flow:  
> 1. Verify JWT  
> 2. Load user profile  
> 3. Fetch horoscope (cache first)  
> 4. Call LLM + sentiment API  
> 5. Write updated summary  
> 6. Return combined JSON to frontend  


**Monitoring your app**
How will you ensure you are alerted to any bugs or issues in your application in the cloud? Are there any specific challenges in collecting, storing and analyzing logs?

> - **CloudWatch Metrics:** Lambda errors, API latency, DynamoDB throttles  
> - **CloudWatch Alarms → SNS notifications**  
> - **CloudWatch Logs Insights** for debugging  
> - Need correlation IDs because logs come from multiple services  
> - Must sanitize logs to avoid storing PII
