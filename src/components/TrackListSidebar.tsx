/**
 * TrackListSidebar Component (Discord Channel & Queue Drawer)
 * Deep obsidian dark surfaces with vibrant Ice Blue (#BFE7EA) channel indicators:
 * - Server title with verified badge
 * - Channel list (# all-songs, # pablo-honey, # jkt48, etc.)
 * - Instant play track items with glowing Ice Blue equalizer
 * - Discord Spotify Friend Presence Card with 1-click autonomous switch
 * - Discord User Voice Presence footer
 */

import React from 'react';
import {
  Hash,
  Volume2,
  Headphones,
  Mic,
  ChevronDown,
  Globe,
  Loader2,
} from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AlbumFilterType } from './DiscordServerRail';
import type { FriendPlaybackState, FriendLiveInfo } from '../hooks/useFriendSpotify';
import { FriendSpotifyCard } from './FriendSpotifyCard';

export const matchesAlbumFilter = (track: BackendRadioheadTrack, activeAlbum: AlbumFilterType): boolean => {
  const isFriendTrack =
    track.artist.toLowerCase().includes('liella') ||
    track.album.toLowerCase().includes('shine') ||
    track.album.toLowerCase().includes('mirai') ||
    track.album.toLowerCase().includes('overlord') ||
    track.album.toLowerCase().includes('hideri') ||
    track.album.toLowerCase().includes('book') ||
    track.album.toLowerCase().includes('負け犬') ||
    track.artist.toLowerCase() === 'oxt' ||
    track.artist.toLowerCase() === 'yorushika' ||
    track.artist.toLowerCase().includes('kanaria') ||
    track.artist.toLowerCase() === 'yoasobi' ||
    track.artist.toLowerCase() === 'eve' ||
    track.artist.toLowerCase().includes('roselia') ||
    track.artist.toLowerCase().includes('ikizulive') ||
    track.artist.toLowerCase().includes('いきづらい部') ||
    track.title.toLowerCase().includes('what is my life') ||
    track.title.toLowerCase().includes('proud of oneself');

  if (activeAlbum === 'friend') return isFriendTrack;
  if (activeAlbum === 'all') return true;
  if (activeAlbum === 'radiohead') return track.artist.toLowerCase() === 'radiohead';
  if (activeAlbum === 'jkt48') return track.artist.toLowerCase().includes('jkt48');
  if (activeAlbum === 'leserafim') return track.artist.toLowerCase().includes('serafim');
  if (activeAlbum === 'twice') return track.artist.toLowerCase().includes('twice');
  if (activeAlbum === 'aespa') return track.artist.toLowerCase().includes('aespa');
  if (activeAlbum === 'h2h') return track.artist.toLowerCase().includes('heart') || track.artist.toLowerCase().includes('h2h');
  if (activeAlbum === 'RUNW') return track.title.toLowerCase().includes('runway') || track.album.toLowerCase().includes('runway');
  if (activeAlbum === 'riskiinrahim') return track.category === 'riskiinrahim' || track.artist.toLowerCase().includes('inrahim') || track.album.toLowerCase().includes('kematian');
  if (activeAlbum === 'vander') {
    return (
      track.category === 'vander' ||
      track.category === 'vender' ||
      track.artist.toLowerCase().includes('vander') ||
      track.artist.toLowerCase().includes('vender') ||
      track.title.toLowerCase().includes('vander') ||
      track.title.toLowerCase().includes('vender') ||
      track.album.toLowerCase().includes('vander') ||
      track.album.toLowerCase().includes('vender') ||
      track.album.toLowerCase().includes('vandereism')
    );
  }
  if (activeAlbum === 'playboicarti') return track.category === 'playboicarti' || track.artist.toLowerCase().includes('carti');
  if (activeAlbum === 'drake') return track.category === 'drake' || track.artist.toLowerCase().includes('drake');
  if (activeAlbum === 'brunomars') return track.category === 'brunomars' || track.artist.toLowerCase().includes('bruno mars');
  if (activeAlbum === 'akumanoko') return track.category === 'akumanoko' || track.artist.toLowerCase().includes('higuchi') || track.title.toLowerCase().includes('akuma no ko') || track.title.includes('悪魔の子');

  return track.album.toLowerCase() === activeAlbum.toLowerCase();
};

