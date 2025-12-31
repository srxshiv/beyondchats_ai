# BeyondChats Article Re-Writer

A full-stack application that scrapes blog articles, enriches them with new data from Google Search, rewrites them using Google Gemini AI, and displays a comparison view (Original vs. AI Enhanced) on a Next.js frontend.

## 🔗 Live Demo
**[Insert your Vercel Link Here]**

---

1. Clone the repo

Bash
git clone <your-repo-url>
cd beyondchats-scraper
2. Install dependencies

Bash
npm install
3. Configure Environment Variables

Create a .env.local file in the root directory. You need keys for MongoDB, Google Gemini, and SerpApi.

Code snippet
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/beyondchats
GEMINI_API_KEY=AIzaSy...
SERPAPI_KEY=...
4. Run the Pipeline

Step A: Scrape the original articles (Phase 1) This script launches Puppeteer, grabs the last 5 articles from the blog, and seeds the database.

Bash
npx tsx scripts/scrape.ts
Step B: AI Rewrite & Enrichment (Phase 2) This script reads from the DB, searches Google for context, rewrites the content, and updates the records.

Bash
npx tsx scripts/process-articles.ts
Step C: Start the Frontend (Phase 3) Launches the Next.js application.

Bash
npm run dev
Open http://localhost:3000 to view the application.

---

## 🏗 Architecture & Data Flow

```mermaid
graph TD
    subgraph "Phase 1: Ingestion"
        S[Scrape Script] -->|Puppeteer| W[BeyondChats Blog]
        S -->|Save Raw Data| DB[(MongoDB)]
    end

    subgraph "Phase 2: Processing"
        AI[AI Worker Script] -->|Fetch Pending| DB
        AI -->|Search Context| G[Google Search API]
        AI -->|Scrape References| EXT[External Blogs]
        AI -->|Rewrite Content| LLM[Gemini Flash API]
        LLM -->|Return New Text| AI
        AI -->|Update Article| DB
    end

    subgraph "Phase 3: Presentation"
        UI[Next.js Frontend] -->|GET /api/articles| DB
        User -->|View Toggle| UI
    end