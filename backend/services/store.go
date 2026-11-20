package services

import (
	"sync"
	"webtify-be/models"
)

// Store manages thread-safe access to Radiohead tracks
type Store struct {
	mu     sync.RWMutex
	tracks []models.RadioheadTrack
}

// NewStore initializes the store with curated full-length Radiohead discography
func NewStore() *Store {
	return &Store{
		tracks: []models.RadioheadTrack{
			{
				ID:         "rh-creep",
				Title:      "Creep",
				Artist:     "Radiohead",
				Album:      "Pablo Honey",
				Year:       1993,
				CoverURL:   "https://upload.wikimedia.org/wikipedia/en/0/0f/Radiohead.pablohoney.albumart.jpg",
				PreviewURL: "https://archive.org/download/pablo-honey-album/RADIOHEAD%20%28PABLO%20HONEY%29%20-%20Track%20%202%20-%20Creep.mp3",
				DurationMs: 238000,
				BPM:        92,
				Mood:       "Melancholic Rock",
				SyncedLyrics: `[00:19.16] When you were here before
[00:24.09] Couldn't look you in the eye
[00:29.24] You're just like an angel
[00:34.49] Your skin makes me cry
[00:39.77] You float like a feather
[00:44.77] In a beautiful world
[00:49.97] I wish I was special
[00:55.12] You're so fuckin' special
[01:00.45] But I'm a creep
[01:05.83] I'm a weirdo
[01:10.33] What the hell am I doing here?
[01:16.29] I don't belong here
[01:21.49] I don't care if it hurts
[01:26.69] I wanna have control
[01:31.82] I want a perfect body
[01:37.15] I want a perfect soul
[01:42.41] I want you to notice
[01:47.66] When I'm not around
[01:52.90] You're so fuckin' special
[01:58.03] I wish I was special
[02:03.30] But I'm a creep
[02:08.67] I'm a weirdo
[02:13.38] What the hell am I doing here?
[02:19.29] I don't belong here, oh, oh
[02:25.76] She's running out the door
[02:36.21] She's running out
[02:41.36] She run, run, run, run
[02:56.65] Run!
[03:05.47] Whatever makes you happy
[03:10.83] Whatever you want
[03:15.98] You're so fuckin' special
[03:21.00] I wish I was special
[03:26.22] But I'm a creep
[03:31.58] I'm a weirdo
[03:36.34] What the hell am I doing here?
[03:41.97] I don't belong here
[03:47.39] I don't belong here
[03:50.78]`,
				DominantColors: []string{"#E2A54A", "#9B6327", "#1E1F22"},
			},
			{
				ID:         "rh-karma-police",
				Title:      "Karma Police",
				Artist:     "Radiohead",
				Album:      "OK Computer",
				Year:       1997,
				CoverURL:   "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png",
				PreviewURL: "https://archive.org/download/jolly-roger_202505/Radiohead%20-%20OK%20Computer%20%281997%2C2009%20Deluxe%29%20%5BFLAC%5D%2088/CD%201/06.%20Karma%20Police.mp3",
				DurationMs: 261000,
				BPM:        75,
				Mood:       "Ethereal Dystopia",
				SyncedLyrics: `[00:26.78]Karma police
[00:31.00]Arrest this man
[00:33.39]He talks in maths
[00:37.46]He buzzes like a fridge
[00:39.77]He's like a detuned radio
[00:46.55]
[00:52.66]Karma police
[00:56.90]Arrest this girl
[00:59.12]Her Hitler hairdo
[01:03.27]Is making me feel ill
[01:05.45]And we have crashed her party
[01:13.60]
[01:18.45]This is what you get
[01:21.79]
[01:24.66]This is what you get
[01:28.00]
[01:31.00]This is what you get
[01:34.56]When you mess with us
[01:38.42]
[01:43.58]Karma police
[01:47.77]I've given all I can
[01:50.05]It's not enough
[01:54.23]I've given all I can
[01:56.38]But we're still on the payroll
[02:09.10]This is what you get
[02:12.44]
[02:15.38]This is what you get
[02:18.90]
[02:21.97]This is what you get
[02:25.39]When you mess with us
[02:31.84]
[02:34.67]For a minute there
[02:37.96]I lost myself
[02:41.15]I lost myself
[02:47.10]Phew, for a minute there
[02:50.69]I lost myself
[02:53.92]I lost myself
[02:59.50]Ohh...
[03:05.00]Oh...
[03:08.25]Ohh...
[03:11.98]For a minute there
[03:14.60](Yeah...)
[03:16.19]I lost myself
[03:17.78](Yeah...)
[03:19.39]I lost myself
[03:20.96](Yeah...)
[03:25.32]Phew, for a minute there
[03:27.27](Yeah...)
[03:28.90]I lost myself
[03:30.46](Yeah...)
[03:32.14]I lost myself
[03:33.72](Yeah...)
[03:40.06](Yeah...)
[03:43.18](Yeah...)
[03:46.40](Yeah...)
[03:52.77](Yeah...)
[03:55.90](Yeah...)
[03:59.10](Yeah...)
[04:01.16]`,
				DominantColors: []string{"#668BA4", "#2A4B63", "#1E1F22"},
			},
			{
				ID:         "rh-no-surprises",
				Title:      "No Surprises",
				Artist:     "Radiohead",
				Album:      "OK Computer",
				Year:       1997,
				CoverURL:   "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png",
				PreviewURL: "https://archive.org/download/jolly-roger_202505/Radiohead%20-%20OK%20Computer%20%281997%2C2009%20Deluxe%29%20%5BFLAC%5D%2088/CD%201/10.%20No%20Surprises.mp3",
				DurationMs: 228000,
				BPM:        76,
				Mood:       "Hypnotic Lullaby",
				SyncedLyrics: `[00:25.47] A heart that's full up like a landfill
[00:35.21] A job that slowly kills you
[00:41.75] Bruises that won't heal
[00:47.87] ♪
[00:51.34] You look so tired, unhappy
[00:57.65] Bring down the government
[01:03.87] They don't, they don't speak for us
[01:14.47] 
[01:16.67] I'll take a quiet life
[01:22.24] A handshake of carbon monoxide
[01:28.97] And no alarms and no surprises
[01:35.07] No alarms and no surprises
[01:41.48] No alarms and no surprises
[01:47.53] Silent
[01:54.03] Silent
[02:00.78] This is my final fit
[02:06.06] My final bellyache with
[02:12.93] No alarms and no surprises
[02:19.47] No alarms and no surprises
[02:25.22] No alarms and no surprises, please
[02:35.23] ♪
[02:38.59] ♪
[02:55.96] Such a pretty house
[03:01.40] And such a pretty garden
[03:08.07] No alarms and no surprises (get me out of here)
[03:14.23] No alarms and no surprises (get me out of here)
[03:20.26] No alarms and no surprises (get me out of here)
[03:26.06] Please
[03:28.51]`,
				DominantColors: []string{"#52796F", "#2F3E46", "#1E1F22"},
			},
			{
				ID:         "rh-high-and-dry",
				Title:      "High and Dry",
				Artist:     "Radiohead",
				Album:      "The Bends",
				Year:       1995,
				CoverURL:   "https://upload.wikimedia.org/wikipedia/en/5/55/Radioheadthebends.png",
				PreviewURL: "https://archive.org/download/the-bends_202607/Radiohead%20-%20The%20Bends%20-%20Track%20%2803%29.mp3",
				DurationMs: 257000,
				BPM:        88,
				Mood:       "Nostalgic Alt-Rock",
				SyncedLyrics: `[00:27.60]Two jumps in a week
[00:29.41]I bet you think that's pretty clever, don't you, boy?
[00:34.69]
[00:38.62]Flying on your motorcycle
[00:41.38]Watching all the ground beneath you drop
[00:45.80]
[00:49.38]You'd kill yourself for recognition
[00:52.40]Kill yourself to never, ever stop
[00:56.71]
[01:00.34]You broke another mirror
[01:03.02]You're turning into something you are not
[01:08.04]
[01:09.68]Don't leave me high
[01:15.08]Don't leave me dry
[01:20.61]Don't leave me high
[01:25.95]Don't leave me dry
[01:29.31]
[01:44.37]Drying up in conversation
[01:47.20]You will be the one who cannot talk
[01:51.78]
[01:55.51]All your insides fall to pieces
[01:58.16]You just sit there wishing you could still make love
[02:03.15]
[02:06.52]They're the ones who'll hate you
[02:08.48]When you think you've got the world all sussed out
[02:14.05]
[02:17.35]They're the ones who'll spit at you
[02:20.00]You will be the one screaming out
[02:25.38]
[02:26.06]Don't leave me high
[02:31.51]Don't leave me dry
[02:36.93]Don't leave me high
[02:42.28]Don't leave me dry
[02:48.78]
[03:09.40]Oh, it's the best thing that you've ever had
[03:13.52]The best thing that you've ever, ever had
[03:18.48]
[03:21.31]It's the best thing that you've ever had
[03:24.36]The best thing you've had is gone away
[03:29.76]
[03:30.40]So don't leave me high
[03:35.98]Don't leave me dry
[03:41.33]Don't leave me high
[03:46.73]Don't leave me dry
[03:52.13]Don't leave me high
[04:01.40]
[04:02.67]Don't leave me high
[04:08.18]Don't leave me dry
[04:11.80]`,
				DominantColors: []string{"#E07A5F", "#3D405B", "#1E1F22"},
			},
			{
				ID:         "rh-fake-plastic-trees",
				Title:      "Fake Plastic Trees",
				Artist:     "Radiohead",
				Album:      "The Bends",
				Year:       1995,
				CoverURL:   "https://upload.wikimedia.org/wikipedia/en/5/55/Radioheadthebends.png",
				PreviewURL: "https://archive.org/download/the-bends_202607/Radiohead%20-%20The%20Bends%20-%20Track%20%2804%29.mp3",
				DurationMs: 290000,
				BPM:        73,
				Mood:       "Acoustic Melancholy",
				SyncedLyrics: `[00:03.38] Her green plastic watering can
[00:09.52] For her fake Chinese rubber plant
[00:15.25] In the fake plastic earth
[00:22.58] 
[00:29.16] That she bought from a rubber man
[00:35.41] In a town full of rubber plans
[00:41.45] To get rid of itself
[00:48.07] 
[00:51.25] It wears her out
[00:55.39] 
[00:57.73] It wears her out
[01:01.68] 
[01:04.08] It wears her out
[01:08.08] 
[01:10.45] It wears her out
[01:14.26] 
[01:21.59] She lives with a broken man
[01:28.22] A cracked polystyrene man
[01:33.64] Who just crumbles and burns
[01:40.77] 
[01:47.88] He used to do surgery
[01:54.25] For girls in the eighties
[01:59.13] But gravity always wins
[02:06.64] 
[02:09.33] And it wears him out
[02:13.25] 
[02:16.19] It wears him out
[02:20.20] 
[02:22.45] It wears him out
[02:28.35] It wears
[02:36.55] 
[02:39.77] She looks like the real thing
[02:46.52] She tastes like the real thing
[02:51.81] My fake plastic love
[02:58.98] 
[03:05.81] But I can't help the feeling
[03:12.14] I could blow through the ceiling
[03:17.96] If I just turn and run
[03:25.05] 
[03:27.82] And it wears me out
[03:31.68] 
[03:34.22] It wears me out
[03:38.10] 
[03:40.73] It wears me out
[03:44.50] 
[03:46.71] It wears me out
[03:53.27] And if I could be who you wanted
[03:59.82] If I could be who you wanted
[04:06.73] All the time
[04:13.33] All the time
[04:15.81]`,
				DominantColors: []string{"#84A98C", "#354F52", "#1E1F22"},
			},
			{
				ID:         "rh-paranoid-android",
				Title:      "Paranoid Android",
				Artist:     "Radiohead",
				Album:      "OK Computer",
				Year:       1997,
				CoverURL:   "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png",
				PreviewURL: "https://archive.org/download/jolly-roger_202505/Radiohead%20-%20OK%20Computer%20%281997%2C2009%20Deluxe%29%20%5BFLAC%5D%2088/CD%201/02.%20Paranoid%20Android.mp3",
				DurationMs: 387000,
				BPM:        82,
				Mood:       "Progressive Epic",
				SyncedLyrics: `[00:21.25]Please could you stop the noise?
[00:25.35]I'm trying to get some rest
[00:31.10]
[00:38.75]From all the unborn chicken
[00:43.68]Voices in my head
[00:49.91]
[00:51.87]What's that?
[00:54.42](I may be paranoid, but not an android)
[01:00.70]What's that?
[01:02.75](I may be paranoid, but not an android)
[01:07.90]
[01:11.15]When I am king
[01:14.10]You will be first against the wall
[01:20.29]
[01:28.79]With your opinion
[01:31.97]Which is of no consequence at all
[01:41.89]What's that?
[01:43.40](I may be paranoid, but no android)
[01:50.69]What's that?
[01:52.15](I may be paranoid, but no android)
[01:58.30]
[02:12.00](La, la, la, la, la, la)
[02:14.55](La, la, la, la, la, la)
[02:17.09](La, la, la, la, la, la)
[02:19.65](La, la, la, la)
[02:21.09]
[02:22.57]Ambition makes you look pretty ugly
[02:26.00]
[02:28.50]Kicking, squealing, Gucci little piggy
[02:32.18]
[02:36.90](La, la, la, la, la, la)
[02:39.42](La, la, la, la, la)
[02:41.99](La, la, la, la)
[02:43.49]
[02:44.95]You don't remember
[02:46.40]You don't remember
[02:47.89]Why don't you remember my name?
[02:50.85]Off with his head, man
[02:52.15]Off with his head, man
[02:53.70]Why don't you remember my name?
[02:55.45]I guess he does
[03:05.93]
[04:07.20]Rain down
[04:11.75]Rain down
[04:13.94]Come on, rain down on me
[04:23.10]From a great height
[04:26.83]From a great height
[04:33.70]Height
[04:37.48]Rain down
[04:42.25]Rain down
[04:44.45]Come on, rain down on me
[04:53.62]From a great height
[04:57.42]From a great height
[05:04.28]Height
[05:08.42]That's it, sir (Rain down)
[05:10.34]You're leaving
[05:12.30]The crackle (Rain down)
[05:14.16]Of pigskin (Come on)
[05:16.26]The dust and (Rain down)
[05:18.02]The screaming (On me)
[05:19.95]The yuppies networking and
[05:23.72]The panic (From a great)
[05:25.70]The vomit (Height)
[05:27.62]The panic (From a great)
[05:29.50]The vomit (Height)
[05:31.42]God loves his children
[05:35.20]God loves his children, yeah
[05:40.26]
[05:44.08](The family see him as very ugly)
[05:46.52]`,
				DominantColors: []string{"#3D5A80", "#293241", "#1E1F22"},
			},
			{
				ID:         "rh-exit-music",
				Title:      "Exit Music (For a Film)",
				Artist:     "Radiohead",
				Album:      "OK Computer",
				Year:       1997,
				CoverURL:   "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png",
				PreviewURL: "https://archive.org/download/jolly-roger_202505/Radiohead%20-%20OK%20Computer%20%281997%2C2009%20Deluxe%29%20%5BFLAC%5D%2088/CD%201/04.%20Exit%20Music%20%28For%20A%20Film%29.mp3",
				DurationMs: 264000,
				BPM:        62,
				Mood:       "Haunting Dystopia",
				SyncedLyrics: `[00:23.80] Wake from your sleep
[00:31.55] The drying of your tears
[00:39.35] Today, we escape
[00:46.65] We escape
[00:51.93] 
[00:55.55] Pack and get dressed
[01:02.88] Before your father hears us
[01:10.73] Before all hell breaks loose
[01:22.94] 
[01:26.52] Breathe, keep breathing
[01:36.53] Don't lose your nerve
[01:46.39] 
[01:50.38] Breathe, keep breathing
[02:00.13] I can't do this alone
[02:09.72] 
[02:17.97] Sing us a song
[02:25.72] A song to keep us warm
[02:34.13] There's such a chill
[02:40.98] Such a chill
[02:46.67] 
[02:50.10] You can laugh
[02:57.67] A spineless laugh
[03:05.57] We hope your rules and wisdom choke you
[03:21.44] Now we are one in everlasting peace
[03:36.94] We hope that you choke, that you choke
[03:52.46] We hope that you choke, that you choke
[04:07.75] We hope that you choke, that you choke
[04:24.80]`,
				DominantColors: []string{"#1C2541", "#0B132B", "#1E1F22"},
			},
		},
	}
}

// GetAll returns all Radiohead tracks
func (s *Store) GetAll() []models.RadioheadTrack {
	s.mu.RLock()
	defer s.mu.RUnlock()
	copied := make([]models.RadioheadTrack, len(s.tracks))
	copy(copied, s.tracks)
	return copied
}

// GetByID returns track by its ID
func (s *Store) GetByID(id string) (*models.RadioheadTrack, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, t := range s.tracks {
		if t.ID == id {
			return &t, true
		}
	}
	return nil, false
}

// SetTracks updates the tracks in store
func (s *Store) SetTracks(newTracks []models.RadioheadTrack) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tracks = newTracks
}