const getCategoryTitle = (album: AlbumFilterType): string => {
  switch (album) {
    case 'friend': return "Teman (Spotify Live)";
    case 'all': return "Semua Koleksi (All Music)";
    case 'radiohead': return "Radiohead (Discography)";
    case 'jkt48': return "JKT48 Official";
    case 'leserafim': return "LE SSERAFIM";
    case 'twice': return "TWICE";
    case 'aespa': return "aespa";
    case 'h2h': return "Hearts2Hearts (H2H)";
    case 'RUNW': return "RUNWAY Hits";
    case 'riskiinrahim': return "Riski Inrahim - Sdr Kematian";
    case 'vander': return "vander! / vender! (vandereism)";
    case 'playboicarti': return "Playboi Carti (Whole Lotta Red)";
    case 'drake': return "Drake (Scorpion & Views)";
    case 'brunomars': return "Bruno Mars (24K Magic)";
    case 'akumanoko': return "Ai Higuchi - 悪魔の子 (Akuma no Ko)";
    default: return album;
  }
};

interface TrackListSidebarProps {
  tracks: BackendRadioheadTrack[];
  activeTrackId: string;
  onSelectTrack: (track: BackendRadioheadTrack) => void;
  isPlaying: boolean;
  searchFilter: string;
  activeAlbum: AlbumFilterType;
  onSelectAlbum: (album: AlbumFilterType) => void;
  liveTracks?: BackendRadioheadTrack[];
  isLoadingLive?: boolean;
  friendPlayback?: FriendPlaybackState | null;
  friendLiveProgressMs?: number;
  isLoadingFriend?: boolean;
  isConnectingFriend?: boolean;
  isFriendSyncConnected?: boolean;
  discordUserId?: string;
  friendsLiveMap?: Record<string, FriendLiveInfo>;
  onSetDiscordUserId?: (id: string) => void;
  onConnectFriendSpotify?: () => void;
  onRefreshFriendSpotify?: () => void;
  onListenAlong?: (trackTitle: string, progressMs: number) => void;
  onToggleFriendSync?: () => void;
  onSwitchToMyMusic?: () => void;
}

