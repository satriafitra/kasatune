package services

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
	"webtify-be/models"
)

type SpotifyService struct {
	mu           sync.RWMutex
	clientID     string
	clientSecret string
	accessToken  string
	refreshToken string
	expiresAt    time.Time
	friendName   string
	deviceName   string

	// Simulated fallback state
	simStartTime time.Time
	simTrackIdx  int
}

func NewSpotifyService(clientID, clientSecret string) *SpotifyService {
	return &SpotifyService{
		clientID:     clientID,
		clientSecret: clientSecret,
		friendName:   "Spotify Friend",
		deviceName:   "Desktop Web Player",
		simStartTime: time.Now(),
		simTrackIdx:  0,
	}
}

func (s *SpotifyService) GetClientID() string {
	return s.clientID
}

// ExchangeCode exchanges Spotify authorization code for access & refresh tokens
func (s *SpotifyService) ExchangeCode(code, redirectURI string) (*models.SpotifyTokenResponse, error) {
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(s.clientID + ":" + s.clientSecret))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("spotify token request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify token exchange failed (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp models.SpotifyTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}

	s.mu.Lock()
	s.accessToken = tokenResp.AccessToken
	if tokenResp.RefreshToken != "" {
		s.refreshToken = tokenResp.RefreshToken
	}
	s.expiresAt = time.Now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)
	s.mu.Unlock()

	// Asynchronously fetch profile to get friend display name
	go s.fetchFriendProfile()

	log.Printf("[SpotifyService] Token exchanged successfully. Expires in %d seconds.\n", tokenResp.ExpiresIn)
	return &tokenResp, nil
}

// RefreshToken requests a new access token using the refresh token
func (s *SpotifyService) RefreshToken() error {
	s.mu.RLock()
	refToken := s.refreshToken
	s.mu.RUnlock()

	if refToken == "" {
		return fmt.Errorf("no refresh token available")
	}

	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refToken)

	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(data.Encode()))
	if err != nil {
		return err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(s.clientID + ":" + s.clientSecret))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("refresh token failed (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp models.SpotifyTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return err
	}

	s.mu.Lock()
	s.accessToken = tokenResp.AccessToken
	if tokenResp.RefreshToken != "" {
		s.refreshToken = tokenResp.RefreshToken
	}
	s.expiresAt = time.Now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)
	s.mu.Unlock()

	log.Println("[SpotifyService] Access token refreshed successfully.")
	return nil
}

