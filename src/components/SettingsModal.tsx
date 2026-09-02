import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSharingPlatforms } from '../context/SharingPlatformsContext';
import { useAuth } from '../context/AuthContext';
import { AppThemeMode, SharingPlatformEntity, Subscription } from '../types';
import { 
  generateAndroidBackupJson, 
  parseAndroidBackupPreview, 
  restoreAndroidBackupToFirestore 
} from '../services/subscriptionService';
import { 
  X, 
  Settings, 
  Sun, 
  Moon, 
  Laptop, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Edit2, 
  Check, 
  Layers, 
  CheckCircle2, 
  Copy,
  Download,
  Upload,
  FileJson,
  AlertCircle,
  Smartphone,
  Database
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  onImport: (importedSubs: Omit<Subscription, 'id' | 'userId'>[]) => Promise<number>;
}

const PRESET_COLORS = [
  '#6D28D9', // Purple
  '#DB2777', // Pink
  '#059669', // Emerald
  '#D97706', // Amber
  '#0284C7', // Sky
  '#C2410C', // Orange
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Green
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#64748B', // Slate
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  subscriptions,
  onImport
}) => {
  const { themeMode, setThemeMode } = useTheme();
  const { platforms, addPlatform, updatePlatform, deletePlatform, restoreDefaultPlatforms } = useSharingPlatforms();
  const { user } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'appearance' | 'platforms' | 'backup'>('appearance');

  // Add platform state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformColor, setNewPlatformColor] = useState('#1285FA');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit platform state
  const [editingPlatformId, setEditingPlatformId] = useState<string | number | null>(null);
  const [editPlatformName, setEditPlatformName] = useState('');
  const [editPlatformColor, setEditPlatformColor] = useState('#1285FA');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Backup / JSON state
  const [backupSubTab, setBackupSubTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    count?: number;
  }>({ type: 'idle' });

  // Status feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Platform handlers
  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;

    try {
      setIsSubmittingAdd(true);
      await addPlatform({
        name: newPlatformName.trim(),
        colorHex: newPlatformColor,
      });
      setNewPlatformName('');
      setShowAddForm(false);
      showFeedback('Plataforma personalizada añadida');
    } catch (err) {
      console.error('Error al añadir plataforma:', err);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleStartEdit = (platform: SharingPlatformEntity) => {
    setEditingPlatformId(platform.id);
    setEditPlatformName(platform.name);
    setEditPlatformColor(platform.colorHex || '#1285FA');
  };

  const handleSaveEdit = async () => {
    if (!editingPlatformId || !editPlatformName.trim()) return;

    try {
      setIsSubmittingEdit(true);
      await updatePlatform({
        id: editingPlatformId,
        name: editPlatformName.trim(),
        colorHex: editPlatformColor,
      });
      setEditingPlatformId(null);
      showFeedback('Plataforma actualizada');
    } catch (err) {
      console.error('Error al actualizar plataforma:', err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string | number, name: string) => {
    try {
      await deletePlatform(id);
      showFeedback(`"${name}" eliminada`);
    } catch (err) {
      console.error('Error al eliminar plataforma:', err);
    }
  };

  const handleRestore = async () => {
    if (window.confirm('¿Restaurar las 6 plataformas iniciales (Price together, sharingful, Spliiit, Gamsgo, Sharesub, Directo/Familia)?')) {
      await restoreDefaultPlatforms();
      showFeedback('Plataformas iniciales restauradas');
    }
  };

  // Backup / JSON handlers
  const jsonString = generateAndroidBackupJson(subscriptions);
  const preview = jsonInput.trim() ? parseAndroidBackupPreview(jsonInput) : null;

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_suscripciones_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('Archivo JSON descargado');
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      showFeedback('Copia JSON copiada al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonInput(content);
        setImportStatus({ type: 'idle' });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!jsonInput.trim()) return;

    setImportStatus({ type: 'loading', message: 'Validando e importando datos...' });

    try {
      if (user) {
        const result = await restoreAndroidBackupToFirestore(user.uid, jsonInput, replaceExisting);
        if (result.success) {
          const count = result.subscriptionsRestored;
          setImportStatus({
            type: 'success',
            message: `¡${count} suscripciones y ${result.membersRestored} miembros sincronizados con Firestore con éxito!`,
            count,
          });
          showFeedback(`¡${count} suscripciones restauradas!`);
        } else {
          setImportStatus({
            type: 'error',
            message: result.errorMessage || 'Error al procesar el archivo de copia de seguridad.',
          });
        }
      } else {
        const parsed = JSON.parse(jsonInput);
        const subsToImport = parsed.subscriptions || parsed;
        const count = await onImport(Array.isArray(subsToImport) ? subsToImport : []);
        setImportStatus({
          type: 'success',
          message: `¡${count} suscripciones importadas en modo local/invitado!`,
          count,
        });
        showFeedback(`¡${count} suscripciones restauradas!`);
      }
      setJsonInput('');
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Error al procesar el archivo JSON. Verifica el formato.',
      });
    }
  };

  const themeOptions: { mode: AppThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      mode: 'LIGHT',
      label: 'Claro',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      desc: 'Tema luminoso de alto contraste',
    },
    {
      mode: 'DARK',
      label: 'Oscuro',
      icon: <Moon className="w-5 h-5 text-blue-400" />,
      desc: 'Tema oscuro con tonos relajantes',
    },
    {
      mode: 'SYSTEM',
      label: 'Sistema',
      icon: <Laptop className="w-5 h-5 text-slate-400" />,
      desc: 'Se adapta a tu dispositivo',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        id="modal-settings"
        className="relative w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col my-8 transition-all"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground tracking-tight">
                Configuración
              </h2>
              <p className="text-xs text-muted-foreground">
                Apariencia, plataformas de compartición y copia de seguridad JSON
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-muted/20 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Apariencia (Tema)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('platforms')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'platforms'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Plataformas ({platforms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Copia de seguridad JSON</span>
          </button>
        </div>

        {/* Feedback notification */}
        {actionFeedback && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: APARIENCIA */}
          {activeTab === 'appearance' && (
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Tema y Modo de Visualización
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cambia entre modo claro y oscuro o sincroniza con tu sistema operativo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {themeOptions.map((option) => {
                  const isSelected = themeMode === option.mode;
                  return (
                    <button
                      key={option.mode}
                      id={`btn-theme-${option.mode.toLowerCase()}`}
                      type="button"
                      onClick={() => {
                        setThemeMode(option.mode);
                        showFeedback(`Tema cambiado a ${option.label}`);
                      }}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-muted/40 border-border hover:bg-muted hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className="p-2.5 rounded-xl bg-card border border-border shadow-xs">
                          {option.icon}
                        </div>
                        {isSelected && (
                          <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                        )}
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                        {option.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-1">
                        {option.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 2: PLATAFORMAS DE COMPARTICIÓN */}
          {activeTab === 'platforms' && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Plataformas de compartición
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Gestiona las plataformas disponibles para tus suscripciones y miembros ({platforms.length})
                  </p>
                </div>
              </div>

              {/* Platform List */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {platforms.map((platform) => {
                  const isEditing = editingPlatformId === platform.id;

                  if (isEditing) {
                    return (
                      <div
                        key={platform.id}
                        className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/50 flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editPlatformName}
                            onChange={(e) => setEditPlatformName(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-blue-500"
                            placeholder="Nombre de la plataforma"
                            autoFocus
                          />
                          <div className="relative">
                            <input
                              type="color"
                              value={editPlatformColor}
                              onChange={(e) => setEditPlatformColor(e.target.value)}
                              className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                              title="Elegir color personalizado"
                            />
                          </div>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSubmittingEdit || !editPlatformName.trim()}
                            type="button"
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
                            title="Guardar cambios"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPlatformId(null)}
                            type="button"
                            className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick preset colors during edit */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditPlatformColor(c)}
                              className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                editPlatformColor.toLowerCase() === c.toLowerCase()
                                  ? 'scale-125 ring-2 ring-blue-500 shadow'
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
                      className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm ring-2 ring-black/10 dark:ring-white/10"
                          style={{ backgroundColor: platform.colorHex || '#1285FA' }}
                        />
                        <span className="text-xs font-bold text-foreground truncate">
                          {platform.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(platform)}
                          type="button"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="Editar plataforma"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(platform.id, platform.name)}
                          type="button"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar plataforma"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Platform Form */}
              {showAddForm ? (
                <form
                  onSubmit={handleAddPlatform}
                  className="p-4 rounded-2xl bg-card border border-blue-500/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                      Nueva plataforma personalizada
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="input-settings-new-platform"
                      type="text"
                      value={newPlatformName}
                      onChange={(e) => setNewPlatformName(e.target.value)}
                      placeholder="Nombre (ej. Pulpo, Spliiit Pro, etc.)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground text-xs font-semibold focus:outline-none focus:border-blue-500"
                      autoFocus
                      required
                    />
                    <input
                      type="color"
                      value={newPlatformColor}
                      onChange={(e) => setNewPlatformColor(e.target.value)}
                      className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 p-0 shrink-0"
                      title="Elegir color personalizado"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingAdd || !newPlatformName.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewPlatformColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                          newPlatformColor.toLowerCase() === c.toLowerCase()
                            ? 'scale-125 ring-2 ring-blue-500 shadow'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </form>
              ) : null}

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {!showAddForm && (
                  <button
                    id="btn-add-custom-platform"
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir plataforma personalizada</span>
                  </button>
                )}

                <button
                  id="btn-restore-default-platforms"
                  type="button"
                  onClick={handleRestore}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-xs font-semibold transition-all cursor-pointer active:scale-98"
                  title="Restaurar: Price together, sharingful, Spliiit, Gamsgo, Sharesub, Directo/Familia"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Restaurar 6 iniciales</span>
                </button>
              </div>
            </section>
          )}

          {/* TAB 3: COPIA DE SEGURIDAD JSON */}
          {activeTab === 'backup' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-500" />
                    Copia de Seguridad JSON
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Exporta o importa tus datos en formato JSON 100% compatible
                  </p>
                </div>
              </div>

              {/* Sub tabs: Export vs Import */}
              <div className="flex p-1 bg-muted rounded-xl border border-border w-fit">
                <button
                  type="button"
                  onClick={() => setBackupSubTab('export')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    backupSubTab === 'export'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Exportar / Copiar JSON
                </button>
                <button
                  type="button"
                  onClick={() => setBackupSubTab('import')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    backupSubTab === 'import'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Importar / Restaurar JSON
                </button>
              </div>

              {/* Export Panel */}
              {backupSubTab === 'export' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {subscriptions.length} suscripciones listas para exportar
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Incluye miembros, cobros, plataformas y notas
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyJson}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadJson}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
                        title="Descargar archivo .json"
                      >
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Descargar</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      readOnly
                      value={jsonString}
                      rows={6}
                      className="w-full p-3 font-mono text-[11px] bg-muted/60 border border-border rounded-xl text-foreground focus:outline-none select-all"
                    />
                  </div>
                </div>
              )}

              {/* Import Panel */}
              {backupSubTab === 'import' && (
                <div className="space-y-4 pt-2">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Al importar un archivo o texto JSON, se añadirán las suscripciones y co-suscriptores a tu cuenta.
                    </span>
                  </div>

                  {/* File selector & textarea */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-2">
                      Pega el JSON o sube un archivo:
                    </label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => {
                        setJsonInput(e.target.value);
                        setImportStatus({ type: 'idle' });
                      }}
                      placeholder="Pega aquí el contenido JSON de tu copia de seguridad..."
                      rows={5}
                      className="w-full p-3 font-mono text-[11px] bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>Cargar archivo .json</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={(e) => setReplaceExisting(e.target.checked)}
                        className="rounded border-border text-blue-600 focus:ring-blue-500"
                      />
                      <span>Reemplazar datos existentes</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={!jsonInput.trim() || importStatus.type === 'loading'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{importStatus.type === 'loading' ? 'Importando...' : 'Restaurar ahora'}</span>
                    </button>
                  </div>

                  {/* Status alert */}
                  {importStatus.type === 'success' && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{importStatus.message}</span>
                    </div>
                  )}

                  {importStatus.type === 'error' && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{importStatus.message}</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-end">
          <button
            id="btn-close-settings-footer"
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
