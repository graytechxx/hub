import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Mail, ShieldCheck, X, Camera, Save, RefreshCw, Upload, Trash2 } from 'lucide-react';
import type { User as UserType } from '../../types/workspace';
import { updateActUserRealtime } from '../../services/actApi';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserType | null;
  onClose: () => void;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLogin,
  onLogout,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserType['role']>('Staff Teknis');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [tag, setTag] = useState('TEKNIS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setRole(currentUser.role);
      setAvatar(currentUser.avatar || '');
      setTag(currentUser.tag || 'TEKNIS');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Silakan pilih file gambar yang valid (.png, .jpg, .jpeg, .webp)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsSaving(true);
    setSaveSuccess(null);

    const updatedUser: UserType = {
      id: currentUser ? currentUser.id : String(Date.now()),
      name,
      email,
      role,
      avatar,
      tag,
    };

    onLogin(updatedUser);

    // Sync to ACT database
    await updateActUserRealtime({
      email,
      role,
      tag,
      name,
    });

    setIsSaving(false);
    setSaveSuccess('Pengaturan profil & foto berhasil diperbarui!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">
              {currentUser ? 'Pengaturan Profil & Foto Akun' : 'Login ke Lepkom Hub'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold">
              {saveSuccess}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Foto Profil / Avatar File Upload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload Foto Profil</span>
              </label>

              <div className="flex items-center gap-4 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 border-2 border-indigo-200 flex items-center justify-center text-white text-xl font-black overflow-hidden shadow-sm shrink-0 relative group">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    name ? name.charAt(0).toUpperCase() : 'A'
                  )}
                </div>

                <div className="space-y-2 grow">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Berkas Foto</span>
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Hapus Foto Profil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    Format diperbolehkan: PNG, JPG, JPEG, WEBP (Maksimal 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap Anda..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Asisten / Staff</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gunadarma.ac.id"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Kata Sandi (Password)</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">Default: lepkomnewnormal</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ketik password baru jika ingin mengubah..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Role & Tag Akses</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2 py-2 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="Staff Teknis">Staff Teknis</option>
                    <option value="Superadmin">Superadmin</option>
                    <option value="Asisten PJ">Asisten PJ</option>
                    <option value="Asisten">Asisten Jaga</option>
                  </select>

                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2 py-2 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600 font-bold text-indigo-700"
                  >
                    <option value="TEKNIS">TEKNIS</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="">Tanpa Tag</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-100">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Profil</span>
                  </>
                )}
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
