package models

// SpotifyTrackItem represents a track returned from Spotify API
type SpotifyTrackItem struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Artist     string `json:"artist"`
	Album      string `json:"album"`
	CoverURL   string `json:"coverUrl"`
	DurationMs int    `json:"durationMs"`
	SpotifyURL string `json:"spotifyUrl"`
	PreviewURL string `json:"previewUrl,omitempty"`
}

// FriendPlaybackState represents the real-time playback state of the friend's Spotify account
type FriendPlaybackState struct {
	IsConnected   bool              `json:"isConnected"`
	IsPlaying     bool              `json:"isPlaying"`
	ProgressMs    int               `json:"progressMs"`
	Timestamp     int64             `json:"timestamp"`
	DeviceName    string            `json:"deviceName"`
	DeviceType    string            `json:"deviceType"`
	Track         *SpotifyTrackItem `json:"track,omitempty"`
	Simulated     bool              `json:"simulated"`
	FriendName    string            `json:"friendName"`
	ClientID      string            `json:"clientId"`
}

// SpotifyTokenResponse represents the response from https://accounts.spotify.com/api/token
type SpotifyTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	Scope        string `json:"scope"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
}

// SpotifyExchangeRequest represents the body when exchanging code for tokens
type SpotifyExchangeRequest struct {
	Code        string `json:"code"`
	RedirectURI string `json:"redirectUri"`
}
