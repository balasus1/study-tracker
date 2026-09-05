# Study Tracker

A full-stack web app built with Next.js 15, React 19, Tailwind CSS, and Supabase to track your DSA and System Design studies.

## Features
- **Authentication**: Secure email/password login using Supabase Auth.
- **Excel Import**: Upload a spreadsheet of problems to track.
- **Problem Detail**: Track status, due date, and write scratchpad solutions.
- **AI Integration**: Automatically generate Python, Java, JavaScript, and pseudo-code solutions + explanations for problems using OpenAI API.
- **Scratchpad**: Code directly in the browser and execute it using the Piston public API.
- **Study Timers**: Structured 3min think, 5min pseudo, 20/30min implement phases.
- **Dashboard**: Track your completions over time with Recharts.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials and OpenAI API key.

3. **Supabase Database Setup**
   Execute the migration SQL file located at:
   `supabase/migrations/20260905164000_initial_schema.sql`
   in your Supabase SQL Editor. This will set up all tables, types, indexes, and Row Level Security (RLS) policies.

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

## Excel Import Expected Format
The Excel file should have the following columns (case-insensitive):
- `Title`
- `Description` (or `Problem Statement`)
- `Difficulty` (easy/medium/hard)
- `Topic` (e.g. Arrays, System Design)
- `Tags` (comma-separated, e.g. "array, two-pointer")
- `Source URL` (optional)
- `Due Date` (optional)

## Technical Notes
- **AI API**: Make sure you have `OPENAI_API_KEY` set. The generation action takes a few seconds and uses `@ai-sdk/openai` to return structured JSON.
- **Code Execution**: The code execution feature relies on the public [Piston API](https://piston.vercel.app/). Do not send sensitive or excessively large scripts.