func (s *SpotifyService) fetchFriendProfile() {
	s.mu.RLock()
	token := s.accessToken
	s.mu.RUnlock()

	if token == "" {
		return
	}

	req, err := http.NewRequest("GET", "https://api.spotify.com/v1/me", nil)
	if err != nil {
		return
	}
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return
	}
	defer resp.Body.Close()

	var profile struct {
		DisplayName string `json:"display_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&profile); err == nil && profile.DisplayName != "" {
		s.mu.Lock()
		s.friendName = profile.DisplayName
		s.mu.Unlock()
	}
}

// GetNowPlaying returns real-time friend playback state
func (s *SpotifyService) GetNowPlaying() *models.FriendPlaybackState {
	s.mu.RLock()
	token := s.accessToken
	expAt := s.expiresAt
	fName := s.friendName
	s.mu.RUnlock()

	// If we have an active access token, query the real Spotify Web API
	if token != "" {
		if time.Now().After(expAt) {
			_ = s.RefreshToken()
			s.mu.RLock()
			token = s.accessToken
			s.mu.RUnlock()
		}

		req, err := http.NewRequest("GET", "https://api.spotify.com/v1/me/player", nil)
		if err == nil {
			req.Header.Set("Authorization", "Bearer "+token)
			client := &http.Client{Timeout: 4 * time.Second}
			resp, err := client.Do(req)

			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				var playerState struct {
					IsPlaying  bool `json:"is_playing"`
					ProgressMs int  `json:"progress_ms"`
					Timestamp  int64 `json:"timestamp"`
					Device     struct {
						Name string `json:"name"`
						Type string `json:"type"`
					} `json:"device"`
					Item struct {
						ID         string `json:"id"`
						Name       string `json:"name"`
						DurationMs int    `json:"duration_ms"`
						Artists    []struct {
							Name string `json:"name"`
						} `json:"artists"`
						Album struct {
							Name   string `json:"name"`
							Images []struct {
								URL string `json:"url"`
							} `json:"images"`
						} `json:"album"`
						ExternalURLs struct {
							Spotify string `json:"spotify"`
						} `json:"external_urls"`
						PreviewURL string `json:"preview_url"`
					} `json:"item"`
				}

				if err := json.NewDecoder(resp.Body).Decode(&playerState); err == nil && playerState.Item.ID != "" {
					var artists []string
					for _, a := range playerState.Item.Artists {
						artists = append(artists, a.Name)
					}
					artistName := strings.Join(artists, ", ")
					coverURL := ""
					if len(playerState.Item.Album.Images) > 0 {
						coverURL = playerState.Item.Album.Images[0].URL
					}

					return &models.FriendPlaybackState{
						IsConnected: true,
						IsPlaying:   playerState.IsPlaying,
						ProgressMs:  playerState.ProgressMs,
						Timestamp:   time.Now().UnixMilli(),
						DeviceName:  playerState.Device.Name,
						DeviceType:  playerState.Device.Type,
						Simulated:   false,
						FriendName:  fName,
						ClientID:    s.clientID,
						Track: &models.SpotifyTrackItem{
							ID:         playerState.Item.ID,
							Title:      playerState.Item.Name,
							Artist:     artistName,
							Album:      playerState.Item.Album.Name,
							CoverURL:   coverURL,
							DurationMs: playerState.Item.DurationMs,
							SpotifyURL: playerState.Item.ExternalURLs.Spotify,
							PreviewURL: playerState.Item.PreviewURL,
						},
					}
				}
			}
		}
	}

	// Simulated Live Session Mode (Realistic Radiohead Playtime Stream)
	return s.getSimulatedState()
}

// getSimulatedState generates realistic live ticking playtime stream for testing
func (s *SpotifyService) getSimulatedState() *models.FriendPlaybackState {
	s.mu.Lock()
	defer s.mu.Unlock()

	type SimTrack struct {
		ID       string
		Title    string
		Artist   string
		Album    string
		Duration int
		CoverURL string
		Spotify  string
	}

	tracks := []SimTrack{
		{
			ID:       "karma-police",
			Title:    "Karma Police",
			Artist:   "Radiohead",
			Album:    "OK Computer",
			Duration: 261000,
			CoverURL: "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png",
			Spotify:  "https://open.spotify.com/track/63OQupATfueENZJaC0fltF",
		},
		{
			ID:       "creep",
			Title:    "Creep",
			Artist:   "Radiohead",
			Album:    "Pablo Honey",
			Duration: 238000,
			CoverURL: "https://upload.wikimedia.org/wikipedia/en/0/0f/Radiohead.pablohoney.albumart.jpg",
			Spotify:  "https://open.spotify.com/track/70LcF31zb4H9PyJoS1Sx1r",
		},
		{
			ID:       "high-and-dry",
			Title:    "High and Dry",
			Artist:   "Radiohead",
			Album:    "The Bends",
			Duration: 257000,
			CoverURL: "https://upload.wikimedia.org/wikipedia/en/5/55/Radioheadthebends.png",
			Spotify:  "https://open.spotify.com/track/2a1pnJR79RKNen9vrAeKVv",
		},
		{
			ID:       "no-surprises",
			Title:    "No Surprises",
			Artist:   "Radiohead",
			Album:    "OK Computer",
			Duration: 228000,
			CoverURL: "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png",
			Spotify:  "https://open.spotify.com/track/1bSp1dG2qWqf3Z2v4V04H3",
		},
	}

	currentTrack := tracks[s.simTrackIdx%len(tracks)]
	elapsedMs := int(time.Since(s.simStartTime).Milliseconds())

	if elapsedMs >= currentTrack.Duration {
		// Advance to next song in live stream
		s.simTrackIdx++
		s.simStartTime = time.Now()
		currentTrack = tracks[s.simTrackIdx%len(tracks)]
		elapsedMs = 0
	}

	return &models.FriendPlaybackState{
		IsConnected: s.accessToken != "",
		IsPlaying:   true,
		ProgressMs:  elapsedMs,
		Timestamp:   time.Now().UnixMilli(),
		DeviceName:  "Spotify for Windows (Friend)",
		DeviceType:  "Computer",
		Simulated:   s.accessToken == "",
		FriendName:  s.friendName,
		ClientID:    s.clientID,
		Track: &models.SpotifyTrackItem{
			ID:         currentTrack.ID,
			Title:      currentTrack.Title,
			Artist:     currentTrack.Artist,
			Album:      currentTrack.Album,
			CoverURL:   currentTrack.CoverURL,
			DurationMs: currentTrack.Duration,
			SpotifyURL: currentTrack.Spotify,
		},
	}
}

// GetStatus returns status of Spotify integration
func (s *SpotifyService) GetStatus() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return map[string]interface{}{
		"clientId":      s.clientID,
		"isConnected":   s.accessToken != "",
		"friendName":    s.friendName,
		"expiresInSec":  int(time.Until(s.expiresAt).Seconds()),
		"authRedirect": fmt.Sprintf(
			"https://accounts.spotify.com/authorize?response_type=code&client_id=%s&scope=user-read-currently-playing%%20user-read-playback-state%%20user-read-recently-played&redirect_uri=http://localhost:5173/",
			s.clientID,
		),
	}
}
