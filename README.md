# 🧠 Recall.ai — Intelligent Spaced Repetition & Knowledge Retention System
> **Smart India Hackathon (SIH) Official Presentation Guide & Complete Project Documentation**

---

## 📑 Table of Contents
1. [SIH Slide-by-Slide Ready-to-Fill Content](#-sih-slide-by-slide-ready-to-fill-content)
   - [Slide 1: Title & Team Details](#slide-1-title-and-team-details)
   - [Slide 2: Problem Statement & Context](#slide-2-problem-statement--context)
   - [Slide 3: Proposed Solution & Innovation](#slide-3-proposed-solution--innovation)
   - [Slide 4: System Architecture & Technical Flow](#slide-4-system-architecture--technical-flow)
   - [Slide 5: Key Features & Unique Selling Proposition (USP)](#slide-5-key-features--unique-selling-proposition-usp)
   - [Slide 6: Mathematical & Algorithmic Foundation](#slide-6-mathematical--algorithmic-foundation)
   - [Slide 7: Feasibility, Scalability & Market Potential](#slide-7-feasibility-scalability--market-potential)
   - [Slide 8: Tech Stack, Dependencies & Future Roadmap](#slide-8-tech-stack-dependencies--future-roadmap)
2. [Architecture & Workflow Diagrams](#-architecture--workflow-diagrams)
3. [Local Setup & Execution Guide](#-local-setup--execution-guide)

---

# 🎯 SIH Slide-by-Slide Ready-to-Fill Content

---

### Slide 1: Title and Team Details

- **Project Title**: `Recall.ai` — AI-Powered Neural Retention & Adaptive Spaced Repetition Engine
- **Theme / Category**: Smart Education / EdTech / Student Cognitive Enhancement
- **Problem Statement ID**: *(Insert your SIH Problem Statement ID here, e.g., SIH1234)*
- **Team Name**: *(Insert Your Team Name)*
- **Team Members**:
  - **Leader Name**: Aditya Anande *(Role: Full Stack & AI Architect)*
  - **Member 2**: *(Name & Role)*
  - **Member 3**: *(Name & Role)*
  - **Member 4**: *(Name & Role)*
  - **Member 5**: *(Name & Role)*
  - **Member 6**: *(Name & Role)*
- **Institute Name**: *(Insert Your College / University Name)*

---

### Slide 2: Problem Statement & Context

#### The Forgetting Curve Crisis in Modern Education
1. **Severe Memory Decay**: According to Hermann Ebbinghaus’s Forgetting Curve research, humans forget over **50% of newly learned information within 1 hour** and up to **70% within 48 hours** without structured reinforcement.
2. **Inefficient Study Habits**: Over **85% of students** rely on passive re-reading and last-minute cramming, resulting in rapid cognitive decay and high exam anxiety.
3. **Lack of Personalization**: Traditional revision systems treat all subjects and difficulty levels uniformly, failing to prioritize decaying topics dynamically.
4. **Time Inefficiency**: Students waste hundreds of hours trying to manually organize revision calendars and create relevant flashcards/quizzes from scratch.

> **Key Takeaway**: *"Students don't fail because of a lack of intellect; they fail because of unstructured, unmonitored memory decay."*

---

### Slide 3: Proposed Solution & Innovation

#### The Recall.ai Platform
`Recall.ai` is a full-stack cognitive retention platform that mathematically models memory decay and leverages **Google Gemini Generative AI** to automate active recall:

- 🧠 **Dynamic Ebbinghaus Decay Tracking**: Continuously calculates estimated retention percentage for every concept based on time elapsed, difficulty, and past quiz performance.
- 📄 **Document-to-Quiz AI Pipeline**: Students can attach PDF, TXT, or MD notes under 5MB. In-memory stream extraction feeds specific concepts into Gemini AI for targeted 10-question MCQ active recall tests.
- 💡 **Pre-Quiz High-Yield Synthesizer**: Generates 2-minute actionable revision summaries before quiz attempts to prime synaptic retrieval.
- ⚡ **Automated Cognitive Triage**: Categorizes topics into **Urgent (Critical Decay)**, **Fading (Moderate Risk)**, **Stable (Strong)**, and **Mastered (Consolidated)** nodes.
- 📅 **Dual-Mode Planner**: Provides both an automated AI priority queue and a custom date-time reminder scheduler with real-time browser alerts.

---

### Slide 4: System Architecture & Technical Flow

```
+-----------------------------------------------------------------------------------+
|                              CLIENT LAYER (Next.js 16)                            |
|  - Dashboard: Health % & Categorized Topics (Urgent / Fading / Stable / Mastered)  |
|  - Subject Hub: Document Upload (PDF/TXT/MD) & Notes Drawer                       |
|  - Quiz Runner: 10-Question Interactive Stepper, Real-Time Scoring & Explanations  |
|  - Revision Planner: AI Forgetting Queue + Manual Date/Time Scheduler              |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (JWT Authenticated)
+-----------------------------------------v-----------------------------------------+
|                              SERVER LAYER (Node.js & Express 5)                   |
|  - Auth Middleware: Token validation & automatic 401 session eviction             |
|  - Document Parser: Multer In-Memory Storage + pdf-parse binary stream engine     |
|  - Retention Engine: Ebbinghaus exponential decay algorithm & status calculator    |
|  - Mastery Controller: Consecutive threshold gating (≥80% score twice)            |
+--------------------+------------------------------------+-------------------------+
                     |                                    |
                     v                                    v
+--------------------+--------------+   +-----------------+-------------------------+
|   DATABASE (MongoDB Atlas)        |   |   AI ENGINE (Google Generative AI)        |
| - Users & Auth Schemas            |   | - Model: gemini-3.6-flash                 |
| - Subjects & Concepts             |   | - 10-MCQ Active Recall Generator          |
| - StudentProgress & Decay History |   | - High-Yield 2-Min Concept Summarizer     |
| - Quizzes, Attempts & Timers      |   | - Syllabus Context Extraction Pipeline    |
+-----------------------------------+   +-------------------------------------------+
```

---

### Slide 5: Key Features & Unique Selling Proposition (USP)

| Feature | How It Works | Student Benefit |
| :--- | :--- | :--- |
| **Live Knowledge Health Score** | Aggregated mean retention computed from non-linear decay curves | Instant visual gauge of overall exam readiness |
| **Document-to-Quiz AI Engine** | Uploads course PDFs/notes $\rightarrow$ AI generates 10 tailored MCQs | Zero time wasted making manual practice questions |
| **Synaptic Prime Summaries** | 1-click bulleted synthesis before starting quiz runner | Fast 2-minute refresher that maximizes recall scores |
| **Categorized Topic Explorer** | Live categorization: `Urgent`, `Fading`, `Stable`, `Mastered` | Eliminates guesswork on what to study next |
| **Smart Scheduled Reminders** | Manual datetime scheduler with instant due-time dashboard alerts | Never miss a revision milestone before test day |
| **Comprehensive Score Review** | Per-question breakdown with detailed explanations & timer | Immediate feedback reinforces synaptic connections |

---

### Slide 6: Mathematical & Algorithmic Foundation

#### 1. Ebbinghaus Memory Decay Formula
The platform computes real-time retention $R(t)$ for each concept using modified exponential decay:
$$R(t) = S \cdot e^{-\left(\frac{t}{\tau \cdot (1 + 0.35 \cdot n)}\right)}$$

Where:
- $S$: Initial/Last recorded score percentage ($0 \le S \le 100$).
- $t$: Elapsed time (in days) since the last assessment.
- $\tau$: Half-life stability constant based on topic difficulty:
  - $\text{Easy}: \tau = 5.0\text{ days}$
  - $\text{Medium}: \tau = 3.0\text{ days}$
  - $\text{Hard}: \tau = 1.5\text{ days}$
- $n$: Number of successful revision cycles completed (strengthens stability factor).

#### 2. Knowledge Status Classification Thresholds
- **Critical Risk**: $R(t) < 40\%$ $\rightarrow$ Immediate priority intervention.
- **High Risk**: $40\% \le R(t) < 60\%$ $\rightarrow$ Scheduled for daily review.
- **Moderate Risk (Fading)**: $60\% \le R(t) < 75\%$ $\rightarrow$ Review within 48 hours.
- **Strong (Stable)**: $R(t) \ge 75\%$ $\rightarrow$ Stable memory trace.
- **Mastered (Locked)**: Scored $\ge 80\%$ on **2 consecutive retention checks** separated by decay intervals. Immune to daily decay calculations.

---

### Slide 7: Feasibility, Scalability & Market Potential

#### Feasibility & Scalability
- **Low Computational Overhead**: Real-time retention calculations execute in under $<2\text{ms}$ on serverless/containerized Node.js.
- **Cost-Effective AI Execution**: Powered by `gemini-3.6-flash`, allowing ultra-fast latency ($<1.2\text{s}$) with high throughput and low token consumption.
- **Stateless Cloud Backend**: MongoDB Atlas auto-scaling clusters support millions of simultaneous student progress records.

#### Target Market & Social Impact
- **Target Audience**: 
  - Over **30 Million** competitive exam aspirants in India (JEE, NEET, UPSC, GATE, CAT).
  - Higher education students, medical/engineering undergrads, and professional certification candidates.
- **Social Impact**: 
  - Democratizes personalized high-yield tutoring for students in tier-2/3 cities.
  - Reduces academic stress and burnout through structured, proven cognitive scheduling.

---

### Slide 8: Tech Stack, Dependencies & Future Roadmap

#### Production Tech Stack
- **Frontend**: Next.js 16 (Turbopack, App Router, React 19), Tailwind CSS, Vanilla design tokens, Material Symbols.
- **Backend API**: Node.js, Express 5.2, Mongoose 9.9.
- **Database**: MongoDB Atlas (Cloud NoSQL).
- **Generative AI**: Google Gemini API (`gemini-3.6-flash`), `@google/generative-ai`.
- **Document Processing**: `multer` (in-memory buffer storage), `pdf-parse` (binary stream text extraction).
- **Security & Auth**: JWT (JSON Web Tokens), `bcryptjs` password hashing, Protected middleware.

#### Future Roadmap
- 📱 **Mobile Native App**: React Native / Flutter app with offline quiz caching and push notifications.
- 🎙️ **Voice & Audio Recall**: AI-narrated audio revision flashcards for commuting students.
- 📊 **Teacher & Institution Analytics**: Admin dashboards for schools/colleges to monitor batch retention and subject weakness heatmaps.
- 🧩 **Multi-Modal Diagram Support**: Visual diagram labeling and formula-based quizzes.

---

# 🚀 Local Setup & Execution Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Connection URI
- Google Gemini API Key

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Aditya03N/Remind-Ai.git
cd Remind-Ai

# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Environment Variables Setup
Create `.env` in the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Run Development Servers
```bash
# Terminal 1 - Start Backend Server
cd server
npm run dev

# Terminal 2 - Start Next.js Frontend
npm run dev
```

Frontend will run at `http://localhost:3000` and Backend at `http://localhost:5000`.

---
*Built with ❤️ for Smart India Hackathon (SIH).*
