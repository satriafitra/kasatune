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

	mux := http.NewServeMux()

	// Register API endpoints
	mux.HandleFunc("/api/health", trackHandler.HealthCheck)
	mux.HandleFunc("/api/radiohead/tracks", trackHandler.GetTracks)
	mux.HandleFunc("/api/radiohead/tracks/", trackHandler.GetTrackByID)
	mux.HandleFunc("/api/radiohead/scrape", trackHandler.ScrapeTracks)

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

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
