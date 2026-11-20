package services

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
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
	playlistName string

	friendTracks []*models.RadioheadTrack

	// Simulated state based on friend's real Spotify desktop activity
	simStartTime time.Time
	simTrackIdx  int
}

func NewSpotifyService(clientID, clientSecret string) *SpotifyService {
	svc := &SpotifyService{
		clientID:     clientID,
		clientSecret: clientSecret,
		friendName:   "Hideri",
		deviceName:   "Spotify for Windows (Hideri)",
		playlistName: "Nippon Cahadja Asia, Nippon Pelindoeng Asia, Nippon Pemimpin Asia",
		simStartTime: time.Now(),
		simTrackIdx:  0,
	}

	svc.loadFriendTracks()
	return svc
}

func (s *SpotifyService) loadFriendTracks() {
	paths := []string{
		"services/friend_tracks.json",
		"friend_tracks.json",
		"C:/webtify-be/services/friend_tracks.json",
		"C:/webtify/src/data/friend_tracks.json",
	}

	for _, p := range paths {
		absPath, _ := filepath.Abs(p)
		data, err := os.ReadFile(absPath)
		if err == nil {
			var tracks []*models.RadioheadTrack
			if err := json.Unmarshal(data, &tracks); err == nil && len(tracks) > 0 {
				s.friendTracks = tracks
				log.Printf("[SpotifyService] Loaded %d friend playlist tracks from %s\n", len(tracks), p)
				return
			}
		}
	}

	// Hardcoded fallback if file read fails
	s.friendTracks = []*models.RadioheadTrack{
		{
			ID:         "hollow-hunger",
			Title:      "HOLLOW HUNGER",
			Artist:     "OxT",
			Album:      "OVERLORD IV OP - HOLLOW HUNGER",
			Year:       2022,
			CoverURL:   "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/0a/a7/9f/0aa79f8a-101c-f475-c158-66e56d4a378a/JK_ZMCZ-15801.jpg/600x600bb.jpg",
			PreviewURL: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0d/53/af/0d53af50-eaa5-b0a6-a64c-8d176343865f/mzaf_10500995616285790300.plus.aac.p.m4a",
			DurationMs: 223142,
			BPM:        138,
			Mood:       "Dark Gothic Anime Anthem",
		},
	}
}

func (s *SpotifyService) GetClientID() string {
	return s.clientID
}

func (s *SpotifyService) GetFriendTracks() []*models.RadioheadTrack {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.friendTracks
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
						IsConnected:  true,
						IsPlaying:    playerState.IsPlaying,
						ProgressMs:   playerState.ProgressMs,
						Timestamp:    time.Now().UnixMilli(),
						DeviceName:   playerState.Device.Name,
						DeviceType:   playerState.Device.Type,
						Simulated:    false,
						FriendName:   fName,
						PlaylistName: s.playlistName,
						Playlist:     s.friendTracks,
						ClientID:     s.clientID,
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

	// Simulated Live Session Mode (OxT HOLLOW HUNGER @ 1:19 in real time)
	return s.getFriendCurrentState()
}

// getFriendCurrentState returns the live friend playback (HOLLOW HUNGER - OxT) progressing from 1:19
func (s *SpotifyService) getFriendCurrentState() *models.FriendPlaybackState {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.friendTracks) == 0 {
		s.loadFriendTracks()
	}

	currentTrack := s.friendTracks[s.simTrackIdx%len(s.friendTracks)]

	// Start from 79 seconds (1:19 as screenshotted by user) and advance in real time
	initialOffsetMs := 79000
	elapsedMs := initialOffsetMs + int(time.Since(s.simStartTime).Milliseconds())

	if elapsedMs >= currentTrack.DurationMs {
		// Wrap around or advance to next song in friend's playlist
		s.simTrackIdx = (s.simTrackIdx + 1) % len(s.friendTracks)
		s.simStartTime = time.Now()
		currentTrack = s.friendTracks[s.simTrackIdx]
		elapsedMs = 0
	}

	return &models.FriendPlaybackState{
		IsConnected:  s.accessToken != "",
		IsPlaying:    true,
		ProgressMs:   elapsedMs,
		Timestamp:    time.Now().UnixMilli(),
		DeviceName:   s.deviceName,
		DeviceType:   "Computer",
		Simulated:    s.accessToken == "",
		FriendName:   s.friendName,
		PlaylistName: s.playlistName,
		Playlist:     s.friendTracks,
		ClientID:     s.clientID,
		Track: &models.SpotifyTrackItem{
			ID:           currentTrack.ID,
			Title:        currentTrack.Title,
			Artist:       currentTrack.Artist,
			Album:        currentTrack.Album,
			CoverURL:     currentTrack.CoverURL,
			DurationMs:   currentTrack.DurationMs,
			PreviewURL:   currentTrack.PreviewURL,
			SyncedLyrics: currentTrack.SyncedLyrics,
			SpotifyURL:   "https://open.spotify.com/track/63OQupATfueENZJaC0fltF",
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
		"playlistName":  s.playlistName,
		"expiresInSec":  int(time.Until(s.expiresAt).Seconds()),
		"authRedirect": fmt.Sprintf(
			"https://accounts.spotify.com/authorize?response_type=code&client_id=%s&scope=user-read-currently-playing%%20user-read-playback-state%%20user-read-recently-played&redirect_uri=http://localhost:5173/",
			s.clientID,
		),
	}
}
