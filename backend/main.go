package main

import (
	"fmt"
	"log"
	"net/http"
	"webtify-be/handlers"
	"webtify-be/services"
)

// enableCORS middleware wraps handlers to permit frontend requests from Vite
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		// Handle preflight OPTIONS request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	store := services.NewStore()
	trackHandler := handlers.NewTrackHandler(store)

	spotifyClientID := "272c12f48c18494fb5ac490cd10a8b2b"
	spotifyClientSecret := "1d176acff29d420d9ee0c4a351e4a2cc"
	spotifyService := services.NewSpotifyService(spotifyClientID, spotifyClientSecret)
	spotifyHandler := handlers.NewSpotifyHandler(spotifyService)

	mux := http.NewServeMux()

	// Register API endpoints
	mux.HandleFunc("/api/health", trackHandler.HealthCheck)
	mux.HandleFunc("/api/radiohead/tracks", trackHandler.GetTracks)
	mux.HandleFunc("/api/radiohead/tracks/", trackHandler.GetTrackByID)
	mux.HandleFunc("/api/radiohead/scrape", trackHandler.ScrapeTracks)

	// Real-Time Friend Spotify Endpoints
	mux.HandleFunc("/api/spotify/friend/now-playing", spotifyHandler.GetFriendNowPlaying)
	mux.HandleFunc("/api/spotify/friend/tracks", spotifyHandler.GetFriendTracks)
	mux.HandleFunc("/api/spotify/auth/exchange", spotifyHandler.ExchangeAuthCode)
	mux.HandleFunc("/api/spotify/status", spotifyHandler.GetSpotifyStatus)

	// Root welcome endpoint
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		handlers.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"service": "Webtify Radiohead Backend",
			"status":  "running",
			"routes": []string{
				"GET /api/health",
				"GET /api/radiohead/tracks",
				"GET /api/radiohead/tracks/:id",
				"GET /api/radiohead/scrape",
				"GET /api/spotify/friend/now-playing",
				"POST /api/spotify/auth/exchange",
				"GET /api/spotify/status",
			},
		})
	})

	port := 8080
	addr := fmt.Sprintf(":%d", port)

	server := &http.Server{
		Addr:    addr,
		Handler: enableCORS(mux),
	}

	log.Printf("[Webtify-BE] Radiohead Go API Server listening on http://localhost:%d\n", port)
	log.Printf("[Webtify-BE] Preloaded %d Radiohead tracks ready for frontend sync\n", len(store.GetAll()))
	log.Printf("[Webtify-BE] Spotify Friend Sync Hub active with Client ID: %s\n", spotifyClientID)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
