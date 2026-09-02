import React, { useState, useEffect, useRef } from 'react';
import { 
  Subscription, 
  Member, 
  PaymentFrequencyUnit,
  AlarmUnit,
  CURRENCY_DETAILED_OPTIONS,
  parsePlatformPricing, 
  getMemberPlatformInfo, 
  getMemberContributionAmount,
  calculateNextPaymentFromJoined,
  resolveMemberNextPaymentDate,
  getCurrencySymbol,
  getCurrencyFlag,
  normalizeBillingPeriod
} from '../types';
import { useSharingPlatforms } from '../context/SharingPlatformsContext';
import { useCurrency } from '../context/CurrencyContext';
import { 
  X, 
  UserPlus, 
  Trash2, 
  Phone, 
  Calendar,
  Hourglass,
  Check,
  Bell,
  Clock,
  Repeat,
  ChevronDown
} from 'lucide-react';
import { PlatformIconBadge } from '../utils/icons';
import { CurrencyFlag } from './CurrencyFlag';
import { CurrencySelect } from './CurrencySelect';

interface MembersDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onUpdateSubscription: (updatedSub: Subscription) => Promise<void>;
  ownerName?: string;
  initialMemberId?: string | null;
}

export const MembersDetailModal: React.FC<MembersDetailModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpdateSubscription,
  initialMemberId,
}) => {
  const { platforms } = useSharingPlatforms();
  const { convertToEur } = useCurrency();

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  // Multi-currency calculations
  const originalCurrency = subscription.currency || 'EUR';
  const totalCostInEur = convertToEur(subscription.cost, originalCurrency);
  const period = subscription.billingPeriod || (subscription.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY');
  const periodMonths = period === 'YEARLY' ? 12 : period === 'SEMI_ANNUAL' ? 6 : period === 'QUARTERLY' ? 3 : 1;
  const monthlyCostInEur = totalCostInEur / periodMonths;

  const defaultSlotPrice = subscription.defaultContributionPerUser || (subscription.members && subscription.members.length > 0 
    ? Number((monthlyCostInEur / subscription.members.length).toFixed(2)) 
    : 3.50);

  // Available sharing platforms configured specifically for THIS subscription
  const configuredPricingItems = parsePlatformPricing(subscription?.platformPricing);
  const availablePlatforms = configuredPricingItems.map((cp) => {
    const matched = platforms.find((p) => p.name.toLowerCase() === cp.platformName.toLowerCase());
    return {
      name: cp.platformName,
      pricePerUser: cp.pricePerUser,
      currency: cp.currency || subscription?.currency || 'EUR',
      period: cp.period,
      colorHex: matched?.colorHex || '#1285FA',
      defaultPaymentMethod: cp.defaultPaymentMethod || '',
    };
  });

  // Form states
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<string>('');
  const [contact, setContact] = useState('');
  const [amount, setAmount] = useState<number>(availablePlatforms[0]?.pricePerUser || defaultSlotPrice);
  const [memberCurrency, setMemberCurrency] = useState<string>(availablePlatforms[0]?.currency || subscription.currency || 'EUR');
  const [method, setMethod] = useState('');
  
  // Payment date and frequency (Default nextPaymentDate is blank)
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('');
  const [paymentFrequencyValue, setPaymentFrequencyValue] = useState<number>(1);
  const [paymentFrequencyUnit, setPaymentFrequencyUnit] = useState<PaymentFrequencyUnit>('months');
  const [autoRepeatPayment, setAutoRepeatPayment] = useState<boolean>(true);

  // Alarm settings
  const [enableAlarm, setEnableAlarm] = useState<boolean>(false);
  const [alarmValue, setAlarmValue] = useState<number>(3);
  const [alarmUnit, setAlarmUnit] = useState<AlarmUnit>('days');

  const [notes, setNotes] = useState('');
  const [joinedDate, setJoinedDate] = useState<string>('');
  const [pendingPayment, setPendingPayment] = useState<boolean>(false);
  const [pendingRemoval, setPendingRemoval] = useState<boolean>(false);
  const [pendingRegistration, setPendingRegistration] = useState<boolean>(false);

  // Custom platform dropdown state
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState<boolean>(false);
  const platformDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        platformDropdownRef.current &&
        !platformDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPlatformDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const members = subscription.members || [];

  const getFrequencyPeriodLabel = () => {
    const val = paymentFrequencyValue || 1;
    if (paymentFrequencyUnit === 'days') return val === 1 ? 'día' : `${val} días`;
    if (paymentFrequencyUnit === 'weeks') return val === 1 ? 'sem' : `${val} sem`;
    if (paymentFrequencyUnit === 'years') return val === 1 ? 'año' : `${val} años`;
    return val === 1 ? 'mes' : `${val} meses`;
  };

  const handleJoinedDateChange = (newJoinedDate: string) => {
    setJoinedDate(newJoinedDate);
    if (newJoinedDate) {
      const calculated = calculateNextPaymentFromJoined(
        newJoinedDate,
        paymentFrequencyValue,
        paymentFrequencyUnit
      );
      setNextPaymentDate(calculated);
    } else {
      setNextPaymentDate('');
    }
  };

  const handleFrequencyValueChange = (newVal: number) => {
    const cleanVal = Math.max(1, newVal);
    setPaymentFrequencyValue(cleanVal);
    if (joinedDate) {
      const calculated = calculateNextPaymentFromJoined(
        joinedDate,
        cleanVal,
        paymentFrequencyUnit
      );
      setNextPaymentDate(calculated);
    }
  };

  const handleFrequencyUnitChange = (newUnit: PaymentFrequencyUnit) => {
    setPaymentFrequencyUnit(newUnit);
    if (joinedDate) {
      const calculated = calculateNextPaymentFromJoined(
        joinedDate,
        paymentFrequencyValue,
        newUnit
      );
      setNextPaymentDate(calculated);
    }
  };

  const resetForm = () => {
    const firstPlatform = availablePlatforms[0];
    const initPlat = '';
    const initAmount = firstPlatform && firstPlatform.pricePerUser > 0 ? firstPlatform.pricePerUser : defaultSlotPrice;
    const initCurr = firstPlatform?.currency || subscription.currency || 'EUR';
    const todayStr = new Date().toISOString().split('T')[0];
    const initialNextPayment = calculateNextPaymentFromJoined(todayStr, 1, 'months');

    setName('');
    setPlatform(initPlat);
    setContact('');
    setAmount(initAmount);
    setMemberCurrency(initCurr);
    setMethod('');
    setNextPaymentDate(initialNextPayment);
    setPaymentFrequencyValue(1);
    setPaymentFrequencyUnit('months');
    setAutoRepeatPayment(true);
    setEnableAlarm(false);
    setAlarmValue(3);
    setAlarmUnit('days');
    setNotes('');
    setJoinedDate(todayStr);
    setPendingPayment(false);
    setPendingRemoval(false);
    setPendingRegistration(false);
    setEditingMemberId(null);
    setConfirmDelete(false);
  };

  const populateWithMember = (targetMember: Member) => {
    setEditingMemberId(targetMember.id);
    setName(targetMember.memberName || targetMember.name || '');
    const currentMemberPlat = targetMember.sharingPlatform || targetMember.platform || '';
    setPlatform(currentMemberPlat);
    setContact(targetMember.memberContact || targetMember.contact || '');
    setAmount(getMemberContributionAmount(subscription, targetMember));
    const targetPlatInfo = getMemberPlatformInfo(subscription, targetMember);
    setMemberCurrency(targetMember.currency || targetPlatInfo.currency || subscription.currency || 'EUR');
    setMethod(targetMember.paymentMethod || '');
    
    const computedNext = resolveMemberNextPaymentDate(targetMember, subscription.billingDay);
    setNextPaymentDate(targetMember.nextPaymentDate || computedNext);
    setPaymentFrequencyValue(targetMember.paymentFrequencyValue ?? 1);
    setPaymentFrequencyUnit(targetMember.paymentFrequencyUnit || 'months');
    setAutoRepeatPayment(targetMember.autoRepeatPayment !== undefined ? Boolean(targetMember.autoRepeatPayment) : true);
    setEnableAlarm(Boolean(targetMember.enableAlarm));
    setAlarmValue(targetMember.alarmValue ?? targetMember.alarmDaysBefore ?? 3);
    setAlarmUnit(targetMember.alarmUnit || 'days');
    setNotes(targetMember.notes || '');
    setPendingPayment(Boolean(targetMember.isPendingPayment));
    setPendingRemoval(Boolean(targetMember.isPendingRemoval));
    setPendingRegistration(Boolean(targetMember.isPendingRegistration));

    if (targetMember.joinedDate) {
      try {
        const d = new Date(targetMember.joinedDate);
        if (!isNaN(d.getTime())) {
          setJoinedDate(d.toISOString().split('T')[0]);
        } else {
          setJoinedDate(String(targetMember.joinedDate));
        }
      } catch {
        setJoinedDate(String(targetMember.joinedDate));
      }
    } else {
      setJoinedDate(new Date().toISOString().split('T')[0]);
    }
    setConfirmDelete(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialMemberId) {
        const target = subscription.members?.find((m) => String(m.id) === String(initialMemberId));
        if (target) {
          populateWithMember(target);
          return;
        }
      }
      resetForm();
    }
  }, [isOpen, initialMemberId, subscription.id, subscription.platformPricing]);

  if (!isOpen) return null;

  const formatDisplayDate = (isoOrDateStr?: string | number) => {
    if (!isoOrDateStr) return '';
    try {
      const d = new Date(isoOrDateStr);
      if (isNaN(d.getTime())) return String(isoOrDateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return String(isoOrDateStr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updatedMembers: Member[];
    const isPaid = !pendingPayment;

    // Convert customizable alarm value to days for backwards compatibility
    const calcDaysBefore = alarmUnit === 'same_day'
      ? 0
      : alarmUnit === 'hours' 
      ? Math.max(0, Math.round(alarmValue / 24)) 
      : alarmUnit === 'weeks' 
      ? alarmValue * 7 
      : alarmUnit === 'months' 
      ? alarmValue * 30 
      : alarmValue;

    const resolvedJoined = joinedDate || new Date().toISOString().split('T')[0];
    const computedNext = resolveMemberNextPaymentDate({
      joinedDate: resolvedJoined,
      nextPaymentDate: nextPaymentDate || undefined,
      paymentFrequencyValue: paymentFrequencyValue || 1,
      paymentFrequencyUnit: paymentFrequencyUnit,
    }, subscription.billingDay);

    if (editingMemberId) {
      // Editing existing member
      updatedMembers = members.map((m) => {
        if (String(m.id) === String(editingMemberId)) {
          const itemJoined = joinedDate || m.joinedDate || new Date().toISOString().split('T')[0];
          const itemNext = nextPaymentDate || resolveMemberNextPaymentDate({
            ...m,
            joinedDate: itemJoined,
            paymentFrequencyValue: paymentFrequencyValue || 1,
            paymentFrequencyUnit: paymentFrequencyUnit,
          }, subscription.billingDay);

          return {
            ...m,
            name: name.trim(),
            memberName: name.trim(),
            platform: platform,
            sharingPlatform: platform,
            contact: contact.trim(),
            memberContact: contact.trim(),
            amount: Number(amount) || defaultSlotPrice,
            contributionAmount: Number(amount) || defaultSlotPrice,
            currency: memberCurrency || 'EUR',
            isPaidThisMonth: isPaid,
            isPendingPayment: pendingPayment,
            isPendingRemoval: pendingRemoval,
            isPendingRegistration: pendingRegistration,
            paymentMethod: method.trim(),
            nextPaymentDate: itemNext,
            paymentFrequencyValue: paymentFrequencyValue || 1,
            paymentFrequencyUnit: paymentFrequencyUnit,
            autoRepeatPayment: autoRepeatPayment,
            enableAlarm: enableAlarm,
            alarmValue: alarmUnit === 'same_day' ? 0 : (alarmValue || 1),
            alarmUnit: alarmUnit,
            alarmDaysBefore: enableAlarm ? calcDaysBefore : undefined,
            joinedDate: itemJoined,
            notes: notes.trim(),
            lastPaymentDate: isPaid ? new Date().toISOString().split('T')[0] : m.lastPaymentDate,
          };
        }
        return m;
      });
    } else {
      // Adding new member with a 64-bit integer digit-only stable ID (interoperable with Android Long)
      const newMember: Member = {
        id: String(Date.now() * 1000 + Math.floor(Math.random() * 1000)),
        name: name.trim(),
        memberName: name.trim(),
        platform: platform,
        sharingPlatform: platform,
        contact: contact.trim(),
        memberContact: contact.trim(),
        amount: Number(amount) || defaultSlotPrice,
        contributionAmount: Number(amount) || defaultSlotPrice,
        currency: memberCurrency || 'EUR',
        isPaidThisMonth: isPaid,
        isPendingPayment: pendingPayment,
        isPendingRemoval: pendingRemoval,
        isPendingRegistration: pendingRegistration,
        paymentMethod: method.trim(),
        nextPaymentDate: computedNext,
        paymentFrequencyValue: paymentFrequencyValue || 1,
        paymentFrequencyUnit: paymentFrequencyUnit,
        autoRepeatPayment: autoRepeatPayment,
        enableAlarm: enableAlarm,
        alarmValue: alarmUnit === 'same_day' ? 0 : (alarmValue || 1),
        alarmUnit: alarmUnit,
        alarmDaysBefore: enableAlarm ? calcDaysBefore : undefined,
        joinedDate: resolvedJoined,
        lastPaymentDate: isPaid ? new Date().toISOString().split('T')[0] : undefined,
        notes: notes.trim(),
      };
      updatedMembers = [...members, newMember];
    }

    // Optimistic immediate close & background persist
    onClose();
    onUpdateSubscription({
      ...subscription,
      members: updatedMembers,
    }).catch((err) => {
      console.error('Error persisting member changes:', err);
    });
  };

  const handleDeleteCurrentMember = () => {
    if (!editingMemberId) return;
    const updatedMembers = members.filter((m) => String(m.id) !== String(editingMemberId));
    onClose();
    onUpdateSubscription({
      ...subscription,
      members: updatedMembers,
    }).catch((err) => {
      console.error('Error deleting member:', err);
    });
  };

  const handleSelectPlatform = (selectedPlatformName: string) => {
    setPlatform(selectedPlatformName);
    setIsPlatformDropdownOpen(false);
    const match = availablePlatforms.find(
      (p) => p.name.toLowerCase() === selectedPlatformName.toLowerCase()
    );
    if (match) {
      if (typeof match.pricePerUser === 'number' && match.pricePerUser > 0) {
        setAmount(match.pricePerUser);
      }
      if (!editingMemberId && match.currency) {
        setMemberCurrency(match.currency);
      }
      if (match.period) {
        const norm = normalizeBillingPeriod(match.period);
        if (norm === 'MONTHLY') {
          setPaymentFrequencyValue(1);
          setPaymentFrequencyUnit('months');
        } else if (norm === 'QUARTERLY') {
          setPaymentFrequencyValue(3);
          setPaymentFrequencyUnit('months');
        } else if (norm === 'SEMI_ANNUAL') {
          setPaymentFrequencyValue(6);
          setPaymentFrequencyUnit('months');
        } else if (norm === 'YEARLY') {
          setPaymentFrequencyValue(1);
          setPaymentFrequencyUnit('years');
        }
      }
      // Autocompletar el método habitual solo si está vacío (nunca pisa lo escrito a mano)
      setMethod((prev) => (prev.trim() ? prev : (match.defaultPaymentMethod || '')));
    }
  };

  const currentSelectedPlatform = availablePlatforms.find(
    (p) => p.name.toLowerCase() === (platform || '').toLowerCase()
  ) || platforms.find(
    (p) => p.name.toLowerCase() === (platform || '').toLowerCase()
  );
  const selectedPlatformColor = currentSelectedPlatform?.colorHex || '#1285FA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div 
        id="modal-member-editor"
        className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col transition-all"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <PlatformIconBadge
              platformName={subscription.platformName || subscription.name}
              iconType={subscription.iconType}
              iconKey={subscription.iconKey}
              customImageUri={subscription.customImageUri}
              customImageBase64={subscription.customImageBase64}
              iconColorHex={subscription.iconColorHex || subscription.color || '#1285FA'}
              sizeClass="w-11 h-11"
              iconSizeClass="w-5 h-5"
              roundedClass="rounded-2xl"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-foreground tracking-tight truncate">
                  {editingMemberId ? 'Editar usuario' : 'Añadir usuario'}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {subscription.platformName || subscription.name}
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

        {/* Modal Form Body with Fixed Bottom Action Bar */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable inputs area */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* 1. Nombre o Apodo & Plataforma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Nombre o Apodo <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-member-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos M., Laura Pérez"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-xs font-semibold placeholder-muted-foreground outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="relative" ref={platformDropdownRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Plataforma de compartición
              </label>
              {availablePlatforms.length > 0 ? (
                <>
                  <button
                    type="button"
                    id="select-member-platform"
                    onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border text-foreground text-xs font-semibold flex items-center justify-between outline-none cursor-pointer focus:border-blue-500 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                        style={{ backgroundColor: selectedPlatformColor }}
                      />
                      <span className="truncate">{platform || 'Seleccionar plataforma'}</span>
                      {currentSelectedPlatform && 'pricePerUser' in currentSelectedPlatform && (currentSelectedPlatform as any).pricePerUser > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                          <CurrencyFlag currency={(currentSelectedPlatform as any).currency} size="xs" />
                          <span>{(currentSelectedPlatform as any).pricePerUser.toFixed(2)} {getCurrencySymbol((currentSelectedPlatform as any).currency)}</span>
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-1.5 ${
                        isPlatformDropdownOpen ? 'rotate-180 text-foreground' : ''
                      }`}
                    />
                  </button>

                  {isPlatformDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card dark:bg-zinc-900 border border-border rounded-2xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto">
                      {/* Opción "Sin plataforma" */}
                      <button
                        type="button"
                        onClick={() => {
                          setPlatform('');
                          setIsPlatformDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-muted/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                          !platform ? 'bg-blue-500/10 text-blue-500 font-bold' : 'text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10 dark:ring-white/10 bg-slate-400 dark:bg-zinc-500"
                          />
                          <span className="truncate">Sin plataforma</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {!platform && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                        </div>
                      </button>

                      {availablePlatforms.map((p) => {
                        const isSelected = p.name.toLowerCase() === (platform || '').toLowerCase();
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => handleSelectPlatform(p.name)}
                            className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-muted/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                              isSelected ? 'bg-blue-500/10 text-blue-500 font-bold' : 'text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                                style={{ backgroundColor: p.colorHex || '#1285FA' }}
                              />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {p.pricePerUser > 0 && (
                                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                  <CurrencyFlag currency={p.currency} size="xs" />
                                  <span>{p.pricePerUser.toFixed(2)} {getCurrencySymbol(p.currency)}</span>
                                </span>
                              )}
                              {isSelected && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex flex-col gap-0.5">
                  <span className="font-bold">Sin plataformas en esta suscripción</span>
                  <span className="text-[11px] text-muted-foreground">
                    Añade plataformas desde la configuración de la suscripción (ej. Sharesub, Spliiit, Together Price).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Importe aportado & Método habitual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Importe aportado
                <span className="text-blue-500 lowercase font-bold ml-1">
                  /{getFrequencyPeriodLabel()}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-28 shrink-0">
                  <input
                    id="input-member-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-[130px]">
                  <CurrencySelect
                    id="select-member-currency"
                    value={memberCurrency}
                    onChange={(val) => setMemberCurrency(val)}
                    compact
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Método habitual
              </label>
              <input
                id="input-member-method"
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Bizum, Transferencia, Tarjeta..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-xs font-semibold placeholder-muted-foreground outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* 3. Fecha de unión */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Fecha de unión</span>
              </span>
              <span className="text-xs font-extrabold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
                {formatDisplayDate(joinedDate) || 'Sin fijar'}
              </span>
            </div>

            <div className="relative">
              <input
                id="input-member-joined-date"
                type="date"
                value={joinedDate}
                onChange={(e) => handleJoinedDateChange(e.target.value)}
                className="custom-date-input w-full px-3.5 py-2.5 pr-10 rounded-xl bg-card border border-border text-foreground text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('input-member-joined-date') as HTMLInputElement | null;
                  if (el) {
                    if (typeof el.showPicker === 'function') {
                      try {
                        el.showPicker();
                      } catch {
                        el.focus();
                      }
                    } else {
                      el.focus();
                    }
                  }
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer z-20"
                title="Seleccionar fecha"
              >
                <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </button>
            </div>
          </div>

          {/* 4. Fecha del próximo pago, Frecuencia y Alarma Personalizable */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-4">
            {/* Encabezado con previsualización */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Fecha del próximo pago</span>
              </span>
              <span className="text-xs font-extrabold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
                {formatDisplayDate(nextPaymentDate) || 'Sin fijar'}
              </span>
            </div>

            {/* Selector de fecha */}
            <div>
              <div className="relative">
                <input
                  id="input-member-next-payment-date"
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  className="custom-date-input w-full px-3.5 py-2.5 pr-10 rounded-xl bg-card border border-border text-foreground text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('input-member-next-payment-date') as HTMLInputElement | null;
                    if (el) {
                      if (typeof el.showPicker === 'function') {
                        try {
                          el.showPicker();
                        } catch {
                          el.focus();
                        }
                      } else {
                        el.focus();
                      }
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer z-20"
                  title="Seleccionar fecha"
                >
                  <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">
                Calculada automáticamente según la fecha de unión y periodicidad, o modificable a mano.
              </p>
            </div>

            {/* Frecuencia de pago automática */}
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Repeat className="w-3.5 h-3.5 text-blue-500" />
                  <span>Frecuencia del pago</span>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Repetición automática
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Cada (número)
                  </label>
                  <input
                    id="input-payment-freq-val"
                    type="number"
                    min="1"
                    max="365"
                    value={paymentFrequencyValue}
                    onChange={(e) => handleFrequencyValueChange(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Unidad
                  </label>
                  <select
                    id="select-payment-freq-unit"
                    value={paymentFrequencyUnit}
                    onChange={(e) => handleFrequencyUnitChange(e.target.value as PaymentFrequencyUnit)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground text-xs font-bold outline-none cursor-pointer focus:border-blue-500 transition-colors"
                  >
                    <option value="days" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                      Día(s)
                    </option>
                    <option value="weeks" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                      Semana(s)
                    </option>
                    <option value="months" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                      Mes(es)
                    </option>
                    <option value="years" className="bg-card text-foreground dark:bg-zinc-900 dark:text-zinc-100">
                      Año(s)
                    </option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>
                  Se repite automáticamente cada{' '}
                  <strong className="text-foreground">
                    {paymentFrequencyValue}{' '}
                    {paymentFrequencyUnit === 'days'
                      ? paymentFrequencyValue === 1 ? 'día' : 'días'
                      : paymentFrequencyUnit === 'weeks'
                      ? paymentFrequencyValue === 1 ? 'semana' : 'semanas'
                      : paymentFrequencyUnit === 'months'
                      ? paymentFrequencyValue === 1 ? 'mes' : 'meses'
                      : paymentFrequencyValue === 1 ? 'año' : 'años'}
                  </strong>.
                </span>
              </p>
            </div>

            {/* Configuración de alarma / recordatorio personalizable */}
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
                      Alarma de aviso para el gestor
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Recibir recordatorio personalizado antes del cobro
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
                        id="input-alarm-val"
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
                        id="select-alarm-unit"
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
                        <>Avisar <strong>el mismo día</strong> de la fecha de cobro.</>
                      ) : (
                        <>
                          Avisar <strong>{alarmValue} {alarmUnit === 'hours' ? (alarmValue === 1 ? 'hora' : 'horas') : alarmUnit === 'days' ? (alarmValue === 1 ? 'día' : 'días') : alarmUnit === 'weeks' ? (alarmValue === 1 ? 'semana' : 'semanas') : (alarmValue === 1 ? 'mes' : 'meses')} antes</strong> de la fecha de cobro.
                        </>
                      )}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 5. Teléfono o Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Teléfono o Email (opcional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-member-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Teléfono (para recordatorios WhatsApp) o correo"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-xs font-semibold placeholder-muted-foreground outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* 6. Notas o perfil asignado */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Notas o perfil asignado (opcional)
            </label>
            <input
              id="input-member-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Perfil 3 (PIN: 1234)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-xs font-semibold placeholder-muted-foreground outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* 7. Estados y alertas del usuario */}
          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Estados y alertas del usuario
            </h4>

            {/* 1. Pendiente de pago (Amarillo) */}
            <div
              onClick={() => {
                const nextVal = !pendingPayment;
                setPendingPayment(nextVal);
                if (nextVal) {
                  setPendingRemoval(false);
                  setPendingRegistration(false);
                }
              }}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                pendingPayment
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingPayment ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'bg-muted text-muted-foreground'
                }`}>
                  <Hourglass className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-foreground leading-tight">
                    Pendiente de pago
                  </h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Resaltado en amarillo (Pago del mes pendiente)
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                pendingPayment ? 'bg-amber-500 justify-end' : 'bg-muted-foreground/30 justify-start'
              }`}>
                <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
              </div>
            </div>

            {/* 2. Pendiente eliminar (Rojo) */}
            <div
              onClick={() => {
                const nextVal = !pendingRemoval;
                setPendingRemoval(nextVal);
                if (nextVal) {
                  setPendingPayment(false);
                  setPendingRegistration(false);
                }
              }}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                pendingRemoval
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 shadow-sm'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingRemoval ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300' : 'bg-muted text-muted-foreground'
                }`}>
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-foreground leading-tight">
                    Pendiente eliminar
                  </h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Resaltado en rojo (Para dar de baja)
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                pendingRemoval ? 'bg-rose-600 justify-end' : 'bg-muted-foreground/30 justify-start'
              }`}>
                <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
              </div>
            </div>

            {/* 3. Pendiente dar de alta (Azul) */}
            <div
              onClick={() => {
                const nextVal = !pendingRegistration;
                setPendingRegistration(nextVal);
                if (nextVal) {
                  setPendingPayment(false);
                  setPendingRemoval(false);
                }
              }}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                pendingRegistration
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingRegistration ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300' : 'bg-muted text-muted-foreground'
                }`}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-foreground leading-tight">
                    Pendiente dar de alta
                  </h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Resaltado en azul (En proceso de registro)
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                pendingRegistration ? 'bg-sky-600 justify-end' : 'bg-muted-foreground/30 justify-start'
              }`}>
                <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
              </div>
            </div>
          </div>

          </div>

          {/* Pinned/Fixed Footer Action Buttons */}
          <div className="p-4 sm:p-5 border-t border-border bg-card/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0 shadow-md">
            <div>
              {editingMemberId && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-500">¿Eliminar?</span>
                    <button
                      type="button"
                      onClick={handleDeleteCurrentMember}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar usuario</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-member"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingMemberId ? 'Guardar cambios' : 'Añadir usuario'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
