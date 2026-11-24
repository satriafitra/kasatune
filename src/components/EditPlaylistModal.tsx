/**
 * EditPlaylistModal Component
 * Interactive modal dialog allowing users to customize their playlist:
 * - Playlist Name (title)
 * - Playlist Profile / Cover Artwork (local file upload, direct URL, or preset covers)
 * - Playlist Description
 * - Live instant preview and persistence
 */

import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Sparkles, Check } from 'lucide-react';

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialDescription: string;
  initialCoverUrl: string;
  onSave: (data: { name: string; description: string; coverUrl: string }) => void;
}

const PRESET_COVERS = [
  {
    name: 'Sunset Vinyl',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Lo-Fi Chill',
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Retro Cassette',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Acoustic Guitar',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Obsidian Night',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  },
];

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  isOpen,
  onClose,
  initialName,
  initialDescription,
  initialCoverUrl,
  onSave,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle local file selection and convert to Base64 data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverUrl(reader.result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca file gambar.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama playlist tidak boleh kosong.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      coverUrl: coverUrl.trim() || initialCoverUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#18191D] border border-[#2B2D31] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282B32] bg-[#141619]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#BFE7EA]" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Edit Rincian Playlist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#949BA4] hover:text-white hover:bg-[#282B32] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {/* Cover & Main Fields Layout */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Left: Cover Preview & Upload Button */}
            <div className="flex flex-col items-center gap-2.5 flex-shrink-0 w-full sm:w-auto">
              <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-[#0E1013] border border-[#282B32] shadow-md group">
                <img
                  src={coverUrl}
                  alt="Playlist Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback image
                    (e.currentTarget as HTMLImageElement).src = initialCoverUrl;
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 font-semibold"
                >
                  <Upload className="w-5 h-5 text-[#BFE7EA]" />
                  <span>Ganti Foto</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-1.5 px-3 rounded-md bg-[#23252A] hover:bg-[#2B2D33] text-xs font-semibold text-[#BFE7EA] border border-[#282B32] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Mengunggah...' : 'Pilih Foto File'}</span>
              </button>
            </div>

            {/* Right: Name & Description Inputs */}
            <div className="flex-1 w-full space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#949BA4] mb-1.5">
                  Nama Playlist <span className="text-[#D46743]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Beri nama playlist Anda..."
                  className="w-full px-3 py-2 rounded-lg bg-[#111215] border border-[#282B32] focus:border-[#BFE7EA] text-sm text-white placeholder-[#656A74] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#949BA4] mb-1.5">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Tambahkan deskripsi singkat tentang playlist ini..."
                  className="w-full px-3 py-2 rounded-lg bg-[#111215] border border-[#282B32] focus:border-[#BFE7EA] text-xs text-white placeholder-[#656A74] focus:outline-none resize-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Direct URL Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#949BA4] mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Atau Masukkan URL Gambar Cover</span>
            </label>
            <input
              type="url"
              value={coverUrl.startsWith('data:') ? '' : coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-lg bg-[#111215] border border-[#282B32] focus:border-[#BFE7EA] text-xs text-white placeholder-[#656A74] focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#949BA4] mb-2">
              Pilihan Cover Estetik Bawaan
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_COVERS.map((preset) => {
                const isSelected = coverUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setCoverUrl(preset.url)}
                    className={`relative rounded-lg overflow-hidden border aspect-square group transition-all ${
                      isSelected
                        ? 'border-[#BFE7EA] ring-2 ring-[#BFE7EA]/40 scale-105'
                        : 'border-[#282B32] hover:border-[#949BA4]'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-[9px] text-white text-center font-bold">
                      {preset.name}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#BFE7EA] text-black flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#282B32]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-[#A0A5AD] hover:text-white hover:bg-[#23252A] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-black bg-[#1DB954] hover:bg-[#1ed760] active:scale-95 transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
