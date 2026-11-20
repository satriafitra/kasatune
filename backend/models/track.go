package models

// RadioheadTrack represents the core model for a Radiohead track
type RadioheadTrack struct {
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	Artist         string   `json:"artist"`
	Album          string   `json:"album"`
	Year           int      `json:"year"`
	CoverURL       string   `json:"coverUrl"`
	PreviewURL     string   `json:"previewUrl"`
	DurationMs     int      `json:"durationMs"`
	BPM            int      `json:"bpm"`
	Mood           string   `json:"mood"`
	SyncedLyrics   string   `json:"syncedLyrics,omitempty"`
	PlainLyrics    string   `json:"plainLyrics,omitempty"`
	DominantColors []string `json:"dominantColors,omitempty"`
}

// ApiResponse represents standard JSON API envelope
type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Count   int         `json:"count,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}
