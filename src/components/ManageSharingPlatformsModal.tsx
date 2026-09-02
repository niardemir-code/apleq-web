import React, { useState } from 'react';
import { useSharingPlatforms } from '../context/SharingPlatformsContext';
import { SharingPlatformEntity } from '../types';
import { X, Plus, Trash2, Edit2, Check, RotateCcw, Palette } from 'lucide-react';

interface ManageSharingPlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#F97316', // Orange
  '#64748B', // Slate
];

export const ManageSharingPlatformsModal: React.FC<ManageSharingPlatformsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { platforms, addPlatform, updatePlatform, deletePlatform, restoreDefaultPlatforms } =
    useSharingPlatforms();

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#1285FA');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#1285FA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setIsSubmitting(true);
      await addPlatform({
        name: newName.trim(),
        colorHex: newColor,
      });
      setNewName('');
      setNewColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    } catch (err) {
      console.error('Error adding platform:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (platform: SharingPlatformEntity) => {
    setEditingId(platform.id);
    setEditName(platform.name);
    setEditColor(platform.colorHex || '#1285FA');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      setIsSubmitting(true);
      await updatePlatform({
        id: editingId,
        name: editName.trim(),
        colorHex: editColor,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Error updating platform:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deletePlatform(id);
    } catch (err) {
      console.error('Error deleting platform:', err);
    }
  };

  const handleRestore = async () => {
    if (window.confirm('¿Restaurar las plataformas de compartición a los valores predeterminados?')) {
      await restoreDefaultPlatforms();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        id="modal-manage-sharing-platforms"
        className="relative w-full max-w-lg rounded-3xl bg-[#0f0f0f] border border-slate-800 shadow-2xl shadow-black/90 overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Plataformas de compartición
              </h2>
              <p className="text-xs text-slate-400">
                Añade o personaliza el nombre y color de tus plataformas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-500 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Add Form */}
          <form
            onSubmit={handleAddPlatform}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3"
          >
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Añadir nueva plataforma
            </span>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-new-platform-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre (ej. Sharesub, Pulpo, GoSplit...)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              {/* Color picker input + preset dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  title="Elegir color personalizado"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>

            {/* Quick Palette Circles */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    newColor.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f]'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </form>

          {/* List of existing platforms */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Plataformas disponibles ({platforms.length})
            </span>

            {platforms.map((platform) => {
              const isEditing = editingId === platform.id;

              if (isEditing) {
                return (
                  <div
                    key={platform.id}
                    className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/50 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                      <button
                        onClick={handleSaveEdit}
                        type="button"
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        title="Guardar cambios"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        type="button"
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            editColor.toLowerCase() === c.toLowerCase()
                              ? 'scale-125 ring-2 ring-white'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={platform.id}
                  className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/10"
                      style={{ backgroundColor: platform.colorHex || '#1285FA' }}
                    />
                    <span className="text-xs font-bold text-white truncate">
                      {platform.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(platform)}
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Editar plataforma"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(platform.id)}
                      type="button"
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar plataforma"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <button
            onClick={handleRestore}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar por defecto</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Hecho
          </button>
        </div>
      </div>
    </div>
  );
};
