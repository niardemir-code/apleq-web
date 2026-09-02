import React, { useState, useEffect, useRef } from 'react';
import { 
  Subscription, 
  Category, 
  BillingPeriod, 
  AlarmUnit,
  PlatformPriceItem,
  SUBSCRIPTION_CATEGORIES, 
  SUBSCRIPTION_CURRENCIES, 
  CURRENCY_DETAILED_OPTIONS,
  getCurrencySymbol,
  getCurrencyFlag,
  formatPeriodShort,
  normalizeBillingPeriod,
  MONTHS_OF_YEAR,
  parsePlatformPricing,
  serializePlatformPricing,
  resolveMemberNextPaymentDate,
  resolveSubscriptionNextRenewalDate
} from '../types';
import { useSharingPlatforms } from '../context/SharingPlatformsContext';
import { ManageSharingPlatformsModal } from './ManageSharingPlatformsModal';
import { IconSelectorModal } from './IconSelectorModal';
import { CurrencyFlag } from './CurrencyFlag';
import { CurrencySelect } from './CurrencySelect';
import { PlatformIconBadge, PRESET_SERVICES } from '../utils/icons';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  X, 
  Plus, 
  Pencil,
  Trash2, 
  ChevronDown, 
  Check,
  User, 
  FileText,
  Settings2,
  Info,
  Layers,
  Palette,
  Image as ImageIcon,
  Bell,
  Clock,
  Calendar,
  Save
} from 'lucide-react';

