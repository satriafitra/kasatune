import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Check, Disc, Music, Sparkles, Globe, Loader2, UserCheck } from 'lucide-react';
import { searchLiveArtists, isValidImageUrl, type LiveAlbumItem } from '../api/liveSearch';

export interface PinnedServerItem {
  id: string; // e.g. 'richbrian', 'playboicarti', 'sheilaon7', 'radiohead', 'online-artist-13874291'
  name: string;
  artist: string;
  albumTitle: string;
  year?: number;
  imageUrl: string;
  trackCount?: number;
  collectionId?: number;
  type?: 'album' | 'artist';
  description?: string;
  categoryTag?: string;
}

export const CATALOG_ALBUMS: PinnedServerItem[] = [
  {
    id: 'richbrian',
    name: 'Rich Brian',
    artist: 'Rich Brian',
    albumTitle: 'Popular Hits',
    year: 2024,
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/432a97f2d8da2aa987b7cc721936ea7e/1000x1000-000000-80-0-0.jpg',
    description: '2.8M monthly listeners • Verified by Spotify (edamame, C’est La Vie, Midsummer Madness, Gospel)',
    categoryTag: 'Hip-Hop / Rap',
    type: 'artist',
  },
  {
    id: 'playboicarti',
    name: 'Playboi Carti',
    artist: 'Playboi Carti',
    albumTitle: 'Popular Hits',
    year: 2020,
    imageUrl: '/covers/playboicarti.jpg',
    description: '40.5M monthly listeners • Verified by Spotify (Timeless, FE!N, Popular, Vamp Anthem, Magnolia)',
    categoryTag: 'Rage / Trap',
    type: 'artist',
  },
  {
    id: 'sheilaon7',
    name: 'Sheila On 7',
    artist: 'Sheila On 7',
    albumTitle: 'Diskografi Lengkap & Hits Populer',
    year: 1999,
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/9e6cc50e80a7dcb4dacc7eb15427335b/1000x1000-000000-80-0-0.jpg',
    description: '4.8M monthly listeners • Band pop rock legendaris (Dan..., Sephia, Kita, Melompat Lebih Tinggi)',
    categoryTag: 'Indo Pop Rock',
    type: 'artist',
  },
  {
    id: 'radiohead',
    name: 'Radiohead',
    artist: 'Radiohead',
    albumTitle: '9 Studio Albums Collection',
    year: 1993,
    imageUrl: '/covers/radiohead.jpg',
    description: '28.3M monthly listeners • Verified by Spotify (Creep, No Surprises, Karma Police, High and Dry)',
    categoryTag: 'Alternative Rock',
    type: 'artist',
  },
  {
    id: 'drake',
    name: 'Drake',
    artist: 'Drake',
    albumTitle: 'Scorpion, Views & Hits',
    year: 2018,
    imageUrl: '/covers/drake.jpg',
    description: '78.4M monthly listeners • Verified by Spotify (God\'s Plan, One Dance, Hotline Bling, Passionfruit)',
    categoryTag: 'Hip-Hop / Rap',
    type: 'artist',
  },
  {
    id: 'brunomars',
    name: 'Bruno Mars',
    artist: 'Bruno Mars',
    albumTitle: '24K Magic & Hits',
    year: 2016,
    imageUrl: '/covers/brunomars.jpg',
    description: '115.2M monthly listeners • Verified by Spotify (Die With A Smile, That\'s What I Like, 24K Magic)',
    categoryTag: 'Pop / R&B',
    type: 'artist',
  },
  {
    id: 'jkt48',
    name: 'JKT48 Official',
    artist: 'JKT48',
    albumTitle: 'Mahagita & Special Singles',
    year: 2024,
    imageUrl: '/covers/jkt48.jpg',
    description: '2.1M monthly listeners • Rapsodi, Heavy Rotation, Fortune Cookie, Seventeen & Pesawat Kertas 365 Hari',
    categoryTag: 'Idol Pop',
    type: 'artist',
  },
  {
    id: 'leserafim',
    name: 'LE SSERAFIM',
    artist: 'LE SSERAFIM',
    albumTitle: 'UNFORGIVEN, ANTIFRAGILE & FEARLESS',
    year: 2023,
    imageUrl: '/covers/leserafim.jpg',
    description: '14.2M monthly listeners • Easy, Smart, Antifragile, Unforgiven, Fearless & Perfect Night',
    categoryTag: 'K-Pop',
    type: 'artist',
  },
  {
    id: 'twice',
    name: 'TWICE',
    artist: 'TWICE',
    albumTitle: 'Formula of Love & Hits',
    year: 2021,
    imageUrl: '/covers/twice.jpg',
    description: '12.8M monthly listeners • What is Love?, Feel Special, FANCY, The Feels & Alcohol-Free',
    categoryTag: 'K-Pop',
    type: 'artist',
  },
  {
    id: 'aespa',
    name: 'aespa',
    artist: 'aespa',
    albumTitle: 'Supernova, Armageddon & Whiplash',
    year: 2024,
    imageUrl: '/covers/aespa.jpg',
    description: '15.6M monthly listeners • Supernova, Armageddon, Next Level, Savage, Drama & Whiplash',
    categoryTag: 'K-Pop / Hyperpop',
    type: 'artist',
  },
  {
    id: 'akumanoko',
    name: 'Ai Higuchi (ヒグチアイ)',
    artist: 'Ai Higuchi',
    albumTitle: '悪魔の子 (Akuma no Ko) & Hits',
    year: 2022,
    imageUrl: '/covers/akumanoko.jpg',
    description: '3.7M monthly listeners • Lagu original Attack on Titan Final Season Part 2 Ending Theme',
    categoryTag: 'J-Pop / Anime',
    type: 'artist',
  },
  {
    id: 'vander',
    name: 'vander! / vender!',
    artist: 'Vander (vandereism)',
    albumTitle: 'KING MOKONDO & Bencana Alam',
    year: 2025,
    imageUrl: '/covers/vander.jpg',
    description: '1.2M monthly listeners • Bencana Alam, King Mokondo & Vandereism album hits',
    categoryTag: 'Hip-Hop / Rap',
    type: 'artist',
  },
];

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedServers: PinnedServerItem[];
  onTogglePin: (server: PinnedServerItem) => void;
  onSelectAndPin: (server: PinnedServerItem) => void;
}

