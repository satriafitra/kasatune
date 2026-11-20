package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"webtify-be/models"
	"webtify-be/services"
)

type TrackHandler struct {
	store *services.Store
}

func NewTrackHandler(store *services.Store) *TrackHandler {
	return &TrackHandler{store: store}
}

// WriteJSON sends a standardized JSON response
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// HealthCheck handler
func (h *TrackHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Webtify Backend (Go) is healthy and operational",
		Data: map[string]interface{}{
			"artist":      "Radiohead",
			"trackCount":  len(h.store.GetAll()),
			"version":     "1.0.0",
			"environment": "client-connected",
		},
	})
}

// GetTracks returns all Radiohead songs
func (h *TrackHandler) GetTracks(w http.ResponseWriter, r *http.Request) {
	tracks := h.store.GetAll()
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Successfully retrieved Radiohead discography",
		Count:   len(tracks),
		Data:    tracks,
	})
}

// GetTrackByID returns a specific track by its ID
func (h *TrackHandler) GetTrackByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/radiohead/tracks/")
	id = strings.TrimSpace(id)

	if id == "" {
		WriteJSON(w, http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Message: "Track ID is required",
		})
		return
	}

	track, found := h.store.GetByID(id)
	if !found {
		WriteJSON(w, http.StatusNotFound, models.ApiResponse{
			Success: false,
			Message: "Radiohead track not found with id: " + id,
		})
		return
	}

	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Track found",
		Data:    track,
	})
}

// ScrapeTracks handles on-demand scrape from iTunes API
func (h *TrackHandler) ScrapeTracks(w http.ResponseWriter, r *http.Request) {
	scraped, err := services.ScrapeRadioheadFromITunes()
	if err != nil {
		WriteJSON(w, http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Message: "Scraper error: " + err.Error(),
		})
		return
	}

	if len(scraped) > 0 {
		// Merge or set to store
		h.store.SetTracks(scraped)
	}

	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Live Radiohead discography scraped and synced successfully",
		Count:   len(scraped),
		Data:    scraped,
	})
}
