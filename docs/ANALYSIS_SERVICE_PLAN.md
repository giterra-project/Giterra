# Giterra Analysis Service Plan

## 1. Product Goal
- Input: GitHub username
- Output: repository analysis for:
  - single repository
  - grouped repositories
- Core value: fast insight on coding tendencies, stability habits, and collaboration quality.

## 2. Primary User Flow
1. User enters GitHub ID.
2. System loads repository list.
3. User runs either:
   - Single analysis (one repo)
   - Group analysis (multiple selected repos)
4. System returns:
   - persona/theme summary
   - per-repo detailed insight (tech/stability/convention)

## 3. API Contract (Implemented)
- `GET /repos/{username}`
  - returns repositories list
- `POST /analyze/direct`
  - request:
    - `github_username: string`
    - `selected_repos: string[]`
    - `mode: "single" | "multi" (optional)`
  - response:
    - summary (persona/theme/score/overall analysis/source)
    - repositories (detailed insight per repo)
    - failed repository names

## 4. Analysis Engine Strategy
- First priority: LLM-based analysis (LangGraph).
- Fallback: heuristic analysis when LLM is unavailable.
- Result: service remains available even with API-key/network/LLM failures.

## 5. Frontend Experience (Implemented)
- `/analyze` page:
  - username input
  - repository list with multi-select
  - one-click single analysis per repo
  - grouped analysis for selected repos
  - result dashboard with overall + per-repo insight

## 6. Next Iteration Backlog
1. Add repo filters (language, star, updated date).
2. Add time-window options (last 30/90/180 days).
3. Add result export (Markdown/PDF).
4. Add caching to reduce repeated GitHub API calls.
5. Add automated tests for `/analyze/direct` success/fallback paths.