export const AddAlbumModal: React.FC<AddAlbumModalProps> = ({
  isOpen,
  onClose,
  pinnedServers,
  onTogglePin,
  onSelectAndPin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineArtists, setOnlineArtists] = useState<LiveAlbumItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Global Real-Time Live Online Search for Artists (Debounced 350ms)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setOnlineArtists([]);
      setIsSearchingOnline(false);
      return;
    }

    const lowerQ = q.toLowerCase();
    const localMatches: LiveAlbumItem[] = CATALOG_ALBUMS.filter((c) => {
      const name = c.name.toLowerCase();
      const artist = c.artist.toLowerCase();
      const album = c.albumTitle.toLowerCase();
      const id = c.id.toLowerCase();
      return (
        name.includes(lowerQ) ||
        artist.includes(lowerQ) ||
        album.includes(lowerQ) ||
        id.includes(lowerQ) ||
        (lowerQ.includes('vender') && (id === 'vander' || name.includes('vender'))) ||
        (lowerQ.includes('vander') && (id === 'vander' || name.includes('vander')))
      );
    }).map((c) => ({
      id: c.id,
      name: c.name,
      artist: c.artist,
      albumTitle: c.albumTitle,
      imageUrl: c.imageUrl,
      type: 'artist' as const,
      genre: c.categoryTag || 'Artis Terverifikasi',
      description: c.description || 'Artis Terverifikasi Kasatune',
    }));

    if (localMatches.length > 0) {
      setOnlineArtists(localMatches);
    }

    const controller = new AbortController();
    setIsSearchingOnline(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchLiveArtists(q, controller.signal);
        const seen = new Set(localMatches.map((m) => m.name.toLowerCase().trim()));
        const combined = [...localMatches];
        for (const item of results) {
          const key = item.name.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(item);
          }
        }
        setOnlineArtists(combined);
      } catch {
        if (localMatches.length > 0) {
          setOnlineArtists(localMatches);
        } else {
          setOnlineArtists([]);
        }
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const hasOnlineResults = onlineArtists.length > 0;
  const isSearchActive = searchQuery.trim().length >= 2;

  const pinnedIds = useMemo(() => {
    return new Set(pinnedServers.map((s) => s.id));
  }, [pinnedServers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0E1013] border border-[#282B32] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[88vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#282B32] flex items-center justify-between bg-[#0A0C0E]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1DB954]" />
              <span>Tambah Artis Favorit</span>
            </h2>
            <p className="text-xs text-[#949BA4] mt-0.5">
              Cari dan sematkan artis favorit ke sidebar kiri untuk melihat profil banner dan lagu populernya.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#949BA4] hover:text-white hover:bg-[#1C1E22] transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Live Search Bar */}
        <div className="p-3 sm:p-4 border-b border-[#282B32]/70 bg-[#0B0D10]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-[#949BA4]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama artis (cth: Rich Brian, Playboi Carti, Sheila On 7, Radiohead, Taylor Swift, NIKI)..."
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#141619] border border-[#282B32] text-xs text-white placeholder-[#656A74] focus:outline-none focus:border-[#1DB954] transition-colors"
              autoFocus
            />
            {isSearchingOnline ? (
              <Loader2 className="w-4 h-4 absolute right-3 text-[#1DB954] animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#949BA4] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Real-time Status Badge */}
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#8C929C]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
              <span>Pencarian Real-Time Terhubung ke Database Artis Global (Spotify &amp; Apple Music)</span>
            </div>
            {isSearchingOnline && (
              <span className="text-[#1DB954] font-medium animate-pulse">
                Mencari artis...
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Results */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
          {/* Live Online Artist Results */}
          {hasOnlineResults ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1DB954] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#1DB954]" />
                  <span>Hasil Artis Ditemukan ({onlineArtists.length} Artis)</span>
                </span>
                <span className="text-[10px] text-[#8C929C] font-mono">SPOTIFY LIVE</span>
              </div>

              {onlineArtists.map((item) => {
                const isPinned = pinnedIds.has(item.id);
                const serverItem: PinnedServerItem = {
                  id: item.id,
                  name: item.name,
                  artist: item.artist,
                  albumTitle: 'Popular Hits',
                  year: item.year || 2024,
                  imageUrl: item.imageUrl,
                  type: 'artist',
                  description: item.description || 'Verified by Spotify',
                  categoryTag: item.genre || 'Artis Terverifikasi',
                };

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 sm:gap-4 ${
                      isPinned
                        ? 'bg-[#151A18] border-[#1DB954]/50 shadow-sm'
                        : 'bg-[#121418] hover:bg-[#181B21] border-[#22252C] hover:border-[#383C45]'
                    }`}
                  >
                    {/* Circular Avatar & Artist Info */}
                    <div
                      onClick={() => onSelectAndPin(serverItem)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#141619] border border-[#282B32] flex-shrink-0 relative shadow-sm group-hover:ring-2 group-hover:ring-[#1DB954] transition-all flex items-center justify-center">
                        <span className="text-xs font-bold text-white/80 uppercase select-none">
                          {item.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || '♪'}
                        </span>
                        {isValidImageUrl(item.imageUrl) && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover select-none absolute inset-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors leading-tight">
                            {item.name}
                          </p>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30 flex-shrink-0">
                            ARTIST
                          </span>
                        </div>
                        <p className="text-xs text-[#A0A5AD] truncate mt-0.5">
                          {item.description || 'Verified by Spotify'}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onSelectAndPin(serverItem)}
                        className={`h-8 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                          isPinned
                            ? 'bg-[#1DB954]/15 border border-[#1DB954]/40 text-[#1DB954] hover:bg-[#1DB954]/25'
                            : 'bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-md'
                        }`}
                      >
                        {isPinned ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Buka Artis</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Artis</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : isSearchActive ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-[#949BA4]">
              {isSearchingOnline ? (
                <>
                  <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin mb-3" />
                  <p className="text-sm font-bold text-white">Mencari artis di Spotify &amp; Apple Music...</p>
                  <p className="text-xs text-[#656A74] mt-1">Menghubungkan ke katalog global...</p>
                </>
              ) : (
                <>
                  <Globe className="w-10 h-10 text-[#656A74] mb-2 stroke-[1.5]" />
                  <p className="text-sm font-bold text-white">Tidak ada artis ditemukan</p>
                  <p className="text-xs text-[#656A74] mt-1 max-w-xs">
                    Pastikan ejaan nama artis sudah benar (misal: Rich Brian, Playboi Carti, Taylor Swift, NIKI).
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Clean Empty State when user hasn't typed anything yet */
            <div className="py-20 flex flex-col items-center justify-center text-center text-[#949BA4]">
              <div className="w-14 h-14 rounded-full bg-[#141619] border border-[#282B32] flex items-center justify-center mb-3 text-[#1DB954] shadow-inner">
                <Search className="w-6 h-6 stroke-[2]" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Cari &amp; Tambahkan Artis</p>
              <p className="text-xs text-[#656A74] max-w-sm leading-relaxed">
                Ketik nama artis favorit kamu di kolom pencarian di atas untuk menemukan profil Spotify dan lagu populernya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
