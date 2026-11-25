import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Check, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#121213] border border-white/[0.09] rounded-xl overflow-hidden flex flex-col max-h-[82vh] z-10">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#EEDFC7]">Tambah Artis</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9A9288]"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Search Input */}
        <div className="px-4 py-3 border-b border-white/[0.07]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#68625B] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama artis..."
              className="w-full h-10 pl-9 pr-9 rounded-lg bg-[#19191B] border border-white/[0.08] text-sm text-[#EEDFC7] placeholder-[#68625B] focus:outline-none focus:border-[#CE7F20]"
              autoFocus
            />
            {isSearchingOnline ? (
              <Loader2 className="w-4 h-4 absolute right-3 text-[#CE7F20] animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#9A9288]"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {hasOnlineResults ? (
            <div className="space-y-0.5">
              {onlineArtists.map((item) => {
                const isPinned = pinnedIds.has(item.id);
                const subtitle = item.nb_fan
                  ? `${(item.nb_fan * 45).toLocaleString()} pendengar`
                  : item.genre && item.genre !== 'Artis Terverifikasi'
                  ? item.genre
                  : 'Artis';

                const serverItem: PinnedServerItem = {
                  id: item.id,
                  name: item.name,
                  artist: item.artist,
                  albumTitle: 'Popular Hits',
                  year: item.year || 2024,
                  imageUrl: item.imageUrl,
                  type: 'artist',
                  description: item.description || subtitle,
                  categoryTag: item.genre || 'Artis',
                };

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectAndPin(serverItem)}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-3 cursor-pointer group ${
                      isPinned
                        ? 'bg-white/[0.05]'
                        : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#19191B] flex-shrink-0 relative flex items-center justify-center border border-white/[0.06]">
                        <span className="text-[11px] font-semibold text-[#9A9288] uppercase select-none">
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
                        <p className="text-sm font-medium text-[#EEDFC7] truncate leading-snug">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#9A9288] truncate">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAndPin(serverItem);
                      }}
                      className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                        isPinned
                          ? 'bg-[#607938]/20 text-[#EEDFC7] border border-[#607938]'
                          : 'bg-[#CE7F20] text-[#0B0B0C]'
                      }`}
                    >
                      {isPinned ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Buka</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Tambah</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : isSearchActive ? (
            <div className="py-12 text-center text-xs text-[#8C929C]">
              {isSearchingOnline ? 'Mencari artis...' : 'Artis tidak ditemukan.'}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#7A8089]">
              Ketik minimal 2 huruf untuk mencari artis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