function formatDisplayDate(dateStr?: string | number): string {
  if (!dateStr) return '';
  try {
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const [y, m, d] = parts;
      const shortYear = String(y).slice(-2);
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${shortYear}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const shortYear = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${shortYear}`;
  } catch {
    return '';
  }
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: Partial<Subscription>) => void;
  onDelete?: (subscriptionId: string) => void;
  subscriptionToEdit?: Subscription | null;
  initialData?: Subscription | null;
}

interface PlatformModalState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  index?: number;
  platformName: string;
  pricePerUser: number | '';
  currency: string;
  period: BillingPeriod;
  defaultPaymentMethod: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  subscriptionToEdit,
  initialData,
}) => {
  const { user } = useAuth();
  const activeSubToEdit = subscriptionToEdit ?? initialData ?? null;
  const { platforms } = useSharingPlatforms();
  const [showManagePlatforms, setShowManagePlatforms] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Modal state for adding or editing a sharing platform
  const [platformModalState, setPlatformModalState] = useState<PlatformModalState | null>(null);
  const [isPlatformSelectOpen, setIsPlatformSelectOpen] = useState(false);
  const platformSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        platformSelectRef.current &&
        !platformSelectRef.current.contains(event.target as Node)
      ) {
        setIsPlatformSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form states aligned with Android schema
  const [newSubId, setNewSubId] = useState<string>('');
  const [platformName, setPlatformName] = useState('');
  const [category, setCategory] = useState<string>('Streaming');
  const [mainUserName, setMainUserName] = useState('');
  const [cost, setCost] = useState<number | ''>(9.99);
  const [currency, setCurrency] = useState<string>('EUR');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const [billingDay, setBillingDay] = useState<number>(1);
  const [freeSlots, setFreeSlots] = useState<number>(0);
  const [billingMonth, setBillingMonth] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Renewal date & Alarm configuration (100% Android & Firebase synchronized)
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [enableAlarm, setEnableAlarm] = useState<boolean>(false);
  const [alarmValue, setAlarmValue] = useState<number>(3);
  const [alarmUnit, setAlarmUnit] = useState<AlarmUnit>('days');
  const renewalDateInputRef = useRef<HTMLInputElement>(null);

  // Configured sharing platforms and prices list
  const [configuredPlatforms, setConfiguredPlatforms] = useState<PlatformPriceItem[]>([]);

  // Icon & Customization states
  const [iconType, setIconType] = useState<'PRESET' | 'CUSTOM_IMAGE'>('PRESET');
  const [iconKey, setIconKey] = useState<string>('Netflix');
  const [iconColorHex, setIconColorHex] = useState<string>('#1285FA');
  const [customImageUri, setCustomImageUri] = useState<string>('');
  const [customImageBase64, setCustomImageBase64] = useState<string>('');
  const [showIconSelector, setShowIconSelector] = useState<boolean>(false);
  const [hasManuallyPickedIcon, setHasManuallyPickedIcon] = useState<boolean>(false);

  // Sync state on open/edit
  useEffect(() => {
    if (activeSubToEdit) {
      setNewSubId('');
      setPlatformName(activeSubToEdit.platformName || activeSubToEdit.name || '');
      setCategory(activeSubToEdit.category || 'Streaming');
      setMainUserName(activeSubToEdit.mainUserName || '');
      setCost(typeof activeSubToEdit.cost === 'number' ? activeSubToEdit.cost : 9.99);
      setCurrency(activeSubToEdit.currency || 'EUR');
      
      const rawSubPeriod = activeSubToEdit.billingPeriod || 
        (activeSubToEdit as any).billing_period || 
        activeSubToEdit.billingCycle || 
        (activeSubToEdit as any).billing_cycle || 
        (activeSubToEdit as any).cycle;
      const period = normalizeBillingPeriod(rawSubPeriod);
      setBillingPeriod(period);
      
      const bDay = activeSubToEdit.billingDay || 1;
      const bMonth = activeSubToEdit.billingMonth || 1;
      setBillingDay(bDay);
      setFreeSlots(activeSubToEdit.freeSlots ?? 0);
      setBillingMonth(bMonth);
      setNotes(activeSubToEdit.notes || '');

      const initialRenewal = activeSubToEdit.renewalDate || resolveSubscriptionNextRenewalDate({
        billingPeriod: period,
        billingDay: bDay,
        billingMonth: bMonth,
      });
      setRenewalDate(initialRenewal);

      setEnableAlarm(Boolean(activeSubToEdit.enableAlarm));
      setAlarmValue(typeof activeSubToEdit.alarmValue === 'number' ? activeSubToEdit.alarmValue : 3);
      setAlarmUnit(activeSubToEdit.alarmUnit || 'days');

      const parsedPlatforms = parsePlatformPricing(activeSubToEdit.platformPricing);
      setConfiguredPlatforms(parsedPlatforms);

      // Set icon customization from subscription
      const subIconType = activeSubToEdit.iconType === 'CUSTOM_IMAGE' ? 'CUSTOM_IMAGE' : 'PRESET';
      setIconType(subIconType);
      setIconKey(activeSubToEdit.iconKey || activeSubToEdit.platformName || 'Netflix');
      setIconColorHex(activeSubToEdit.iconColorHex || activeSubToEdit.color || '#1285FA');
      setCustomImageUri(activeSubToEdit.customImageUri || '');
      setCustomImageBase64(activeSubToEdit.customImageBase64 || '');
      setHasManuallyPickedIcon(true);
    } else {
      // Generate a stable unique ID for this new subscription session
      const generatedNewId = String(Date.now() * 1000 + Math.floor(Math.random() * 1000));
      setNewSubId(generatedNewId);

      // Default reset
      setPlatformName('');
      setCategory('Streaming');
      setMainUserName('');
      setCost(9.99);
      setCurrency('EUR');
      setBillingPeriod('MONTHLY');
      setBillingDay(1);
      setFreeSlots(0);
      setBillingMonth(1);
      setNotes('');

      const defaultRenewal = resolveSubscriptionNextRenewalDate({
        billingPeriod: 'MONTHLY',
        billingDay: 1,
        billingMonth: 1,
      });
      setRenewalDate(defaultRenewal);
      setEnableAlarm(false);
      setAlarmValue(3);
      setAlarmUnit('days');

      setConfiguredPlatforms([]);
      
      // Default icons reset
      setIconType('PRESET');
      setIconKey('Netflix');
      setIconColorHex('#1285FA');
      setCustomImageUri('');
      setCustomImageBase64('');
      setHasManuallyPickedIcon(false);
    }
    setConfirmDelete(false);
  }, [activeSubToEdit, isOpen]);

  // Smart suggestion when typing service name (only if user hasn't manually picked an icon)
  const handlePlatformNameChange = (newName: string) => {
    setPlatformName(newName);
    if (!hasManuallyPickedIcon && iconType === 'PRESET') {
      const match = PRESET_SERVICES.find(
        (p) => p.name.toLowerCase() === newName.trim().toLowerCase() || 
               p.key.toLowerCase() === newName.trim().toLowerCase()
      );
      if (match) {
        setIconKey(match.key);
        setIconColorHex(match.defaultColorHex);
        if (match.category && !activeSubToEdit) {
          setCategory(match.category);
        }
      } else if (newName.trim()) {
        setIconKey(newName.trim());
      }
    }
  };

  if (!isOpen) return null;

  const handleOpenAddPlatform = () => {
    const available = platforms.find(
      (p) => !configuredPlatforms.some((cp) => cp.platformName.toLowerCase() === p.name.toLowerCase())
    );
    const defaultPrice = typeof cost === 'number' && cost > 0 ? Number((cost / 4).toFixed(2)) : 1.62;
    setPlatformModalState({
      isOpen: true,
      mode: 'add',
      platformName: available ? available.name : (platforms[0]?.name || 'Sharesub'),
      pricePerUser: defaultPrice,
      currency: currency || 'EUR',
      period: billingPeriod || 'MONTHLY',
      defaultPaymentMethod: '',
    });
  };

  const handleOpenEditPlatform = (index: number) => {
    const item = configuredPlatforms[index];
    if (!item) return;
    setPlatformModalState({
      isOpen: true,
      mode: 'edit',
      index,
      platformName: item.platformName,
      pricePerUser: item.pricePerUser,
      currency: item.currency || 'EUR',
      period: (item.period as BillingPeriod) || billingPeriod || 'MONTHLY',
      defaultPaymentMethod: item.defaultPaymentMethod || '',
    });
  };

  const handleSavePlatformFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformModalState) return;
    const platName = platformModalState.platformName.trim();
    if (!platName) return;

    const finalPrice = typeof platformModalState.pricePerUser === 'number' 
      ? Math.max(0, platformModalState.pricePerUser) 
      : 0;
    const finalCurrency = platformModalState.currency || 'EUR';
    const finalPeriod = platformModalState.period || 'MONTHLY';
    const finalMethod = (platformModalState.defaultPaymentMethod || '').replace(/[:|]/g, '').trim();

    if (platformModalState.mode === 'edit' && platformModalState.index !== undefined) {
      const editIdx = platformModalState.index;
      setConfiguredPlatforms((prev) =>
        prev.map((item, i) =>
          i === editIdx
            ? {
                platformName: platName,
                pricePerUser: finalPrice,
                currency: finalCurrency,
                period: finalPeriod,
                defaultPaymentMethod: finalMethod,
              }
            : item
        )
      );
    } else {
      // Mode is add
      setConfiguredPlatforms((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.platformName.toLowerCase() === platName.toLowerCase()
        );
        if (existingIndex >= 0) {
          return prev.map((item, i) =>
            i === existingIndex
              ? {
                  platformName: platName,
                  pricePerUser: finalPrice,
                  currency: finalCurrency,
                  period: finalPeriod,
                  defaultPaymentMethod: finalMethod,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            platformName: platName,
            pricePerUser: finalPrice,
            currency: finalCurrency,
            period: finalPeriod,
            defaultPaymentMethod: finalMethod,
          },
        ];
      });
    }

    setPlatformModalState(null);
  };

  const handleRemovePlatformFromSub = (index: number) => {
    setConfiguredPlatforms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformName.trim()) return;

    // If CUSTOM_IMAGE is chosen but uri is missing, do not submit without image URL
    if (iconType === 'CUSTOM_IMAGE' && !customImageUri && !customImageBase64) {
      setShowIconSelector(true);
      return;
    }

    // ID final de la suscripción (nuevo o en edición)
    const finalSubId = activeSubToEdit?.id || newSubId;

    // Subir la imagen personalizada a Storage SOLO al guardar (evita huérfanos).
    let finalCustomImageUri = iconType === 'CUSTOM_IMAGE' ? (customImageUri || '') : '';
    if (iconType === 'CUSTOM_IMAGE' && finalCustomImageUri.startsWith('data:') && user?.uid && finalSubId) {
      try {
        const resp = await fetch(finalCustomImageUri);
        const blob = await resp.blob();
        const sRef = storageRef(storage, `users/${user.uid}/subscriptions/${finalSubId}/custom_logo.jpg`);
        await uploadBytes(sRef, blob, { contentType: 'image/jpeg' });
        finalCustomImageUri = await getDownloadURL(sRef);
      } catch (err) {
        console.warn('No se pudo subir el logo al guardar; se mantiene la vista previa local:', err);
        // finalCustomImageUri se queda como data: URI (respaldo offline)
      }
    }

    const serializedPricing = serializePlatformPricing(configuredPlatforms);

    // Synchronize existing members' contributionAmount with updated platform prices and ensure nextPaymentDate is populated
    const bDay = Number(billingDay) || 1;
    const existingMembers = activeSubToEdit?.members || [];
    const updatedMembers = existingMembers.map((m) => {
      const pName = (m.sharingPlatform || m.platform || '').trim();
      const matched = configuredPlatforms.find(
        (cp) => cp.platformName.trim().toLowerCase() === pName.toLowerCase()
      );
      const computedNextPayment = resolveMemberNextPaymentDate(m, bDay);
      if (matched && typeof matched.pricePerUser === 'number' && matched.pricePerUser > 0) {
        return {
          ...m,
          contributionAmount: matched.pricePerUser,
          amount: matched.pricePerUser,
          nextPaymentDate: computedNextPayment,
        };
      }
      return {
        ...m,
        nextPaymentDate: computedNextPayment,
      };
    });

    const calcDaysBefore = alarmUnit === 'same_day' 
      ? 0 
      : alarmUnit === 'weeks' 
      ? (alarmValue || 1) * 7 
      : alarmUnit === 'months' 
      ? (alarmValue || 1) * 30 
      : (alarmValue || 1);

    const fallbackRenewal = resolveSubscriptionNextRenewalDate({
      billingPeriod,
      billingDay: Number(billingDay) || 1,
      billingMonth: Number(billingMonth) || 1,
    });

    const payload: Partial<Subscription> = {
      name: platformName.trim(),
      platformName: platformName.trim(),
      category: (category as Category) || 'OTHER',
      mainUserName: mainUserName.trim(),
      cost: typeof cost === 'number' ? cost : 0,
      currency: currency,
      billingPeriod: billingPeriod,
      billingCycle: billingPeriod === 'YEARLY' ? 'yearly' : 'monthly',
      billingDay: Number(billingDay) || 1,
      freeSlots: Number(freeSlots) || 0,
      billingMonth: billingPeriod === 'MONTHLY' ? 1 : Number(billingMonth) || 1,
      renewalDate: renewalDate || fallbackRenewal,
      enableAlarm: Boolean(enableAlarm),
      alarmValue: alarmUnit === 'same_day' ? 0 : (alarmValue || 1),
      alarmUnit: alarmUnit,
      alarmDaysBefore: enableAlarm ? calcDaysBefore : undefined,
      platformPricing: serializedPricing,
      members: updatedMembers,
      notes: notes.trim(),
      iconColorHex: iconColorHex || '#1285FA',
      color: iconColorHex || '#1285FA',
      iconType: iconType || 'PRESET',
      iconKey: iconKey || platformName.trim() || 'Netflix',
      customImageUri: finalCustomImageUri,
      customImageBase64: '',
    };

    if (activeSubToEdit?.id) {
      payload.id = activeSubToEdit.id;
    } else if (newSubId) {
      payload.id = newSubId;
    }

    onSave(payload);
    onClose();
  };

  const isNonMonthly = normalizeBillingPeriod(billingPeriod) !== 'MONTHLY';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div
          id="modal-subscription-form"
          className="relative w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh] transition-all"
        >
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setShowIconSelector(true)}
                className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl shrink-0"
                title="Haz clic para personalizar el icono o subir una imagen"
              >
                <PlatformIconBadge
                  platformName={platformName || 'Suscripción'}
                  iconType={iconType}
                  iconKey={iconKey}
                  customImageUri={customImageUri}
                  customImageBase64={customImageBase64}
                  iconColorHex={iconColorHex}
                  sizeClass="w-12 h-12"
                  iconSizeClass="w-6 h-6"
                  roundedClass="rounded-2xl"
                />
                <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                  <Pencil className="w-4 h-4" />
                </div>
              </button>

              <div>
                <h2 className="text-base font-extrabold text-foreground tracking-tight">
                  {activeSubToEdit ? 'Editar suscripción' : 'Nueva suscripción'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowIconSelector(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400 cursor-pointer mt-0.5"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Personalizar logo o imagen</span>
                </button>
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

          {/* Form Body with Fixed Bottom Action Bar */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable inputs area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Nombre del servicio / suscripción (Requerido) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre del servicio / suscripción <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconSelector(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:underline cursor-pointer"
                >
                  <Palette className="w-3 h-3" />
                  <span>Cambiar icono / logo</span>
                </button>
              </div>
              <input
                id="input-subscription-name"
                type="text"
                value={platformName}
                onChange={(e) => handlePlatformNameChange(e.target.value)}
                placeholder="Ej. Netflix, Spotify, Crunchyroll, Nintendo Switch..."
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* 2. Categoría */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Categoría
              </label>
              <div className="relative">
                <select
                  id="select-subscription-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-2xl bg-muted/50 border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {SUBSCRIPTION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-card text-foreground">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* 3. Titular / Usuario principal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Titular / Usuario principal
              </label>
              <div className="relative">
                <input
                  id="input-subscription-main-user"
                  type="text"
                  value={mainUserName}
                  onChange={(e) => setMainUserName(e.target.value)}
                  placeholder="Tu nombre o el de la persona a cargo de la cuenta"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* 4. Coste y Moneda */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Precio ({currency || 'EUR'} / {
                    billingPeriod === 'MONTHLY' ? 'mensual' :
                    billingPeriod === 'QUARTERLY' ? 'trimestral' :
                    billingPeriod === 'SEMI_ANNUAL' ? 'semestral' : 'anual'
                  }) <span className="text-rose-500">*</span>
                </label>
                <div>
                  <input
                    id="input-subscription-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="9.99"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground text-sm font-extrabold focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Moneda
                </label>
                <CurrencySelect
                  id="select-subscription-currency"
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                />
              </div>
            </div>

            {/* Huecos libres (plazas para otros) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Huecos libres (plazas para otros)</label>
              <input
                type="number"
                min={0}
                value={freeSlots}
                onChange={(e) => setFreeSlots(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-[#202234] text-slate-100 px-4 py-3 rounded-2xl border border-border/80 text-sm font-medium focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">El gestor ocupa 1 plaza. La capacidad total será 1 + huecos.</p>
            </div>

            {/* 5. Periodo de facturación, Fecha de renovación y Sistema de alarmas */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Frecuencia / Periodo de cobro
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY'] as const).map((p) => {
                    const isSelected = normalizeBillingPeriod(billingPeriod) === p;
                    const labels: Record<'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'YEARLY', string> = {
                      MONTHLY: 'Mensual',
                      QUARTERLY: 'Trimestral',
                      SEMI_ANNUAL: 'Semestral',
                      YEARLY: 'Anual',
                    };

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setBillingPeriod(p);
                          const nextDate = resolveSubscriptionNextRenewalDate({
                            billingPeriod: p,
                            billingDay,
                            billingMonth,
                          });
                          setRenewalDate(nextDate);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:bg-muted'
                        }`}
                      >
                        {labels[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Día del mes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Día de cobro (1 al 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={billingDay}
                    onChange={(e) => {
                      const newDay = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                      setBillingDay(newDay);
                      const nextDate = resolveSubscriptionNextRenewalDate({
                        billingPeriod,
                        billingDay: newDay,
                        billingMonth,
                      });
                      setRenewalDate(nextDate);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Mes del año (si no es mensual) */}
                {isNonMonthly && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Mes de cobro
                    </label>
                    <div className="relative">
                      <select
                        value={billingMonth}
                        onChange={(e) => {
                          const newMonth = parseInt(e.target.value) || 1;
                          setBillingMonth(newMonth);
                          const nextDate = resolveSubscriptionNextRenewalDate({
                            billingPeriod,
                            billingDay,
                            billingMonth: newMonth,
                          });
                          setRenewalDate(nextDate);
                        }}
                        className="w-full appearance-none px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {MONTHS_OF_YEAR.map((m) => (
                          <option key={m.value} value={m.value} className="bg-card text-foreground">
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* Fecha de renovación / próximo cobro */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fecha próximo cobro / renovación
                  </label>
                  {renewalDate && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[11px] font-mono font-bold tracking-tight">
                      {formatDisplayDate(renewalDate)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={renewalDateInputRef}
                      type="date"
                      value={renewalDate ? renewalDate.split('T')[0] : ''}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (renewalDateInputRef.current) {
                        if ('showPicker' in HTMLInputElement.prototype) {
                          try {
                            renewalDateInputRef.current.showPicker();
                          } catch {
                            renewalDateInputRef.current.focus();
                          }
                        } else {
                          renewalDateInputRef.current.focus();
                        }
                      }
                    }}
                    className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-blue-400 hover:border-blue-500/50 transition-colors shrink-0 cursor-pointer"
                    title="Abrir calendario"
                  >
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Se calcula automáticamente en base a la frecuencia y día de cobro.</span>
                </p>
              </div>

              {/* Configuración de alarma / recordatorio de renovación para la suscripción */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div 
                  onClick={() => setEnableAlarm(!enableAlarm)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    enableAlarm 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' 
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg ${enableAlarm ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Alarma de aviso para el cobro de la suscripción
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Recibir recordatorio personalizado antes de que se cobre la suscripción
                      </p>
                    </div>
                  </div>

                  {/* Switch */}
                  <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                    enableAlarm ? 'bg-blue-600 justify-end' : 'bg-muted-foreground/30 justify-start'
                  }`}>
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </div>
                </div>

                {/* Selector de antelación personalizable si la alarma está activa */}
                {enableAlarm && (
                  <div className="p-3.5 rounded-xl bg-card border border-border space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Configurar antelación de la alarma:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Cantidad
                        </label>
                        <input
                          id="input-sub-alarm-val"
                          type="number"
                          min={alarmUnit === 'same_day' ? "0" : "1"}
                          max="365"
                          disabled={alarmUnit === 'same_day'}
                          value={alarmUnit === 'same_day' ? 0 : alarmValue}
                          onChange={(e) => setAlarmValue(Math.max(1, parseInt(e.target.value) || 1))}
                          className={`w-full px-3 py-2 rounded-xl border border-border text-foreground text-xs font-bold outline-none transition-colors ${
                            alarmUnit === 'same_day'
                              ? 'bg-muted/30 opacity-60 cursor-not-allowed text-muted-foreground'
                              : 'bg-muted/60 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Unidad de antelación
                        </label>
                        <select
                          id="select-sub-alarm-unit"
                          value={alarmUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value as AlarmUnit;
                            setAlarmUnit(newUnit);
                            if (newUnit === 'same_day') {
                              setAlarmValue(0);
                            } else if (alarmValue === 0) {
                              setAlarmValue(3);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground text-xs font-bold outline-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="same_day" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                            El mismo día
                          </option>
                          <option value="hours" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                            Horas antes
                          </option>
                          <option value="days" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                            Días antes
                          </option>
                          <option value="weeks" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                            Semanas antes
                          </option>
                          <option value="months" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                            Meses antes
                          </option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 pt-0.5">
                      <Bell className="w-3 h-3" />
                      <span>
                        {alarmUnit === 'same_day' || alarmValue === 0 ? (
                          <>Avisar <strong>el mismo día</strong> de la fecha de cobro de la suscripción.</>
                        ) : (
                          <>
                            Avisar <strong>{alarmValue} {alarmUnit === 'hours' ? (alarmValue === 1 ? 'hora' : 'horas') : alarmUnit === 'days' ? (alarmValue === 1 ? 'día' : 'días') : alarmUnit === 'weeks' ? (alarmValue === 1 ? 'semana' : 'semanas') : (alarmValue === 1 ? 'mes' : 'meses')} antes</strong> de la fecha de cobro de la suscripción.
                          </>
                        )}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Plataformas de compartición y precios por usuario (MATCHING SCREENSHOT 1) */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Plataformas de compartición
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Configura hasta 3 plataformas con su precio, divisa y periodicidad
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 dark:text-blue-300 text-xs font-extrabold">
                    {configuredPlatforms.length}/3
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManagePlatforms(true)}
                    className="p-1.5 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
                    title="Gestionar catálogo de plataformas"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Add Platform Button (Matching Screenshot 1) */}
              <button
                type="button"
                onClick={handleOpenAddPlatform}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-blue-500/40 hover:border-blue-500/70 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir plataforma de compartición</span>
              </button>

              {/* Configured Platforms List (Matching Screenshot 1) */}
              {configuredPlatforms.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-card border border-border text-muted-foreground text-xs">
                  No hay plataformas configuradas para esta suscripción.
                </div>
              ) : (
                <div className="space-y-2">
                  {configuredPlatforms.map((item, index) => {
                    const platformObj = platforms.find(
                      (p) => p.name.toLowerCase() === item.platformName.toLowerCase()
                    );
                    const platformColor = platformObj?.colorHex || '#1285FA';
                    const currSymbol = getCurrencySymbol(item.currency);
                    const periodShort = formatPeriodShort(item.period || billingPeriod);

                    return (
                      <div
                        key={item.platformName + index}
                        className="p-3 rounded-2xl bg-card border border-border/80 flex items-center justify-between gap-3 shadow-xs hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-2 ring-black/10 dark:ring-white/10"
                            style={{ backgroundColor: platformColor }}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {item.platformName}
                            </span>
                            <div className="mt-0.5">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-blue-300 bg-blue-950/60 dark:bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-md">
                                <CurrencyFlag currency={item.currency} size="xs" />
                                <span>{item.pricePerUser.toFixed(2).replace('.', ',')} {currSymbol}/{periodShort}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons: Edit Pencil & Delete Trash */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPlatform(index)}
                            className="p-2 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title={`Editar ${item.platformName}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePlatformFromSub(index)}
                            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={`Eliminar ${item.platformName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 7. Notas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Notas adicionales
              </label>
              <div className="relative">
                <textarea
                  id="textarea-subscription-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre contraseñas, perfiles, reglas del grupo, etc."
                  className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>
            </div>

            {/* Pinned/Fixed Footer Action Buttons */}
            <div className="p-4 sm:p-5 border-t border-border bg-card/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0 shadow-md">
              {/* Extremo izquierdo: Botón de eliminar (solo al editar) */}
              <div>
                {activeSubToEdit && onDelete ? (
                  confirmDelete ? (
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-500/10 border border-rose-500/30">
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 px-1.5">
                        ¿Eliminar?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeSubToEdit.id) {
                            onDelete(activeSubToEdit.id);
                            onClose();
                          }
                        }}
                        className="py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors shadow-xs cursor-pointer active:scale-95"
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="py-1 px-2 rounded-lg bg-muted text-muted-foreground text-[11px] font-medium hover:bg-muted/80 cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-modal-delete-subscription"
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer active:scale-95"
                      title="Eliminar suscripción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                ) : null}
              </div>

              {/* Extremo derecho: Cancelar y Guardar cambios con icono de disquete */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold transition-colors cursor-pointer active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-subscription"
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25 active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{activeSubToEdit ? 'Guardar cambios' : 'Crear suscripción'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* PLATFORM EDIT / ADD MODAL (MATCHING SCREENSHOT 2) */}
      {platformModalState && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full sm:max-w-md bg-[#181926] text-slate-100 border border-border/80 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <Pencil className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {platformModalState.mode === 'edit'
                    ? 'Editar Plataforma de Compartición'
                    : 'Añadir Plataforma de Compartición'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPlatformModalState(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlatformFromModal} className="space-y-4 pt-1">
              {/* Field 1: Plataforma de compartición */}
              <div className="relative" ref={platformSelectRef}>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Plataforma de compartición *
                </label>
                {(() => {
                  const currentPlat = platforms.find(
                    (p) => p.name.toLowerCase() === (platformModalState.platformName || '').toLowerCase()
                  ) || platforms[0];
                  const currentPlatColor = currentPlat?.colorHex || '#1285FA';
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsPlatformSelectOpen(!isPlatformSelectOpen)}
                        className="w-full bg-[#202234] text-slate-100 px-4 py-3 rounded-2xl border border-border/80 text-sm font-medium focus:outline-none focus:border-blue-500 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/10"
                            style={{ backgroundColor: currentPlatColor }}
                          />
                          <span className="truncate">{platformModalState.platformName || 'Seleccionar plataforma'}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
                            isPlatformSelectOpen ? 'rotate-180 text-slate-200' : ''
                          }`}
                        />
                      </button>

                      {isPlatformSelectOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#202234] border border-border/80 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-52 overflow-y-auto">
                          {platforms.map((p) => {
                            const isSelected = p.name.toLowerCase() === (platformModalState.platformName || '').toLowerCase();
                            return (
                              <button
                                key={p.id || p.name}
                                type="button"
                                onClick={() => {
                                  setPlatformModalState((prev) =>
                                    prev ? { ...prev, platformName: p.name } : null
                                  );
                                  setIsPlatformSelectOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer ${
                                  isSelected ? 'bg-blue-500/15 text-blue-400 font-bold' : 'text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/10"
                                    style={{ backgroundColor: p.colorHex || '#1285FA' }}
                                  />
                                  <span className="truncate">{p.name}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Field 2: Precio por usuario / slot */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Precio por usuario / slot *
                </label>
                <div className="relative flex items-center bg-[#202234] border border-border/80 rounded-2xl px-4 py-2.5 focus-within:border-blue-500 transition-colors">
                  <span className="text-base font-bold text-blue-400 mr-2.5 shrink-0">
                    {getCurrencySymbol(platformModalState.currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={platformModalState.pricePerUser}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setPlatformModalState((prev) =>
                        prev ? { ...prev, pricePerUser: val } : null
                      );
                    }}
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm font-bold text-slate-100 focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-slate-400 ml-2 shrink-0">
                    /{formatPeriodShort(platformModalState.period)}
                  </span>
                </div>
              </div>

              {/* Field 3: Moneda con la que paga la plataforma */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Moneda con la que paga la plataforma *
                </label>
                <CurrencySelect
                  value={platformModalState.currency}
                  onChange={(val) =>
                    setPlatformModalState((prev) =>
                      prev ? { ...prev, currency: val } : null
                    )
                  }
                  variant="dark"
                />
              </div>

              {/* Field 4: Frecuencia de pago de la plataforma */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Frecuencia de pago de la plataforma *
                </label>
                <div className="relative">
                  <select
                    value={platformModalState.period}
                    onChange={(e) =>
                      setPlatformModalState((prev) =>
                        prev ? { ...prev, period: e.target.value as BillingPeriod } : null
                      )
                    }
                    className="w-full bg-[#202234] text-slate-100 px-4 py-3 pr-10 rounded-2xl border border-border/80 text-sm font-medium focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="MONTHLY" className="bg-[#202234] text-slate-100">Mensual</option>
                    <option value="QUARTERLY" className="bg-[#202234] text-slate-100">Trimestral</option>
                    <option value="SEMI_ANNUAL" className="bg-[#202234] text-slate-100">Semestral</option>
                    <option value="YEARLY" className="bg-[#202234] text-slate-100">Anual</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Field 5: Método habitual por defecto (opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Método habitual por defecto (opcional)
                </label>
                <input
                  type="text"
                  value={platformModalState.defaultPaymentMethod}
                  onChange={(e) =>
                    setPlatformModalState((prev) =>
                      prev ? { ...prev, defaultPaymentMethod: e.target.value } : null
                    )
                  }
                  placeholder="Ej. Bizum, Sharesub Wallet, Joiin..."
                  className="w-full bg-[#202234] text-slate-100 px-4 py-3 rounded-2xl border border-border/80 text-sm font-medium focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Se usará por defecto en el "Método habitual" de los miembros de esta suscripción.
                </p>
              </div>

              {/* Info banner at bottom */}
              <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-500/20 text-blue-200 flex items-center gap-2.5 text-xs font-semibold">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Tarifa: {platformModalState.platformName || 'Plataforma'} •{' '}
                  {(typeof platformModalState.pricePerUser === 'number'
                    ? platformModalState.pricePerUser
                    : 0
                  )
                    .toFixed(2)
                    .replace('.', ',')}{' '}
                  {getCurrencySymbol(platformModalState.currency)}/
                  {formatPeriodShort(platformModalState.period)}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPlatformModalState(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
                >
                  {platformModalState.mode === 'edit' ? 'Actualizar' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sharing Platform Manager Modal */}
      <ManageSharingPlatformsModal
        isOpen={showManagePlatforms}
        onClose={() => setShowManagePlatforms(false)}
      />

      {/* Icon & Custom Logo Selector Modal */}
      <IconSelectorModal
        isOpen={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(data) => {
          setIconType(data.iconType);
          setIconKey(data.iconKey);
          setIconColorHex(data.iconColorHex);
          setCustomImageUri(data.customImageUri);
          setCustomImageBase64(data.customImageBase64 || '');
          setHasManuallyPickedIcon(true);
        }}
        currentIconType={iconType}
        currentIconKey={iconKey}
        currentIconColorHex={iconColorHex}
        currentCustomImageUri={customImageUri}
        currentCustomImageBase64={customImageBase64}
        platformName={platformName}
        subscriptionId={activeSubToEdit?.id || newSubId}
      />
    </>
  );
};
