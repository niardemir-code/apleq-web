import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Search, 
  Sparkles, 
  Palette,
  Loader2
} from 'lucide-react';
import { 
  AVAILABLE_ICON_COLORS, 
  AVAILABLE_ICONS, 
  PRESET_SERVICES, 
  PlatformIconBadge,
  ServicePreset,
  IconOption
} from '../utils/icons';
import { compressImageToMax512 } from '../utils/imageUtils';

interface IconSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: {
    iconType: 'PRESET' | 'CUSTOM_IMAGE';
    iconKey: string;
    iconColorHex: string;
    customImageUri: string;
    customImageBase64?: string;
  }) => void;
  currentIconType?: string;
  currentIconKey?: string;
  currentIconColorHex?: string;
  currentCustomImageUri?: string;
  currentCustomImageBase64?: string;
  platformName?: string;
  subscriptionId?: string;
}

export const IconSelectorModal: React.FC<IconSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIconType = 'PRESET',
  currentIconKey = 'Netflix',
  currentIconColorHex = '#1285FA',
  currentCustomImageUri = '',
  currentCustomImageBase64 = '',
  platformName = 'Suscripción',
  subscriptionId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'PRESET' | 'CUSTOM_IMAGE'>(
    currentIconType === 'CUSTOM_IMAGE' ? 'CUSTOM_IMAGE' : 'PRESET'
  );
  
  const [selectedKey, setSelectedKey] = useState<string>(currentIconKey || 'Netflix');
  const [selectedColor, setSelectedColor] = useState<string>(currentIconColorHex || '#1285FA');
  const [customImageUri, setCustomImageUri] = useState<string>(currentCustomImageUri || '');
  const [customImageBase64, setCustomImageBase64] = useState<string>(currentCustomImageBase64 || '');
  
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(currentIconType === 'CUSTOM_IMAGE' ? 'CUSTOM_IMAGE' : 'PRESET');
      setSelectedKey(currentIconKey || platformName || 'Netflix');
      setSelectedColor(currentIconColorHex || '#1285FA');
      setCustomImageUri(currentCustomImageUri || '');
      setCustomImageBase64(currentCustomImageBase64 || '');
      setUploadError(null);
      setSearchTerm('');
      setSelectedCategory('ALL');
    }
  }, [isOpen, currentIconType, currentIconKey, currentIconColorHex, currentCustomImageUri, currentCustomImageBase64, platformName]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ServicePreset) => {
    setSelectedKey(preset.key);
    setSelectedColor(preset.defaultColorHex);
    setCustomImageUri('');
    setCustomImageBase64('');
  };

  const handleSelectLucideIcon = (iconItem: IconOption) => {
    setSelectedKey(iconItem.key);
    setCustomImageUri('');
    setCustomImageBase64('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 15 MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Comprimir y quedarnos SOLO con la vista previa local (data URI).
      // La subida a Storage se hace al guardar la suscripción, no aquí.
      const compressed = await compressImageToMax512(file, 256, 0.7);
      setCustomImageUri(compressed.dataUri);
      setCustomImageBase64('');
      setActiveTab('CUSTOM_IMAGE');
    } catch (err: any) {
      console.warn('Image compression error:', err);
      setUploadError('No se pudo procesar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCustomImage = () => {
    setCustomImageUri('');
    setCustomImageBase64('');
    setActiveTab('PRESET');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (isUploading) return;

    const hasCustomImage = Boolean(customImageUri?.trim() || customImageBase64?.trim());
    if (hasCustomImage) {
      // In online/authenticated mode, customImageUri is the download URL from Firebase Storage.
      // If offline/unauthenticated, customImageUri contains the local dataUri.
      const finalUri = customImageUri?.trim() || customImageBase64?.trim() || '';
      onSelect({
        iconType: 'CUSTOM_IMAGE',
        iconKey: selectedKey || platformName || 'Custom',
        iconColorHex: selectedColor,
        customImageUri: finalUri,
        customImageBase64: '',
      });
    } else {
      onSelect({
        iconType: 'PRESET',
        iconKey: selectedKey || 'Netflix',
        iconColorHex: selectedColor,
        customImageUri: '',
        customImageBase64: '',
      });
    }
    onClose();
  };

  // Filter presets and icons
  const filteredPresets = PRESET_SERVICES.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const filteredIcons = AVAILABLE_ICONS.filter((i) => {
    const matchesSearch = i.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || i.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'Streaming', 'Música', 'Productividad', 'Gaming', 'Educación', 'Salud', 'General'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="modal-icon-selector"
        className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col my-4 max-h-[90vh] transition-all"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground tracking-tight">
                Logo e icono de suscripción
              </h2>
              <p className="text-xs text-muted-foreground">
                Personaliza la apariencia del servicio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <PlatformIconBadge
              platformName={platformName || 'Suscripción'}
              iconType={customImageUri || customImageBase64 ? 'CUSTOM_IMAGE' : 'PRESET'}
              iconKey={selectedKey}
              customImageUri={customImageUri}
              customImageBase64={customImageBase64}
              iconColorHex={selectedColor}
              sizeClass="w-14 h-14"
              iconSizeClass="w-7 h-7"
              roundedClass="rounded-2xl"
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-foreground truncate">
                {platformName || 'Vista previa'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                  {customImageUri || customImageBase64 ? (
                    <>
                      <ImageIcon className="w-3 h-3 text-blue-500" />
                      Imagen personalizada
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {selectedKey}
                    </>
                  )}
                </span>
                <span 
                  className="w-3 h-3 rounded-full border border-white/20 shadow-xs shrink-0"
                  style={{ backgroundColor: selectedColor }}
                  title={selectedColor}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted border border-border shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('PRESET')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PRESET'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CUSTOM_IMAGE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CUSTOM_IMAGE'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Galería / Imagen
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Common Color Selector (Always Visible) */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
              Color del icono / fondo
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {AVAILABLE_ICON_COLORS.map((c) => {
                const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.label}
                    className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center cursor-pointer border ${
                      isSelected 
                        ? 'scale-110 ring-2 ring-blue-500 ring-offset-2 ring-offset-card border-white' 
                        : 'hover:scale-105 border-white/10'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />}
                  </button>
                );
              })}
              
              {/* Custom Hex Picker */}
              <div className="flex items-center gap-2 ml-1 p-1 rounded-xl bg-muted/60 border border-border">
                <input
                  type="color"
                  value={selectedColor.startsWith('#') ? selectedColor : '#1285FA'}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  title="Seleccionar color personalizado"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#1285FA"
                  className="w-20 px-1.5 py-1 text-xs font-mono font-bold bg-transparent text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          {activeTab === 'PRESET' ? (
            <>
              {/* Search & Category Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar servicio o icono (Netflix, Spotify, TV, Música...)"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {cat === 'ALL' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets Grid */}
              <div className="space-y-4">
                {filteredPresets.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Servicios populares ({filteredPresets.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {filteredPresets.map((preset) => {
                        const isSelected = selectedKey.toLowerCase() === preset.key.toLowerCase();
                        return (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500 text-foreground'
                                : 'bg-card border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <PlatformIconBadge
                              platformName={preset.name}
                              iconType="PRESET"
                              iconKey={preset.key}
                              iconColorHex={preset.defaultColorHex}
                              sizeClass="w-8 h-8"
                              iconSizeClass="w-4 h-4"
                              roundedClass="rounded-xl"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold truncate text-foreground">
                                {preset.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {preset.category}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Generic Icons Grid */}
                {filteredIcons.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Iconos generales ({filteredIcons.length})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {filteredIcons.map((item) => {
                        const isSelected = selectedKey.toLowerCase() === item.key.toLowerCase();
                        const IconComp = item.icon;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleSelectLucideIcon(item)}
                            title={item.label}
                            className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500 text-blue-500'
                                : 'bg-card border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                            <span className="text-[10px] font-bold truncate max-w-full text-center">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredPresets.length === 0 && filteredIcons.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-xs">
                    No se encontraron servicios ni iconos para "{searchTerm}".
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Tab 2: Custom Image Upload */
            <div className="space-y-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  customImageUri || customImageBase64
                    ? 'border-border bg-muted/20 hover:bg-muted/30'
                    : 'border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-sm font-bold text-foreground">
                      Subiendo imagen a Firebase Storage...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Generando enlace seguro
                    </p>
                  </div>
                ) : customImageUri || customImageBase64 ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <PlatformIconBadge
                        platformName={platformName}
                        iconType="CUSTOM_IMAGE"
                        customImageUri={customImageUri}
                        customImageBase64={customImageBase64}
                        iconColorHex={selectedColor}
                        sizeClass="w-24 h-24"
                        iconSizeClass="w-10 h-10"
                        roundedClass="rounded-3xl"
                      />
                      <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">
                        Imagen cargada correctamente
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Haz clic aquí para seleccionar otra imagen de tu dispositivo
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">
                        Selecciona o arrastra una imagen aquí
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Soporta JPG, PNG y WebP. La imagen se almacenará en Firebase Storage y se sincronizará con tu app de Android.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Examinar galería / archivos
                    </button>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              {/* Actions for custom image */}
              {(customImageUri || customImageBase64) && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Restaurar icono predeterminado
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Elimina la imagen personalizada y vuelve al catálogo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCustomImage}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-3 bg-muted/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subiendo imagen...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Aplicar icono</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
