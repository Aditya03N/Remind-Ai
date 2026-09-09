# 🛡️ SIH Judges Defense Guide & Technical Mastery Cheatsheet
> **Everything you MUST know about your project before presenting to judges or deploying.**  
> *Written in simple, clear language so you can answer any technical, algorithmic, or architectural question with 100% confidence.*

---

## 📌 Table of Contents
1. [The 30-Second Elevator Pitch](#1-the-30-second-elevator-pitch)
2. [The Core Mathematical Algorithm (Judges Love This)](#2-the-core-mathematical-algorithm)
3. [The AI Engineering & Prompt Pipeline](#3-the-ai-engineering--prompt-pipeline)
4. [Full-Stack Architecture & Data Flow](#4-full-stack-architecture--data-flow)
5. [Database Schema (MongoDB Atlas)](#5-database-schema-mongodb-atlas)
6. [Top 10 Trick Questions Judges Ask & Exact Answers](#6-top-10-trick-questions-judges-ask--exact-answers)
7. [Pre-Presentation & Deployment Checklist](#7-pre-presentation--deployment-checklist)

---

## 1. The 30-Second Elevator Pitch

> *"Recall.ai is an intelligent spaced-repetition platform that prevents students from forgetting what they study. According to the Ebbinghaus Forgetting Curve, students forget 70% of new material within 48 hours. Our system solves this by allowing students to upload any textbook PDF or notes, uses Google Gemini to generate 10 active-recall questions in 2 seconds, continuously calculates mathematical memory decay, and alerts students to revise right before they forget."*

---

## 2. The Core Mathematical Algorithm

Judges will test if you actually understand the algorithm behind the project.

### 📐 The Modified Ebbinghaus Decay Equation
$$R(t) = S \cdot e^{-\left(\frac{t}{\tau \cdot (1 + 0.35 \cdot n)}\right)}$$

Here is what each variable means in plain English:
- **$R(t)$ (Estimated Retention %)**: Current memory percentage ($0–100\%$).
- **$S$ (Last Score)**: The score percentage the student got on their last 10-question quiz.
- **$t$ (Elapsed Time)**: Number of days since the last quiz attempt.
- **$\tau$ (Half-Life Stability Constant)**: Topic difficulty:
  - **Easy**: $\tau = 5.0\text{ days}$ (decays slowly)
  - **Medium**: $\tau = 3.0\text{ days}$ (moderate decay)
  - **Hard**: $\tau = 1.5\text{ days}$ (decays rapidly)
- **$n$ (Revision Count)**: Number of times revised. Every revision increases memory stability by **$35\%$** ($1 + 0.35 \cdot n$).

### 🚦 The 4-Tier Cognitive Triage Matrix
| Status | Retention Range | Action Required |
| :--- | :--- | :--- |
| 🔴 **CRITICAL** | $0\% – 39\%$ | Retrieval failure! High-priority revision due **Today**. |
| 🟠 **HIGH RISK** | $40\% – 59\%$ | Fading fast! Revise within **24–48 hours**. |
| 🟡 **MODERATE RISK** | $60\% – 74\%$ | Due within **2–3 days**. |
| 🟢 **STRONG** | $75\% – 100\%$ | Safe zone. Due in **4–7 days**. |
| 🏆 **MASTERED** | Scored $\ge 80\%$ Twice | Permanent memory trace. Locked from daily decay. |

---

## 3. The AI Engineering & Prompt Pipeline

### A. Which AI Model and Why?
- **Model**: Google Gemini (`gemini-3.6-flash` via `@google/generative-ai`).
- **Why Flash over Pro?**:
  1. **Speed**: Generates 10 MCQs + explanations in **$<1.2$ seconds**.
  2. **Cost**: Extremely low token cost (ideal for scaling to millions of students).
  3. **High Context Window**: Can parse multi-page chapter notes easily.

### B. How Document Parsing Works:
1. Student uploads a PDF ($\le 5\text{MB}$) or notes.
2. In the backend (`learningController.js`), `multer` stores the file **in memory** (RAM buffer), **not on disk**.
3. `pdf-parse` extracts raw text from the binary buffer.
4. The text is passed into Google Gemini with a structured system prompt.
5. Gemini returns a strict **JSON array of 10 questions** with:
   - Question text
   - 4 options (A, B, C, D)
   - Correct answer index
   - Detailed conceptual explanation

---

## 4. Full-Stack Architecture & Data Flow

```
[ Frontend: Next.js 16 ] 
       │  (Calls fetchWithAuth from src/utils/api.js)
       ▼  (Attaches Authorization: Bearer <JWT_Token>)
[ Backend: Node.js & Express 5 (Port 5000) ]
       │
       ├── authMiddleware.js (Validates JWT Token)
       ├── learningController.js (PDF Parsing + Gemini AI Generation)
       └── progressController.js (Ebbinghaus Decay Formula + Health Score)
       │
       ▼
[ MongoDB Atlas (Cloud NoSQL Database) ]
```

### Key Technical Details:
- **Authentication**: Stateless JWT (JSON Web Token) + `bcryptjs` (passwords hashed with 10 salt rounds).
- **CORS Enabled**: Express allows cross-origin requests from the Next.js client.
- **Error Handling**: 401 token invalidation automatically cleans expired tokens on the frontend.

---

## 5. Database Schema (MongoDB Atlas)

| Model Name | What it Stores | Key Fields |
| :--- | :--- | :--- |
| **`User`** | Student profile & credentials | `name`, `email`, `password` (hashed), `role` |
| **`Subject`** | Academic subject | `name`, `description`, `userId` |
| **`Concept`** | Individual topic/chapter | `name`, `difficulty`, `studyMaterial`, `subjectId` |
| **`Quiz`** | Active-recall assessments | `conceptId`, `questions` (text, options, answer, explanation) |
| **`StudentProgress`** | Memory decay & status tracking | `estimatedRetention`, `knowledgeStatus`, `revisionCount`, `lastRevisedAt`, `consecutiveMasteryCount`, `manualReminderDate` |
| **`Attempt`** | Quiz attempt scores | `userId`, `quizId`, `score`, `percentage`, `answers` |

---

## 6. Top 10 Trick Questions Judges Ask & Exact Answers

### Q1: "Why not just use Anki or Quizlet?"
> **Answer**: *"Anki requires students to spend 5–10 hours manually typing out flashcard decks, and Quizlet only uses static question sets. Recall.ai automates card creation in 2 seconds directly from textbook PDFs using Gemini AI, and uses a continuous mathematical Ebbinghaus formula with difficulty constants rather than rigid self-rating buttons."*

### Q2: "What happens if a student uploads a 50-page PDF?"
> **Answer**: *"We enforce a 5MB payload limit and use in-memory stream buffers (`multer.memoryStorage`) with `pdf-parse`. This extracts key text without consuming server disk space, feeding core conceptual tokens directly into Gemini's large context window."*

### Q3: "How do you verify genuine mastery vs lucky guessing?"
> **Answer**: *"We implement a **Dual Consecutive Mastery Gate**. A concept is only marked as 'Mastered' if a student scores $\ge 80\%$ on two separate quiz attempts separated by spaced decay intervals. Single high scores do not bypass the decay curve."*

### Q4: "Where is user data and uploaded PDFs stored?"
> **Answer**: *"PDFs are processed **in-memory** in RAM and discarded immediately after text extraction for maximum privacy and zero storage waste. User accounts, quiz attempts, and retention metrics are securely stored in MongoDB Atlas with hashed passwords (`bcryptjs`)."*

### Q5: "What if Gemini AI hallucinates wrong questions?"
> **Answer**: *"Our system prompt strictly instructs the AI to ground all 10 questions exclusively in the provided text. Additionally, every question includes a full explanation so students can cross-verify reasoning immediately upon quiz completion."*

### Q6: "How does the system know when to send reminders?"
> **Answer**: *"The system operates a dual engine: (1) An automated decay triage that ranks topics based on critical retention ($<40\%$), and (2) A custom student date-time alarm scheduler that alerts the student directly on their dashboard when their revision window arrives."*

### Q7: "What is your tech stack and why?"
> **Answer**: *"Next.js 16 (React 19) for ultra-fast server/client rendering and responsive UI, Express 5 on Node.js for high-throughput REST APIs, MongoDB Atlas for scalable document storage, and Google Gemini Flash for sub-second generative intelligence."*

### Q8: "Is this scalable to 100,000 students?"
> **Answer**: *"Yes. The API server is completely stateless (JWT authentication), decay calculations take $<1.5\text{ms}$ in JavaScript, and Gemini Flash provides high rate limits with minimal API latency."*

### Q9: "What is the business model?"
> **Answer**: *"A B2C Freemium model (free spaced repetition for up to 3 subjects, premium subscription for unlimited AI generations and PDF uploads), and a B2B Institutional model licensing retention analytics heatmaps to coaching institutes and colleges."*

### Q10: "What will you build next after this hackathon?"
> **Answer**: *"A React Native mobile app with offline spaced repetition, AI-synthesized 3-minute revision podcasts for commute study, and batch-level retention dashboards for teachers."*

---

## 7. Pre-Presentation & Deployment Checklist

- [ ] **Live Backend URL**: Ensure backend is deployed on Render/Railway and connected to MongoDB Atlas.
- [ ] **Environment Variables (`.env`)**:
  - `MONGO_URI` (MongoDB connection string)
  - `JWT_SECRET` (JWT signing key)
  - `GEMINI_API_KEY` (Google Gemini API key)
  - `PORT=5000`
- [ ] **Demo Data Ready**: Have 1 sample subject (e.g. *"Physics / Organic Chemistry"*), 2 concepts with pre-generated quizzes, and 1 short PDF ready to upload live.
- [ ] **Practice the Flow**: Login $\rightarrow$ View Dashboard Health % $\rightarrow$ Upload 1 PDF $\rightarrow$ Generate 10-Q Quiz $\rightarrow$ Show 2-Min Synaptic Prime Summary $\rightarrow$ Answer Quiz $\rightarrow$ Show updated Retention Decay score.
