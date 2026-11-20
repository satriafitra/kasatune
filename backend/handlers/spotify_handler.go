package handlers

import (
	"encoding/json"
	"net/http"
	"webtify-be/models"
	"webtify-be/services"
)

type SpotifyHandler struct {
	spotifyService *services.SpotifyService
}

func NewSpotifyHandler(spotifyService *services.SpotifyService) *SpotifyHandler {
	return &SpotifyHandler{spotifyService: spotifyService}
}

// GetFriendNowPlaying returns real-time playback & playtime from friend's Spotify account
func (h *SpotifyHandler) GetFriendNowPlaying(w http.ResponseWriter, r *http.Request) {
	state := h.spotifyService.GetNowPlaying()
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Real-time friend playback state retrieved",
		Data:    state,
	})
}

// ExchangeAuthCode handles exchanging code for tokens with Client Secret
func (h *SpotifyHandler) ExchangeAuthCode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteJSON(w, http.StatusMethodNotAllowed, models.ApiResponse{
			Success: false,
			Message: "Method not allowed. Use POST.",
		})
		return
	}

	var req models.SpotifyExchangeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSON(w, http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Message: "Invalid JSON request: " + err.Error(),
		})
		return
	}

	if req.Code == "" {
		WriteJSON(w, http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Message: "Authorization code is required",
		})
		return
	}

	redirectURI := req.RedirectURI
	if redirectURI == "" {
		redirectURI = "http://localhost:5173/"
	}

	tokenResp, err := h.spotifyService.ExchangeCode(req.Code, redirectURI)
	if err != nil {
		WriteJSON(w, http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Message: "Token exchange failed: " + err.Error(),
		})
		return
	}

	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Spotify authorization successful! Connected to friend session.",
		Data:    tokenResp,
	})
}

// GetSpotifyStatus returns connection status and client configuration
func (h *SpotifyHandler) GetSpotifyStatus(w http.ResponseWriter, r *http.Request) {
	status := h.spotifyService.GetStatus()
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Spotify status retrieved",
		Data:    status,
	})
}

// GetFriendTracks returns the friend's Spotify playlist tracks
func (h *SpotifyHandler) GetFriendTracks(w http.ResponseWriter, r *http.Request) {
	tracks := h.spotifyService.GetFriendTracks()
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Friend Spotify playlist retrieved",
		Count:   len(tracks),
		Data:    tracks,
	})
}

// ToggleFriendPlayback toggles Play/Pause for friend session
func (h *SpotifyHandler) ToggleFriendPlayback(w http.ResponseWriter, r *http.Request) {
	state := h.spotifyService.TogglePlay()
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Toggled friend playback state",
		Data:    state,
	})
}

// PauseFriendPlayback pauses friend session
func (h *SpotifyHandler) PauseFriendPlayback(w http.ResponseWriter, r *http.Request) {
	state := h.spotifyService.SetPlaying(false)
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Paused friend playback",
		Data:    state,
	})
}

// PlayFriendPlayback resumes friend session
func (h *SpotifyHandler) PlayFriendPlayback(w http.ResponseWriter, r *http.Request) {
	state := h.spotifyService.SetPlaying(true)
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Resumed friend playback",
		Data:    state,
	})
}

// SeekFriendPlayback updates friend playtime
func (h *SpotifyHandler) SeekFriendPlayback(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProgressMs int `json:"progressMs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSON(w, http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Message: "Invalid request payload: " + err.Error(),
		})
		return
	}

	state := h.spotifyService.Seek(req.ProgressMs)
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Updated friend playback progress",
		Data:    state,
	})
}

// SetFriendTrack changes the friend's playing track
func (h *SpotifyHandler) SetFriendTrack(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TrackID string `json:"trackId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSON(w, http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Message: "Invalid request payload: " + err.Error(),
		})
		return
	}

	state := h.spotifyService.SetTrack(req.TrackID)
	WriteJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Changed friend active track",
		Data:    state,
	})
}

// StreamFriendEvents handles Server-Sent Events (SSE) for instant zero-latency sync
func (h *SpotifyHandler) StreamFriendEvents(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	ch := h.spotifyService.Subscribe()
	defer h.spotifyService.Unsubscribe(ch)

	// Send initial state immediately
	initialState := h.spotifyService.GetNowPlaying()
	data, _ := json.Marshal(initialState)
	w.Write([]byte("data: " + string(data) + "\n\n"))
	flusher.Flush()

	notify := r.Context().Done()
	for {
		select {
		case <-notify:
			return
		case state := <-ch:
			data, err := json.Marshal(state)
			if err == nil {
				w.Write([]byte("data: " + string(data) + "\n\n"))
				flusher.Flush()
			}
		}
	}
}
