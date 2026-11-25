/**
 * QueuePanel Component
 * Clean dark matte Queue (Antrian) panel matching #0B0B0C / #121213 / #CE7F20 / #EEDFC7 / #607938 / #53341A:
 * - Current playing track summary
 * - User manual queue with play-now, reorder up/down, remove, and clear controls
 * - Upcoming tracks preview (reflecting Shuffle order or sequential list) with subtle cache-ready indicator
 */

import React from 'react';
import { ListMusic, Trash2, X, ChevronUp, ChevronDown, Play } from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';

interface QueuePanelProps {
  activeTrack: BackendRadioheadTrack;
  isPlaying: boolean;
  manualQueue: BackendRadioheadTrack[];
  upcomingTracks: BackendRadioheadTrack[];
  isShuffle: boolean;
  isTrackCached?: (track: BackendRadioheadTrack) => boolean;
  onPlayQueuedTrack: (index: number) => void;
  onRemoveQueuedTrack: (index: number) => void;
  onMoveQueuedTrack: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
  onSelectUpcomingTrack: (track: BackendRadioheadTrack) => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({
  activeTrack,
  manualQueue,
  upcomingTracks,
  isShuffle,
  isTrackCached,
  onPlayQueuedTrack,
  onRemoveQueuedTrack,
  onMoveQueuedTrack,
  onClearQueue,
  onSelectUpcomingTrack,
}) => {
  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:45';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="w-full h-full bg-[#121213] rounded-xl border border-white/[0.07] flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="h-11 px-4 sm:px-5 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0 bg-[#101011]">
        <div className="flex items-center gap-2 min-w-0">
          <ListMusic className="w-3.5 h-3.5 text-[#CE7F20] flex-shrink-0" />
          <span className="font-semibold text-xs uppercase tracking-wider text-[#CE7F20]">
            Antrian
          </span>
          {manualQueue.length > 0 && (
            <span className="text-[11px] font-mono text-[#9A9288]">
              &bull; {manualQueue.length}
            </span>
          )}
        </div>

        {manualQueue.length > 0 && (
          <button
            type="button"
            onClick={onClearQueue}
            className="px-2 py-1 rounded text-[11px] font-medium text-[#9A9288] border border-white/[0.08] flex items-center gap-1"
            title="Kosongkan antrian"
          >
            <Trash2 className="w-3 h-3" />
            <span>Bersihkan</span>
          </button>
        )}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-5 custom-scrollbar">
        {/* 1. Sedang Diputar */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#68625B] px-1">
            Sedang Diputar
          </p>
          <div className="p-2 rounded-lg bg-[#53341A]/35 border border-[#CE7F20]/35 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded overflow-hidden bg-[#0B0B0C] border border-white/[0.08] flex-shrink-0">
              <img
                src={activeTrack.coverUrl}
                alt={activeTrack.title}
                className="w-full h-full object-cover block"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#CE7F20] truncate leading-tight">
                {activeTrack.title}
              </p>
              <p className="text-[11px] text-[#9A9288] truncate mt-0.5">
                {activeTrack.artist}
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#9A9288] flex-shrink-0">
              {formatDuration(activeTrack.durationMs)}
            </span>
          </div>
        </div>

        {/* 2. Manual User Queue */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#68625B]">
              Berikutnya di Antrian ({manualQueue.length})
            </p>
          </div>

          {manualQueue.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#171719] border border-white/[0.06] text-center">
              <p className="text-xs text-[#9A9288]">Antrian masih kosong.</p>
              <p className="text-[11px] text-[#68625B] mt-1">
                Tekan ikon tambah antrian pada lagu mana saja untuk memasukkannya ke sini.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {manualQueue.map((item, idx) => {
                const cached = isTrackCached ? isTrackCached(item) : false;
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => onPlayQueuedTrack(idx)}
                    className="p-2 rounded-lg bg-[#171719] border border-white/[0.06] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded overflow-hidden bg-[#0B0B0C] flex-shrink-0 relative">
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          className="w-full h-full object-cover block"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-medium text-[#EEDFC7] truncate leading-tight">
                            {item.title}
                          </p>
                          {cached && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#607938] flex-shrink-0"
                              title="Audio tersimpan di cache (siap putar cepat)"
                            />
                          )}
                        </div>
                        <p className="text-[11px] text-[#9A9288] truncate mt-0.5">
                          {item.artist}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-0.5 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveQueuedTrack(idx, idx - 1)}
                        className={`p-1 rounded ${idx === 0 ? 'text-[#3A3734]' : 'text-[#9A9288]'}`}
                        title="Naikkan urutan"
                        aria-label="Naikkan"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === manualQueue.length - 1}
                        onClick={() => onMoveQueuedTrack(idx, idx + 1)}
                        className={`p-1 rounded ${idx === manualQueue.length - 1 ? 'text-[#3A3734]' : 'text-[#9A9288]'}`}
                        title="Turunkan urutan"
                        aria-label="Turunkan"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveQueuedTrack(idx)}
                        className="p-1 rounded text-[#9A9288]"
                        title="Hapus dari antrian"
                        aria-label="Hapus"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Auto Up Next (from active list or deterministic shuffle order) */}
        {upcomingTracks.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#68625B]">
                {isShuffle ? 'Urutan Acak Berikutnya' : 'Putar Selanjutnya'}
              </p>
              <span className="text-[10px] text-[#607938]">
                Cache aktif
              </span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {upcomingTracks.slice(0, 15).map((item, idx) => {
                const cached = isTrackCached ? isTrackCached(item) : false;
                return (
                  <div
                    key={`${item.id}-up-${idx}`}
                    onClick={() => onSelectUpcomingTrack(item)}
                    className="py-2 px-1.5 rounded-lg flex items-center justify-between gap-2.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-[11px] font-mono text-[#68625B] w-4 text-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded overflow-hidden bg-[#19191B] flex-shrink-0">
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          className="w-full h-full object-cover block"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-medium text-[#EEDFC7] truncate leading-tight">
                            {item.title}
                          </p>
                          {cached && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#607938] flex-shrink-0"
                              title="Tersimpan di cache (putar instan)"
                            />
                          )}
                        </div>
                        <p className="text-[11px] text-[#9A9288] truncate mt-0.5">
                          {item.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Play className="w-3 h-3 text-[#68625B]" />
                      <span className="text-[11px] font-mono text-[#68625B]">
                        {formatDuration(item.durationMs)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
