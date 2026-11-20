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

	// Live playback state
	isPlaying      bool
	pausedOffsetMs int
	simStartTime   time.Time
	simTrackIdx    int

	// SSE subscribers for zero-latency live sync
	subMu       sync.Mutex
	subscribers map[chan *models.FriendPlaybackState]struct{}
}

func NewSpotifyService(clientID, clientSecret string) *SpotifyService {
	svc := &SpotifyService{
		clientID:       clientID,
		clientSecret:   clientSecret,
		friendName:     "deriana_ (JuraganBengkel)",
		deviceName:     "Spotify for Windows (deriana_)",
		playlistName:   "Nippon Cahadja Asia, Nippon Pelindoeng Asia, Nippon Pemimpin Asia",
		isPlaying:      true, // Active Spotify Playback: What is my LIFE? - いきづらい部!
		pausedOffsetMs: 43000, // 00:43 as screenshotted by friend in Discord
		simStartTime:   time.Now(),
		simTrackIdx:    0,
		subscribers:    make(map[chan *models.FriendPlaybackState]struct{}),
	}

	svc.loadFriendTracks()
	svc.loadSavedToken()
	return svc
}

func (s *SpotifyService) loadSavedToken() {
	paths := []string{
		"spotify_token.json",
		"C:/webtify-be/spotify_token.json",
		"C:/webtify/backend/spotify_token.json",
	}

	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err == nil {
			var t struct {
				AccessToken  string `json:"access_token"`
				RefreshToken string `json:"refresh_token"`
				ExpiresIn    int    `json:"expires_in"`
			}
			if err := json.Unmarshal(data, &t); err == nil && t.AccessToken != "" {
				s.accessToken = t.AccessToken
				s.refreshToken = t.RefreshToken
				s.expiresAt = time.Now().Add(time.Hour)
				log.Printf("[SpotifyService] Restored saved token from %s\n", p)
				return
			}
		}
	}
}

