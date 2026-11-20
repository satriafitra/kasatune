package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
	"webtify-be/models"
)

type ITunesResult struct {
	TrackID        int    `json:"trackId"`
	TrackName      string `json:"trackName"`
	ArtistName     string `json:"artistName"`
	CollectionName string `json:"collectionName"`
	ArtworkUrl100  string `json:"artworkUrl100"`
	PreviewUrl     string `json:"previewUrl"`
	TrackTimeMillis int   `json:"trackTimeMillis"`
	ReleaseDate    string `json:"releaseDate"`
}

type ITunesResponse struct {
	ResultCount int            `json:"resultCount"`
	Results     []ITunesResult `json:"results"`
}

// ScrapeRadioheadFromITunes fetches fresh discography data directly from Apple iTunes API
func ScrapeRadioheadFromITunes() ([]models.RadioheadTrack, error) {
	apiURL := "https://itunes.apple.com/search?term=radiohead&entity=song&limit=25"

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch from iTunes: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("iTunes API responded with status: %d", resp.StatusCode)
	}

	var itunesResp ITunesResponse
	if err := json.NewDecoder(resp.Body).Decode(&itunesResp); err != nil {
		return nil, fmt.Errorf("failed to decode iTunes response: %w", err)
	}

	var tracks []models.RadioheadTrack
	seenTitles := make(map[string]bool)

	for _, item := range itunesResp.Results {
		// Clean and filter to ensure only Radiohead tracks
		if !strings.EqualFold(item.ArtistName, "Radiohead") {
			continue
		}

		cleanTitle := strings.TrimSpace(item.TrackName)
		if seenTitles[strings.ToLower(cleanTitle)] {
			continue
		}
		seenTitles[strings.ToLower(cleanTitle)] = true

		// Extract Year
		year := 1997
		if len(item.ReleaseDate) >= 4 {
			fmt.Sscanf(item.ReleaseDate[:4], "%d", &year)
		}

		// High-res artwork
		highResArt := strings.Replace(item.ArtworkUrl100, "100x100bb.jpg", "600x600bb.jpg", 1)

		slug := strings.ToLower(cleanTitle)
		slug = strings.ReplaceAll(slug, " ", "-")
		slug = strings.ReplaceAll(slug, "/", "-")

		track := models.RadioheadTrack{
			ID:             fmt.Sprintf("rh-%d", item.TrackID),
			Title:          cleanTitle,
			Artist:         item.ArtistName,
			Album:          item.CollectionName,
			Year:           year,
			CoverURL:       highResArt,
			PreviewURL:     item.PreviewUrl,
			DurationMs:     item.TrackTimeMillis,
			BPM:            deriveBPM(cleanTitle),
			Mood:           deriveMood(item.CollectionName),
			DominantColors: []string{"#3F4147", "#5865F2", "#1E1F22"},
		}

		tracks = append(tracks, track)
	}

	return tracks, nil
}

func deriveBPM(title string) int {
	t := strings.ToLower(title)
	switch {
	case strings.Contains(t, "jigsaw"):
		return 148
	case strings.Contains(t, "creep"):
		return 92
	case strings.Contains(t, "high and dry"):
		return 88
	case strings.Contains(t, "karma police"):
		return 75
	case strings.Contains(t, "no surprises"):
		return 76
	case strings.Contains(t, "paranoid android"):
		return 82
	default:
		// Default atmospheric tempo
		hash := 0
		for _, c := range title {
			hash += int(c)
		}
		return 72 + (hash % 38)
	}
}

func deriveMood(album string) string {
	a := strings.ToLower(album)
	switch {
	case strings.Contains(a, "ok computer"):
		return "Ethereal Dystopia"
	case strings.Contains(a, "the bends"):
		return "Raw Alternative"
	case strings.Contains(a, "in rainbows"):
		return "Warm Art-Rock"
	case strings.Contains(a, "kid a"):
		return "Avant-Garde Electronic"
	case strings.Contains(a, "pablo honey"):
		return "90s Grunge"
	default:
		return "Atmospheric Melancholy"
	}
}

// FetchLyricsFromLRCLIB queries LRCLIB for synced lyrics
func FetchLyricsFromLRCLIB(title, artist string) (string, error) {
	endpoint := fmt.Sprintf("https://lrclib.net/api/get?artist_name=%s&track_name=%s",
		url.QueryEscape(artist), url.QueryEscape(title))

	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Lrclib-Client", "Webtify-Backend-Go/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("no lyrics found (status %d)", resp.StatusCode)
	}

	var data struct {
		SyncedLyrics string `json:"syncedLyrics"`
		PlainLyrics  string `json:"plainLyrics"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", err
	}

	if data.SyncedLyrics != "" {
		return data.SyncedLyrics, nil
	}
	return data.PlainLyrics, nil
}
