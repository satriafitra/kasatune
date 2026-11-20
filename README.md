# Kasatune 🎵

An authentic Spotify Desktop-inspired web application for **Radiohead** discography, featuring 100% human-synchronized dynamic lyrics (LRCLIB), millisecond-precise audio tracking, and dynamic album color extraction.

---

## ✨ Features

- **Authentic Spotify Desktop Interface**: Seamless 3-panel integrated desktop window (Your Library, Main Album/Song Stage with Discography Table, Synced Lyrics Drawer) without card borders.
- **100% Synchronized Dynamic Lyrics**: Apple Music / Spotify-style kinetic typography with smooth auto-scroll, glowing active line, depth-of-field past lines, and instant scroll-to-top on track skip.
- **Click-to-Seek Navigation**: Click any lyric line to jump directly to that exact moment in the song.
- **Full Studio Recordings**: Full studio-length Radiohead audio tracks (3–6 minutes) with real-time scrubber and duration tracking.
- **Dynamic Palette Extraction**: ColorThief extracts dominant and accent colors directly from album artwork to render subtle, fluid ambient background gradients.
- **Full Transport Controls**: Shuffle, Repeat, Previous, Play/Pause, Next, Volume slider, and keyboard shortcuts (`Space` for Play/Pause, `ArrowLeft` for Previous, `ArrowRight` for Next).
- **Lightweight Go Backend**: REST API with in-memory caching and real LRCLIB community timestamps.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Color Extraction**: ColorThief
- **Audio & Time Engine**: Web Audio API (`AudioContext`, `AnalyserNode`) + HTML5 Audio

### Backend
- **Language**: Go 1.26
- **Architecture**: In-memory caching, RESTful API, CORS-enabled

---

## 🛠️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/satriafitra/kasatune.git
cd kasatune
```

### 2. Run the Frontend
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

### 3. Run the Go Backend (Optional)
```bash
cd backend
go run main.go
```
The backend API runs at `http://localhost:8080`.
