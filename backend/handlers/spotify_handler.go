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