export const TrackListSidebar: React.FC<TrackListSidebarProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  isPlaying,
  searchFilter,
  activeAlbum,
  liveTracks = [],
  isLoadingLive = false,
  friendPlayback = null,
  friendLiveProgressMs = 0,
  isLoadingFriend = false,
  isConnectingFriend = false,
  isFriendSyncConnected = true,
  discordUserId = '',
  friendsLiveMap = {},
  onSetDiscordUserId = () => {},
  onConnectFriendSpotify = () => {},
  onRefreshFriendSpotify = () => {},
  onListenAlong = () => {},
  onToggleFriendSync = () => {},
  onSwitchToMyMusic,
}) => {
  const isSearching = searchFilter.trim().length >= 2;
  const filteredTracks = tracks.filter((t) => {
    if (!isSearching) {
      return matchesAlbumFilter(t, activeAlbum);
    }
    const q = searchFilter.toLowerCase();
    const isVanderSearch = q.includes('vander') || q.includes('vender');
    return (
      t.title.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.mood.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (isVanderSearch && (t.category === 'vander' || t.artist.toLowerCase().includes('vander') || t.artist.toLowerCase().includes('vender')))
    );
  });

  return (
    <aside className="w-full h-full bg-[#111215] border-r border-[#282B32] flex flex-col overflow-hidden select-none">
      {/* Top Discord Server Title Header */}
      <div 
        className="h-12 px-4 flex items-center justify-between border-b border-[#282B32] bg-[#141619] hover:bg-[#1C1E22] transition-colors cursor-pointer shadow-sm"
        title={isSearching ? `Pencarian: "${searchFilter}"` : `Album / Kategori: ${getCategoryTitle(activeAlbum)}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-sm text-white tracking-tight truncate">
            {isSearching ? `Pencarian: "${searchFilter}"` : getCategoryTitle(activeAlbum)}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#A0A5AD]" />
      </div>

      {/* Channel Category Header */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#656A74] px-1">
          <span>{isSearching ? 'Hasil Pencarian' : 'Channels & Tracks'}</span>
          <span className="font-mono text-[10px] text-[#BFE7EA] font-semibold">
            {filteredTracks.length + liveTracks.length} ready
          </span>
        </div>
      </div>

      {/* Track List as Discord Channels */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
        {/* Local Library Section */}
        {isSearching && filteredTracks.length > 0 && (
          <div className="px-2 pt-1 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-[#949BA4] flex items-center gap-1">
            <span>Koleksi Lokal ({filteredTracks.length})</span>
          </div>
        )}

        {filteredTracks.map((track) => {
          const isActive = track.id === activeTrackId;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track)}
              title={`Judul: ${track.title} • Album: ${track.album}${track.year ? ` (${track.year})` : ''} • Artis: ${track.artist}`}
              className={`group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#1C1E22] text-white shadow-sm'
                  : 'hover:bg-[#18191D] text-[#A0A5AD] hover:text-[#F2F3F5]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex-shrink-0 flex items-center justify-center">
                  {isActive && isPlaying ? (
                    <Volume2 className="w-4 h-4 text-[#BFE7EA]" />
                  ) : (
                    <Hash
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#BFE7EA]' : 'text-[#656A74] group-hover:text-[#A0A5AD]'
                      }`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex flex-col justify-center">
                  <p
                    className={`text-xs font-bold truncate leading-tight ${
                      isActive ? 'text-[#BFE7EA]' : 'text-[#E0E2E5]'
                    }`}
                  >
                    {track.title}
                  </p>
                  <p className="text-[10px] text-[#656A74] truncate">
                    {track.artist} &bull; {track.album}
                  </p>
                </div>
              </div>

              {isActive && (
                <span className="w-2 h-2 rounded-full bg-[#BFE7EA] flex-shrink-0" />
              )}
            </div>
          );
        })}

        {/* Online Real-Time Discovery Section */}
        {isSearching && (
          <div className="pt-2">
            <div className="px-2 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-[#1DB954] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#1DB954]" />
                <span>Online Global (Real-time)</span>
              </span>
              {isLoadingLive && (
                <span className="flex items-center gap-1 text-[9px] text-[#949BA4] normal-case">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-[#1DB954]" />
                  <span>Mencari...</span>
                </span>
              )}
            </div>

            {liveTracks.map((track) => {
              const isActive = track.id === activeTrackId;

              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  title={`Judul: ${track.title} • Album: ${track.album} • Artis: ${track.artist}`}
                  className={`group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#1C1E22] text-white shadow-sm'
                      : 'hover:bg-[#18191D] text-[#A0A5AD] hover:text-[#F2F3F5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-[#141619] border border-[#282B32]">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1">
                        <p
                          className={`text-xs font-bold truncate leading-tight ${
                            isActive ? 'text-[#1DB954]' : 'text-[#E0E2E5]'
                          }`}
                        >
                          {track.title}
                        </p>
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex-shrink-0">
                          LIVE
                        </span>
                      </div>
                      <p className="text-[10px] text-[#656A74] truncate">
                        {track.artist} &bull; {track.album}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#1DB954] flex-shrink-0 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredTracks.length === 0 && liveTracks.length === 0 && !isLoadingLive && (
          <div className="p-6 text-center text-xs text-[#656A74]">
            {isSearching ? 'Tidak ada lagu yang ditemukan.' : 'No tracks found in this category'}
          </div>
        )}
      </div>

      {/* Real-time Friend Spotify Presence Card with Mode Switcher & Autonomous Option */}
      <FriendSpotifyCard
        playbackState={friendPlayback}
        liveProgressMs={friendLiveProgressMs}
        isLoading={isLoadingFriend}
        isConnecting={isConnectingFriend}
        isConnected={isFriendSyncConnected}
        discordUserId={discordUserId}
        friendsLiveMap={friendsLiveMap}
        onSetDiscordUserId={onSetDiscordUserId}
        onConnectSpotify={onConnectFriendSpotify}
        onRefresh={onRefreshFriendSpotify}
        onToggleConnect={onToggleFriendSync}
        onSwitchToMyMusic={onSwitchToMyMusic}
      />

      {/* Discord User Presence Footer */}
      <div className="h-14 px-3 bg-[#0B0C0E] border-t border-[#282B32] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-black text-xs shadow-md">
              RY
            </div>
            {/* Status dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#1DB954] border-2 border-[#0B0C0E]" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-xs font-bold text-white truncate leading-tight">
              Radiohead Fan
            </p>
            <p className="text-[10px] text-[#656A74] truncate">
              Listening to Kasatune
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#A0A5AD]">
          <button
            className="p-1.5 hover:text-white hover:bg-[#1C1E22] rounded transition-colors"
            title="Mute Audio"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 hover:text-white hover:bg-[#1C1E22] rounded transition-colors"
            title="Deafen Audio"
          >
            <Headphones className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