func (s *SpotifyService) saveToken(access, refresh string, expiresIn int) {
	t := map[string]interface{}{
		"access_token":  access,
		"refresh_token": refresh,
		"expires_in":    expiresIn,
	}
	bytes, _ := json.MarshalIndent(t, "", "  ")
	_ = os.WriteFile("C:/webtify-be/spotify_token.json", bytes, 0644)
	_ = os.WriteFile("C:/webtify/backend/spotify_token.json", bytes, 0644)
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

	// Fallback track list matching screenshot
	s.friendTracks = []*models.RadioheadTrack{
		{
			ID:         "hollow-hunger",
			Title:      "HOLLOW HUNGER",
			Artist:     "OxT",
			Album:      "OVERLORD IV OP - HOLLOW HUNGER",
			Year:       2022,
			CoverURL:   "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/0a/a7/9f/0aa79f8a-101c-f475-c158-66e56d4a378a/JK_ZMCZ-15801.jpg/600x600bb.jpg",
			PreviewURL: "http://localhost:8080/api/audio/stream?id=hollow-hunger",
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

// Subscribe returns a channel receiving state updates in real-time
func (s *SpotifyService) Subscribe() chan *models.FriendPlaybackState {
	s.subMu.Lock()
	defer s.subMu.Unlock()

	ch := make(chan *models.FriendPlaybackState, 5)
	s.subscribers[ch] = struct{}{}
	return ch
}

// Unsubscribe removes an SSE client channel
func (s *SpotifyService) Unsubscribe(ch chan *models.FriendPlaybackState) {
	s.subMu.Lock()
	defer s.subMu.Unlock()

	delete(s.subscribers, ch)
	close(ch)
}

func (s *SpotifyService) broadcastState(state *models.FriendPlaybackState) {
	s.subMu.Lock()
	defer s.subMu.Unlock()

	for ch := range s.subscribers {
		select {
		case ch <- state:
		default:
		}
	}
}

// TogglePlay toggles friend Play / Pause in real-time
func (s *SpotifyService) TogglePlay() *models.FriendPlaybackState {
	s.mu.Lock()
	now := time.Now()
	if s.isPlaying {
		// Was playing -> Pause!
		elapsed := s.pausedOffsetMs + int(now.Sub(s.simStartTime).Milliseconds())
		s.pausedOffsetMs = elapsed
		s.isPlaying = false
		log.Printf("[SpotifyService] Friend playback PAUSED at %dms\n", elapsed)
	} else {
		// Was paused -> Resume!
		s.simStartTime = now
		s.isPlaying = true
		log.Printf("[SpotifyService] Friend playback RESUMED from %dms\n", s.pausedOffsetMs)
	}
	s.mu.Unlock()

	state := s.GetNowPlaying()
	s.broadcastState(state)
	return state
}

// SetPlaying sets playing state explicitly
func (s *SpotifyService) SetPlaying(playing bool) *models.FriendPlaybackState {
	s.mu.Lock()
	now := time.Now()
	if s.isPlaying != playing {
		if !playing {
			// Pause
			elapsed := s.pausedOffsetMs + int(now.Sub(s.simStartTime).Milliseconds())
			s.pausedOffsetMs = elapsed
			s.isPlaying = false
			log.Printf("[SpotifyService] Friend playback PAUSED at %dms\n", elapsed)
		} else {
			// Play
			s.simStartTime = now
			s.isPlaying = true
			log.Printf("[SpotifyService] Friend playback RESUMED from %dms\n", s.pausedOffsetMs)
		}
	}
	s.mu.Unlock()

	state := s.GetNowPlaying()
	s.broadcastState(state)
	return state
}

// Seek sets the playback position in ms
func (s *SpotifyService) Seek(progressMs int) *models.FriendPlaybackState {
	s.mu.Lock()
	s.pausedOffsetMs = progressMs
	s.simStartTime = time.Now()
	log.Printf("[SpotifyService] Friend playback SEEK to %dms\n", progressMs)
	s.mu.Unlock()

	state := s.GetNowPlaying()
	s.broadcastState(state)
	return state
}

// SetTrack changes the friend's active track by ID
func (s *SpotifyService) SetTrack(trackID string) *models.FriendPlaybackState {
	s.mu.Lock()
	for i, t := range s.friendTracks {
		if t.ID == trackID || strings.EqualFold(t.Title, trackID) {
			s.simTrackIdx = i
			s.pausedOffsetMs = 0
			s.simStartTime = time.Now()
			s.isPlaying = true
			log.Printf("[SpotifyService] Friend changed track to: %s\n", t.Title)
			break
		}
	}
	s.mu.Unlock()

	state := s.GetNowPlaying()
	s.broadcastState(state)
	return state
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

	s.saveToken(tokenResp.AccessToken, tokenResp.RefreshToken, tokenResp.ExpiresIn)
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

func (s *SpotifyService) fetchLanyardState(userID string) *models.FriendPlaybackState {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get("https://api.lanyard.rest/v1/users/" + userID)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil
	}
	defer resp.Body.Close()

	var data struct {
		Success bool `json:"success"`
		Data    struct {
			ListeningToSpotify bool `json:"listening_to_spotify"`
			DiscordUser        struct {
				Username   string `json:"username"`
				GlobalName string `json:"global_name"`
			} `json:"discord_user"`
			Spotify struct {
				Song        string `json:"song"`
				Artist      string `json:"artist"`
				Album       string `json:"album"`
				AlbumArtURL string `json:"album_art_url"`
				TrackID     string `json:"track_id"`
				Timestamps  struct {
					Start int64 `json:"start"`
					End   int64 `json:"end"`
				} `json:"timestamps"`
			} `json:"spotify"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err == nil && data.Success && data.Data.ListeningToSpotify {
		sp := data.Data.Spotify
		durationMs := int(sp.Timestamps.End - sp.Timestamps.Start)
		now := time.Now().UnixMilli()
		progressMs := int(now - sp.Timestamps.Start)
		if progressMs < 0 {
			progressMs = 0
		}
		if durationMs > 0 && progressMs > durationMs {
			progressMs = durationMs
		}

		fName := data.Data.DiscordUser.GlobalName
		if fName == "" {
			fName = data.Data.DiscordUser.Username
		}

		previewURL := ""
		for _, t := range s.friendTracks {
			if strings.EqualFold(t.Title, sp.Song) && t.PreviewURL != "" {
				previewURL = t.PreviewURL
				break
			}
		}

		return &models.FriendPlaybackState{
			IsConnected:  true,
			IsPlaying:    true,
			ProgressMs:   progressMs,
			Timestamp:    now,
			DeviceName:   "Spotify on Desktop (Discord Live)",
			DeviceType:   "Computer",
			Simulated:    false,
			FriendName:   fName,
			PlaylistName: s.playlistName,
			Playlist:     s.friendTracks,
			ClientID:     s.clientID,
			Track: &models.SpotifyTrackItem{
				ID:         sp.TrackID,
				Title:      sp.Song,
				Artist:     sp.Artist,
				Album:      sp.Album,
				CoverURL:   sp.AlbumArtURL,
				DurationMs: durationMs,
				SpotifyURL: "https://open.spotify.com/track/" + sp.TrackID,
				PreviewURL: previewURL,
			},
		}
	}
	return nil
}

// GetNowPlaying returns real-time friend playback state
func (s *SpotifyService) GetNowPlaying() *models.FriendPlaybackState {
	// 1. Check Discord Lanyard real-time presence (deriana_ ID: 759609270974414848)
	if lanyardState := s.fetchLanyardState("759609270974414848"); lanyardState != nil {
		return lanyardState
	}

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

	// High-Precision Real-Time State Hub (OxT HOLLOW HUNGER @ 1:19)
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

	var elapsedMs int
	if s.isPlaying {
		elapsedMs = s.pausedOffsetMs + int(time.Since(s.simStartTime).Milliseconds())
		if currentTrack.DurationMs > 0 && elapsedMs >= currentTrack.DurationMs {
			elapsedMs = currentTrack.DurationMs
		}
	} else {
		elapsedMs = s.pausedOffsetMs
	}

	previewURL := currentTrack.PreviewURL
	if currentTrack.ID == "ikizulive-what-is-my-life" {
		previewURL = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/40/2b/3f/402b3faf-4c2d-74c3-3e43-3983b5f68d8b/mzaf_11448353083308887647.plus.aac.p.m4a"
	} else if currentTrack.ID == "liella-sing-shine-smile" {
		previewURL = "/liella_sing_shine_smile.m4a"
	} else if currentTrack.ID == "hollow-hunger" {
		previewURL = "/hollow_hunger_itunes.m4a"
	} else if currentTrack.ID == "roselia-proud-of-oneself" {
		previewURL = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/7d/60/d5/7d60d5d5-221c-8172-46c6-872b98bdbcfb/mzaf_12757904917594910654.plus.aac.p.m4a"
	}

	spotifyURL := currentTrack.SpotifyURL
	if spotifyURL == "" {
		spotifyURL = "https://open.spotify.com/track/5u0wN1Zk7z7yE7xW2tVv1K"
	}

	return &models.FriendPlaybackState{
		IsConnected:  s.accessToken != "",
		IsPlaying:    s.isPlaying,
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
			PreviewURL:   previewURL,
			SyncedLyrics: currentTrack.SyncedLyrics,
			SpotifyURL:   spotifyURL,
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
		"isPlaying":     s.isPlaying,
		"friendName":    s.friendName,
		"playlistName":  s.playlistName,
		"expiresInSec":  int(time.Until(s.expiresAt).Seconds()),
		"authRedirect": fmt.Sprintf(
			"https://accounts.spotify.com/authorize?response_type=code&client_id=%s&scope=user-read-currently-playing%%20user-read-playback-state%%20user-read-recently-played&redirect_uri=http://localhost:5173/",
			s.clientID,
		),
	}
}
