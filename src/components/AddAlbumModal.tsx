import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Check, Disc, Music, Sparkles, Globe, Loader2 } from 'lucide-react';
import { searchLiveAlbums, type LiveAlbumItem } from '../api/liveSearch';

export interface PinnedServerItem {
  id: string; // e.g. 'sheilaon7', 'radiohead', 'online-album-1481804269'
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
    id: 'sheilaon7',
    name: 'Sheila On 7',
    artist: 'Sheila On 7',
    albumTitle: 'Kisah Klasik, 07 Des, Berlayar & Hits',
    year: 1999,
    imageUrl: 'https://images.genius.com/f9c8fbc789dd1a8a2d3c907d79b94235.1000x1000x1.jpg',
    description: 'Band pop rock legendaris Indonesia (Dan..., Kita, Sephia, Melompat Lebih Tinggi, Seberapa Pantas)',
    categoryTag: 'Indo Pop Rock',
    type: 'artist',
  },
  {
    id: 'radiohead',
    name: 'Radiohead (Diskografi Lengkap)',
    artist: 'Radiohead',
    albumTitle: '9 Studio Albums Collection',
    year: 1993,
    imageUrl: '/covers/radiohead.jpg',
    description: 'Semua lagu Radiohead dari 9 album studio legendaris (112 lagu lengkap).',
    categoryTag: 'Alternative Rock',
    type: 'artist',
  },
  {
    id: 'OK Computer',
    name: 'OK Computer',
    artist: 'Radiohead',
    albumTitle: 'OK Computer (1997)',
    year: 1997,
    imageUrl: '/covers/ok_computer.jpg',
    description: 'Paranoid Android, Karma Police, No Surprises, Exit Music & Subterranean Homesick Alien.',
    categoryTag: 'Art Rock',
    type: 'album',
  },
  {
    id: 'Kid A',
    name: 'Kid A',
    artist: 'Radiohead',
    albumTitle: 'Kid A (2000)',
    year: 2000,
    imageUrl: '/covers/kid_a.jpg',
    description: 'Everything in Its Right Place, Idioteque, The National Anthem & How to Disappear Completely.',
    categoryTag: 'Electronic',
    type: 'album',
  },
  {
    id: 'In Rainbows',
    name: 'In Rainbows',
    artist: 'Radiohead',
    albumTitle: 'In Rainbows (2007)',
    year: 2007,
    imageUrl: '/covers/in_rainbows.jpg',
    description: 'Weird Fishes/Arpeggi, Reckoner, Nude, Jigsaw Falling Into Place & 15 Step.',
    categoryTag: 'Alternative',
    type: 'album',
  },
  {
    id: 'The Bends',
    name: 'The Bends',
    artist: 'Radiohead',
    albumTitle: 'The Bends (1995)',
    year: 1995,
    imageUrl: '/covers/the_bends.jpg',
    description: 'High and Dry, Fake Plastic Trees, Street Spirit (Fade Out) & Just.',
    categoryTag: 'Britpop / Rock',
    type: 'album',
  },
  {
    id: 'Pablo Honey',
    name: 'Pablo Honey',
    artist: 'Radiohead',
    albumTitle: 'Pablo Honey (1993)',
    year: 1993,
    imageUrl: '/covers/pablo_honey.jpg',
    description: 'Creep, Anyone Can Play Guitar, Blow Out & Stop Whispering.',
    categoryTag: 'Grunge / Rock',
    type: 'album',
  },
  {
    id: 'jkt48',
    name: 'JKT48 Official',
    artist: 'JKT48',
    albumTitle: 'Mahagita, Heavy Rotation & Special Singles',
    year: 2024,
    imageUrl: '/covers/jkt48.jpg',
    description: 'Rapsodi, Heavy Rotation, Fortune Cookie, Seventeen & Pesawat Kertas 365 Hari.',
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
    description: 'Easy, Smart, Antifragile, Unforgiven, Fearless & Perfect Night.',
    categoryTag: 'K-Pop',
    type: 'artist',
  },
  {
    id: 'twice',
    name: 'TWICE',
    artist: 'TWICE',
    albumTitle: 'Formula of Love & Hits Collection',
    year: 2021,
    imageUrl: '/covers/twice.jpg',
    description: 'What is Love?, Feel Special, FANCY, The Feels, I CAN\'T STOP ME & Alcohol-Free.',
    categoryTag: 'K-Pop',
    type: 'artist',
  },
  {
    id: 'aespa',
    name: 'aespa',
    artist: 'aespa',
    albumTitle: 'Supernova, Armageddon, Savage & Drama',
    year: 2024,
    imageUrl: '/covers/aespa.jpg',
    description: 'Supernova, Armageddon, Next Level, Savage, Drama & Whiplash.',
    categoryTag: 'K-Pop / Hyperpop',
    type: 'artist',
  },
  {
    id: 'vander',
    name: 'vander! / vender!',
    artist: 'Vander (vandereism)',
    albumTitle: 'KING MOKONDO & Bencana Alam',
    year: 2025,
    imageUrl: '/covers/vander.jpg',
    description: 'Bencana Alam, King Mokondo & Vandereism album hits.',
    categoryTag: 'Hip-Hop / Rap',
    type: 'artist',
  },
  {
    id: 'playboicarti',
    name: 'Playboi Carti',
    artist: 'Playboi Carti',
    albumTitle: 'Whole Lotta Red & Die Lit',
    year: 2020,
    imageUrl: '/covers/playboicarti.jpg',
    description: 'Magnolia, Sky, wokeuplikethis*, Location, Shoota & ILoveUIHateU.',
    categoryTag: 'Rage / Trap',
    type: 'artist',
  },
  {
    id: 'drake',
    name: 'Drake',
    artist: 'Drake',
    albumTitle: 'Scorpion, Views & Certified Lover Boy',
    year: 2018,
    imageUrl: '/covers/drake.jpg',
    description: 'God\'s Plan, One Dance, Hotline Bling, Passionfruit & In My Feelings.',
    categoryTag: 'Hip-Hop / R&B',
    type: 'artist',
  },
  {
    id: 'brunomars',
    name: 'Bruno Mars',
    artist: 'Bruno Mars',
    albumTitle: '24K Magic & Doo-Wops',
    year: 2016,
    imageUrl: '/covers/brunomars.jpg',
    description: 'Die With A Smile, That\'s What I Like, 24K Magic, Versace on the Floor & Grenade.',
    categoryTag: 'Pop / Funk',
    type: 'artist',
  },
  {
    id: 'akumanoko',
    name: 'Ai Higuchi (悪魔の子)',
    artist: 'Ai Higuchi (ヒグチアイ)',
    albumTitle: '悪魔の子 (Akuma no Ko) - Single',
    year: 2022,
    imageUrl: '/covers/akumanoko.jpg',
    description: 'Lagu original Attack on Titan Final Season Part 2 Ending Theme.',
    categoryTag: 'J-Pop / Anime',
    type: 'album',
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
  const [onlineAlbums, setOnlineAlbums] = useState<LiveAlbumItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Global Real-Time Live Online Search (Debounced 350ms)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setOnlineAlbums([]);
      setIsSearchingOnline(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingOnline(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchLiveAlbums(q, 30, controller.signal);
        setOnlineAlbums(results);
      } catch {
        setOnlineAlbums([]);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  // Local Catalog Filter
  const filteredLocalCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CATALOG_ALBUMS;
    return CATALOG_ALBUMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.artist.toLowerCase().includes(q) ||
        item.albumTitle.toLowerCase().includes(q) ||
        (item.categoryTag && item.categoryTag.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Merged items: prioritize live online results if search is active
  const hasOnlineResults = onlineAlbums.length > 0;
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
              <span>Katalog Album &amp; Artis Online Global</span>
            </h2>
            <p className="text-xs text-[#949BA4] mt-0.5">
              Cari dan sematkan album atau artis apa saja dari seluruh dunia ke sidebar kiri.
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
              placeholder="Cari album/artis apa saja di dunia (misal: Hindia, Dewa 19, Coldplay, Taylor Swift, Billie Eilish)..."
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
              <span>Pencarian Real-Time Terhubung ke Database Global (iTunes &amp; Apple Music)</span>
            </div>
            {isSearchingOnline && (
              <span className="text-[#1DB954] font-medium animate-pulse">
                Mencari online...
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Results */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
          {/* Section 1: Live Online Albums from Global Internet */}
          {hasOnlineResults && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1DB954] flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-[#1DB954]" />
                  <span>Hasil Online Global Live ({onlineAlbums.length} Album)</span>
                </span>
                <span className="text-[10px] text-[#8C929C] font-mono">REAL-TIME</span>
              </div>

              {onlineAlbums.map((item) => {
                const isPinned = pinnedIds.has(item.id);
                const serverItem: PinnedServerItem = {
                  id: item.id,
                  name: item.name,
                  artist: item.artist,
                  albumTitle: item.albumTitle,
                  year: item.year,
                  imageUrl: item.imageUrl,
                  trackCount: item.trackCount,
                  collectionId: item.collectionId,
                  type: 'album',
                  description: item.description,
                  categoryTag: item.genre || 'Album Online',
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
                    {/* Thumbnail & Album Info */}
                    <div
                      onClick={() => onSelectAndPin(serverItem)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0A0C0E] border border-[#282B32] flex-shrink-0 relative shadow-sm group-hover:border-[#1DB954]/50 transition-colors">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover select-none"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors leading-tight">
                            {item.name}
                          </p>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30 flex-shrink-0">
                            ONLINE LIVE
                          </span>
                        </div>
                        <p className="text-xs text-[#A0A5AD] truncate mt-0.5">
                          <span className="font-semibold text-[#F2F3F5]">{item.artist}</span> &bull; {item.genre || 'Album'}
                        </p>
                        <p className="text-[11px] text-[#71757E] truncate mt-0.5">
                          {item.trackCount ? `${item.trackCount} Lagu` : ''} {item.year ? `• Rilis ${item.year}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onTogglePin(serverItem)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                          isPinned
                            ? 'bg-[#1DB954]/20 hover:bg-rose-500/20 text-[#1DB954] hover:text-rose-400 border border-[#1DB954]/40 hover:border-rose-500/40'
                            : 'bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold'
                        }`}
                        title={isPinned ? 'Lepas dari sidebar' : 'Sematkan ke sidebar'}
                      >
                        {isPinned ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Terpasang</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Pasang</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onSelectAndPin(serverItem)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1C1E22] hover:bg-[#282B32] text-white text-xs font-medium border border-[#282B32] transition-colors"
                        title="Buka langsung album"
                      >
                        Buka
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 2: Local / Curated Catalog */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#949BA4] flex items-center gap-1.5">
                <Disc className="w-3 h-3 text-[#BFE7EA]" />
                <span>
                  {isSearchActive
                    ? `Koleksi Siap Putar (${filteredLocalCatalog.length})`
                    : `Rekomendasi Album & Artis Populer (${filteredLocalCatalog.length})`}
                </span>
              </span>
            </div>

            {filteredLocalCatalog.map((item) => {
              const isPinned = pinnedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 sm:gap-4 ${
                    isPinned
                      ? 'bg-[#151A18] border-[#1DB954]/50'
                      : 'bg-[#121418] hover:bg-[#181B21] border-[#22252C] hover:border-[#383C45]'
                  }`}
                >
                  <div
                    onClick={() => onSelectAndPin(item)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0A0C0E] border border-[#282B32] flex-shrink-0 relative shadow-sm group-hover:border-[#1DB954]/50 transition-colors">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover select-none"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors leading-tight">
                          {item.name}
                        </p>
                        {item.categoryTag && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1C1E22] text-[#BFE7EA] border border-[#282B32] flex-shrink-0">
                            {item.categoryTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A0A5AD] truncate mt-0.5">
                        <span className="font-semibold text-[#F2F3F5]">{item.artist}</span> &bull; {item.albumTitle}
                      </p>
                      <p className="text-[11px] text-[#71757E] truncate mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onTogglePin(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        isPinned
                          ? 'bg-[#1DB954]/20 hover:bg-rose-500/20 text-[#1DB954] hover:text-rose-400 border border-[#1DB954]/40 hover:border-rose-500/40'
                          : 'bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold'
                      }`}
                      title={isPinned ? 'Lepas dari sidebar' : 'Sematkan ke sidebar'}
                    >
                      {isPinned ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Terpasang</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Pasang</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectAndPin(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1C1E22] hover:bg-[#282B32] text-white text-xs font-medium border border-[#282B32] transition-colors"
                      title="Buka langsung lagu & album"
                    >
                      Buka
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!isSearchingOnline && !hasOnlineResults && filteredLocalCatalog.length === 0 && (
            <div className="py-12 text-center text-xs text-[#71757E]">
              Tidak ada album atau artis yang cocok dengan "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 bg-[#0A0C0E] border-t border-[#282B32] flex items-center justify-between text-[11px] text-[#71757E]">
          <span>{pinnedServers.length} album disematkan di navigasi</span>
          <span>Klik "Buka" untuk langsung memutar album &amp; seluruh lagunya</span>
        </div>
      </div>
    </div>
  );
};
