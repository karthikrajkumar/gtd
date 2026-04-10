# Dream Extraction: Questioning Philosophy

> Reference document for the forward pipeline questioning agent.
> Goal: Surface the user's VISION, not just a feature list.

---

## Core Principle

The user has a dream, not a spec. Your job is to help them articulate what they see in their head. Requirements emerge from understanding the dream -- never start with requirements.

---

## Product Type Detection

Before asking detailed questions, classify the project type to calibrate your approach.

| Signal | Product Type | Question Style |
|--------|-------------|----------------|
| "I want to build an app that..." | Consumer product | Focus on UX, users, emotions |
| "We need a system that..." | Internal tool | Focus on workflow, integrations, data |
| "I want a site for..." | Content/marketing | Focus on audience, tone, conversion |
| "I need an API that..." | Developer tool | Focus on contracts, DX, performance |
| "I want to automate..." | Automation/script | Focus on triggers, reliability, edge cases |

---

## Question Categories

### 1. Scope & Vision

Purpose: Understand the boundaries and ambition level.

- "What does the finished thing look like when someone first uses it?"
- "What is the ONE thing it absolutely must do well?"
- "What would make you proud to show this to someone?"
- "Is this a weekend project or something you want to grow?"

### 2. Users & Audience

Purpose: Ground the vision in real people.

- "Who is the first person that will use this (besides you)?"
- "What are they doing RIGHT BEFORE they open your app?"
- "What problem goes away when they use it?"
- "How technical are your users?"

### 3. Technical Preferences

Purpose: Detect existing opinions and constraints.

- "Do you have a language or framework preference?"
- "Is there existing code or infrastructure this needs to fit into?"
- "Any services you already pay for (hosting, databases, auth)?"
- "Do you have strong opinions about any technology choices?"

### 4. UX & Design

Purpose: Understand aesthetic and interaction expectations.

- "Can you name an app or site that FEELS like what you want?"
- "Is this mobile-first, desktop-first, or both?"
- "Minimal and clean, or feature-rich and powerful?"
- "Any colors, fonts, or visual styles you are drawn to?"

### 5. Constraints & Boundaries

Purpose: Identify hard limits early.

- "What is your budget for hosting and services?"
- "When do you need this working?"
- "Are there compliance or privacy requirements?"
- "What should this explicitly NOT do?"

---

## The "Anything Else?" Pattern

After covering the categories above, always ask one open-ended closing question:

> "Is there anything else about this project that feels important but I have not asked about?"

This catches:
- Unstated assumptions the user holds
- Emotional priorities (speed, elegance, simplicity)
- Prior bad experiences they want to avoid
- Constraints they forgot to mention

---

## Auto-Mode Extraction

When the user provides a long initial description, extract answers to the categories above without re-asking. Only ask about gaps.

**Process:**
1. Parse the user input against all 5 categories
2. Mark each category as: `covered`, `partial`, `missing`
3. For `covered` categories: confirm your understanding in a single sentence
4. For `partial` categories: ask ONE targeted follow-up
5. For `missing` categories: ask the most important question from that category

**Example mapping:**

```
User says: "I want a task manager with tags, built in React, deployed on Vercel"

Category status:
- Scope & Vision: partial (what, but not why or success criteria)
- Users: missing
- Technical: covered (React + Vercel)
- UX: missing
- Constraints: partial (platform chosen, but no timeline/budget)
```

---

## Adaptive Depth

| User Response Style | Adjust To |
|--------------------|-----------|
| Short, terse answers | Ask fewer, more specific questions |
| Long, detailed answers | Summarize and confirm, skip redundant questions |
| Uncertain / "I don't know" | Offer 2-3 concrete options to choose from |
| Opinionated / decisive | Record the decision, move quickly to next topic |
| Contradictory answers | Gently surface the contradiction, ask which they prefer |

---

## Output Format

After extraction, produce a structured brief:

```markdown
## Dream Brief
- **Vision:** [one sentence]
- **Users:** [who]
- **Core Feature:** [the ONE thing]
- **Tech Preferences:** [stated preferences]
- **Constraints:** [hard limits]
- **Style:** [aesthetic/UX direction]
- **Open Items:** [unanswered questions]
```
