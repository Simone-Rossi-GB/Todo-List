# Jotly

A cross-platform desktop Kanban app for managing tasks and notes. Built with **Tauri** (Rust backend + JavaScript frontend), backed by **Supabase** for cloud sync and authentication.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=flat-square&logo=tauri&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

---

## Features

- **Kanban board** with 4 columns: Backlog → In Progress → Review → Done
- **User authentication** via Supabase (JWT-based, persists across restarts)
- **Offline-first**: notes load from `localStorage` instantly; Supabase syncs on login
- **Search** notes by title or content
- **Dark/light mode** switchable at runtime
- **Multilingual** (Italian / English)
- **Signed binary releases** for Windows (`.exe` and `.msi`)

---

## Architecture

```
Frontend (JavaScript + HTML/CSS + Tailwind + DaisyUI)
        ↕ invoke()
Backend (Rust / Tauri)
        ↕ HTTPS REST
Supabase Cloud (PostgreSQL + Auth API + Row Level Security)
```

The Rust backend handles all Supabase communication — JWT tokens are stored on disk in Rust, never exposed to the JavaScript layer.

**Row Level Security** is enforced at the database level: every query is filtered by the authenticated user's UUID, making it impossible to read or modify another user's notes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri 2.0 |
| Frontend | HTML, Tailwind CSS 4, DaisyUI 4, JavaScript (ES6+) |
| Backend | Rust (`reqwest`, `serde`, `tokio`) |
| Database | Supabase (PostgreSQL), Row Level Security |
| Auth | Supabase Auth (JWT) |
| i18n | Custom locale system (`it.json` / `en.json`) |

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)
- C++ build tools ([Windows](https://developer.microsoft.com/cpp) / `build-essential` on Linux)

### Run from source

```bash
cd TodoList
npm install
npm run tauri dev
```

### Pre-built releases

Download from the [`releases/`](releases/) folder:
- `Jotly_0.1.0_x64-setup.exe` — NSIS installer
- `Jotly_0.1.0_x64_en-US.msi` — MSI package

---

## Project context

School project at IIS B. Castelli, Brescia (January 2025).  
The assignment was to build a full-stack desktop application with authentication, cloud sync, and a production-grade architecture — choosing Tauri over Electron for its smaller binary size (~3 MB vs ~80 MB) and Rust memory safety.

**Team:** Simone Rossi, Marco Stellino, Massimo Tammaro Russo
