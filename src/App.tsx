import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useTheme, ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Subscription, FilterOptions, Member } from './types';
import { 
  subscribeToUserSubscriptions, 
  createSubscription, 
  updateSubscription, 
  updateSubscriptionMembers,
  deleteSubscription,
  toggleMemberPaymentStatus,
  markAllSubscriptionMembersAsPaid,
  batchImportSubscriptions
} from './services/subscriptionService';
import { getSampleSubscriptions } from './utils/sampleData';

import { Navbar } from './components/Navbar';
import { MetricsHeader } from './components/MetricsHeader';
import { SubscriptionMasterList } from './components/SubscriptionMasterList';
import { SubscriptionDetailView } from './components/SubscriptionDetailView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { MembersDetailModal } from './components/MembersDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { EmptyState } from './components/EmptyState';
import { SharingPlatformsProvider } from './context/SharingPlatformsContext';
import { 
  generateNotificationsFromSubscriptions, 
  getReadNotificationIds, 
  saveReadNotificationIds,
  AppNotification
} from './utils/notifications';

import { 
  LogIn, 
  Sparkles, 
  RefreshCw, 
  Database,
  Calendar,
  Layers
} from 'lucide-react';

function SplitzyApp() {
  const { user, loading: authLoading, signIn, authError, clearAuthError } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Local demo fallback if user hasn't signed in yet
  const [localGuestSubscriptions, setLocalGuestSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('splitzy_guest_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Default demo data for guest
    return getSampleSubscriptions('guest').map((s, idx) => ({
      ...s,
      id: `guest_sub_${idx + 1}`,
      userId: 'guest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  // Save guest state
  useEffect(() => {
    if (!user) {
      localStorage.setItem('splitzy_guest_data', JSON.stringify(localGuestSubscriptions));
    }
  }, [localGuestSubscriptions, user]);

  // Subscribe to real Firestore when user is authenticated
  useEffect(() => {
    if (!user) {
      setSubscriptions(localGuestSubscriptions);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setSyncError(null);

    const unsubscribe = subscribeToUserSubscriptions(
      user.uid,
      (data) => {
        setSubscriptions(data);
        setSelectedSubForMembers((prev) => {
          if (!prev) return null;
          return data.find((s) => String(s.id) === String(prev.id)) || prev;
        });
        setLoadingData(false);
      },
      (err) => {
        console.error('Error fetching subscriptions:', err);
        setSyncError('Error al sincronizar con Firestore. Comprueba los permisos o la conexión.');
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Modals state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalInitialData, setSubModalInitialData] = useState<Subscription | null>(null);
  
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedSubForMembers, setSelectedSubForMembers] = useState<Subscription | null>(null);
  const [selectedMemberIdForModal, setSelectedMemberIdForModal] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Read notifications IDs persistence
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => getReadNotificationIds());

  // Generate active notifications from subscriptions
  const activeSubscriptions = user ? subscriptions : localGuestSubscriptions;
  const notifications = useMemo(() => {
    return generateNotificationsFromSubscriptions(activeSubscriptions, readNotificationIds);
  }, [activeSubscriptions, readNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAllNotificationsRead = () => {
    const allIds = Array.from(new Set([...readNotificationIds, ...notifications.map((n) => n.id)]));
    setReadNotificationIds(allIds);
    saveReadNotificationIds(allIds);
  };

  const handleToggleNotificationRead = (notifId: string) => {
    const isCurrentlyRead = readNotificationIds.includes(notifId);
    let updated: string[];
    if (isCurrentlyRead) {
      updated = readNotificationIds.filter((id) => id !== notifId);
    } else {
      updated = [...readNotificationIds, notifId];
    }
    setReadNotificationIds(updated);
    saveReadNotificationIds(updated);
  };

  const handleMarkMemberPaidFromNotification = async (subscriptionId: string, memberId: string) => {
    const sub = activeSubscriptions.find((s) => String(s.id) === String(subscriptionId));
    if (!sub) return;
    await handleToggleMemberPayment(subscriptionId, sub.members || [], memberId);
    // Also mark this notification as read
    const notif = notifications.find((n) => String(n.subscriptionId) === String(subscriptionId) && String(n.memberId) === String(memberId));
    if (notif && !readNotificationIds.includes(notif.id)) {
      handleToggleNotificationRead(notif.id);
    }
  };

  // Selected subscription for detail view
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'ALL',
    platform: 'ALL',
    paymentStatus: 'ALL',
    sortBy: 'renewal',
  });

  // Action handlers
  const handleOpenNewSub = () => {
    setSubModalInitialData(null);
    setIsSubModalOpen(true);
  };

  const handleEditSub = (sub: Subscription) => {
    setSubModalInitialData(sub);
    setIsSubModalOpen(true);
  };

  const handleManageMembers = (sub: Subscription, memberId?: string) => {
    setSelectedSubForMembers(sub);
    setSelectedMemberIdForModal(memberId || null);
    setIsMembersModalOpen(true);
  };

  const handleSaveSubscription = async (
    subData: Partial<Subscription>
  ) => {
    const platformName = subData.platformName || subData.name || 'Suscripción';
    const completeData: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: platformName,
      platformName: platformName,
      mainUserName: subData.mainUserName || '',
      category: subData.category || 'General',
      cost: typeof subData.cost === 'number' ? subData.cost : 0,
      currency: subData.currency || 'EUR',
      billingPeriod: subData.billingPeriod || 'MONTHLY',
      billingCycle: subData.billingPeriod === 'YEARLY' ? 'yearly' : 'monthly',
      billingDay: subData.billingDay || 1,
      billingMonth: subData.billingMonth || 1,
      renewalDate: subData.renewalDate || '',
      enableAlarm: Boolean(subData.enableAlarm),
      alarmValue: typeof subData.alarmValue === 'number' ? subData.alarmValue : 3,
      alarmUnit: subData.alarmUnit || 'days',
      alarmDaysBefore: subData.alarmDaysBefore,
      platformPricing: subData.platformPricing || '',
      notes: subData.notes || '',
      members: subData.members || [],
      iconColorHex: subData.iconColorHex || '#1285FA',
      color: subData.color || '#1285FA',
      iconType: subData.iconType || 'PRESET',
      iconKey: subData.iconKey || platformName,
      customImageUri: subData.customImageUri || '',
      customImageBase64: subData.customImageBase64 || '',
    };

    if (user) {
      if (subModalInitialData && subModalInitialData.id) {
        // Optimistic UI update for instant feedback
        setSubscriptions((prev) =>
          prev.map((s) =>
            String(s.id) === String(subModalInitialData.id)
              ? { ...s, ...subData, updatedAt: new Date().toISOString() }
              : s
          )
        );
        // Update existing subscription document using exact same ID in background
        updateSubscription(user.uid, String(subModalInitialData.id), subData).catch((err) => {
          console.error('Error updating subscription in Firestore:', err);
        });
      } else {
        // Create new subscription with pre-generated numeric ID matching Storage path
        const newNumericId = subData.id ? String(subData.id) : String(Date.now() * 1000 + Math.floor(Math.random() * 1000));
        const optimisticSub: Subscription = {
          ...completeData,
          id: newNumericId,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSubscriptions((prev) => [optimisticSub, ...prev]);
        setSelectedSubscriptionId(newNumericId);

        createSubscription(user.uid, completeData, newNumericId).catch((err) => {
          console.error('Error creating subscription in Firestore:', err);
        });
      }
    } else {
      // Guest local storage handler
      if (subModalInitialData && subModalInitialData.id) {
        setLocalGuestSubscriptions((prev) =>
          prev.map((s) =>
            String(s.id) === String(subModalInitialData.id)
              ? { ...s, ...subData, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        const newNumericId = subData.id ? String(subData.id) : String(Date.now() * 1000 + Math.floor(Math.random() * 1000));
        const newSub: Subscription = {
          ...completeData,
          id: newNumericId,
          userId: 'guest',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setLocalGuestSubscriptions((prev) => [newSub, ...prev]);
        setSelectedSubscriptionId(newNumericId);
      }
    }
  };

  const handleDeleteSubscription = async (subId: string) => {
    // Optimistic UI update so the subscription disappears immediately
    setSubscriptions((prev) => prev.filter((s) => String(s.id) !== String(subId)));
    setLocalGuestSubscriptions((prev) => prev.filter((s) => String(s.id) !== String(subId)));

    if (user) {
      try {
        await deleteSubscription(user.uid, subId);
      } catch (err) {
        console.error('Error al eliminar suscripción de Firestore:', err);
      }
    }

    if (selectedSubForMembers && String(selectedSubForMembers.id) === String(subId)) {
      setIsMembersModalOpen(false);
      setSelectedSubForMembers(null);
    }
  };

  const handleToggleMemberPayment = async (
    subId: string,
    members: Member[],
    memberId: string
  ) => {
    if (user) {
      await toggleMemberPaymentStatus(user.uid, subId, members, memberId);
    } else {
      const nextStatusMap: Record<string, 'paid' | 'pending' | 'overdue'> = {
        pending: 'paid',
        paid: 'pending',
        overdue: 'paid',
      };
      setLocalGuestSubscriptions((prev) =>
        prev.map((s) => {
          if (String(s.id) === String(subId)) {
            const updated = s.members.map((m) => {
              if (String(m.id) === String(memberId)) {
                const next = nextStatusMap[m.paymentStatus] || 'paid';
                return {
                  ...m,
                  paymentStatus: next,
                  lastPaymentDate: next === 'paid' ? new Date().toISOString().split('T')[0] : m.lastPaymentDate,
                };
              }
              return m;
            });
            return { ...s, members: updated };
          }
          return s;
        })
      );
    }
  };

  const handleMarkAllPaid = async (subId: string, members: Member[]) => {
    if (user) {
      await markAllSubscriptionMembersAsPaid(user.uid, subId, members);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setLocalGuestSubscriptions((prev) =>
        prev.map((s) => {
          if (String(s.id) === String(subId)) {
            const updated = s.members.map((m) => ({
              ...m,
              paymentStatus: 'paid' as const,
              lastPaymentDate: today,
            }));
            return { ...s, members: updated };
          }
          return s;
        })
      );
    }
  };

  const handleUpdateSubscriptionMembersDeep = async (updatedSub: Subscription) => {
    // Optimistic local update
    setSubscriptions((prev) =>
      prev.map((s) => (String(s.id) === String(updatedSub.id) ? updatedSub : s))
    );
    setSelectedSubForMembers(updatedSub);

    if (user) {
      // Direct update of members in Firestore
      await updateSubscriptionMembers(user.uid, updatedSub.id, updatedSub.members || []);
    } else {
      setLocalGuestSubscriptions((prev) =>
        prev.map((s) => (String(s.id) === String(updatedSub.id) ? updatedSub : s))
      );
    }
  };

  const handleImportSubscriptions = async (
    importedList: Omit<Subscription, 'id' | 'userId'>[]
  ): Promise<number> => {
    if (user) {
      return await batchImportSubscriptions(user.uid, importedList);
    } else {
      const newItems: Subscription[] = importedList.map((item, idx) => ({
        ...item,
        id: `guest_import_${Date.now()}_${idx}`,
        userId: 'guest',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setLocalGuestSubscriptions((prev) => [...newItems, ...prev]);
      return newItems.length;
    }
  };

  const handleLoadSampleData = async () => {
    if (user) {
      const samples = getSampleSubscriptions(user.uid);
      await batchImportSubscriptions(user.uid, samples);
    } else {
      const samples = getSampleSubscriptions('guest').map((s, idx) => ({
        ...s,
        id: `guest_sample_${Date.now()}_${idx}`,
        userId: 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setLocalGuestSubscriptions(samples);
    }
  };

  // Keep modal subscription synced with current subscriptions list
  const currentSelectedSubForModal = useMemo(() => {
    if (!selectedSubForMembers) return null;
    const currentList = user ? subscriptions : localGuestSubscriptions;
    return currentList.find((s) => String(s.id) === String(selectedSubForMembers.id)) || selectedSubForMembers;
  }, [subscriptions, localGuestSubscriptions, selectedSubForMembers, user]);

  // Master Filter and Sort Logic
  const filteredSubscriptions = useMemo(() => {
    const activeList = user ? subscriptions : localGuestSubscriptions;

    return activeList
      .filter((sub) => {
        // Search Filter
        if (filters.search) {
          const query = filters.search.toLowerCase().trim();
          const nameMatch = (sub.platformName || sub.name || '').toLowerCase().includes(query);
          const categoryMatch = (sub.category || '').toLowerCase().includes(query);
          const notesMatch = (sub.notes || '').toLowerCase().includes(query);
          const userMatch = (sub.mainUserName || '').toLowerCase().includes(query);
          const memberMatch = (sub.members || []).some((m) =>
            (m.memberName || m.name || '').toLowerCase().includes(query) ||
            (m.sharingPlatform || m.platform || '').toLowerCase().includes(query)
          );

          if (!nameMatch && !categoryMatch && !notesMatch && !userMatch && !memberMatch) {
            return false;
          }
        }

        // Category Filter
        if (filters.category !== 'ALL') {
          if (sub.category !== filters.category) {
            return false;
          }
        }

        // Sharing Platform Filter
        if (filters.platform !== 'ALL') {
          const hasPlatformInSub = (sub.platformPricing || '').toLowerCase().includes(filters.platform.toLowerCase());
          const hasMemberWithPlatform = (sub.members || []).some(
            (m) =>
              (m.sharingPlatform || m.platform || '').toLowerCase() ===
              filters.platform.toLowerCase()
          );

          if (!hasPlatformInSub && !hasMemberWithPlatform) {
            return false;
          }
        }

        // Payment status filter
        if (filters.paymentStatus === 'has_pending') {
          const hasPending = (sub.members || []).some((m) => m.isPendingPayment);
          if (!hasPending) return false;
        } else if (filters.paymentStatus === 'has_overdue') {
          const hasOverdue = (sub.members || []).some((m) => m.paymentStatus === 'overdue');
          if (!hasOverdue) return false;
        } else if (filters.paymentStatus === 'all_paid') {
          const members = sub.members || [];
          if (members.length === 0) return false;
          const allPaid = members.every((m) => !m.isPendingPayment && m.paymentStatus === 'paid');
          if (!allPaid) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const nameA = (a.platformName || a.name || '').toLowerCase();
        const nameB = (b.platformName || b.name || '').toLowerCase();

        switch (filters.sortBy) {
          case 'name':
            return nameA.localeCompare(nameB);
          case 'name_desc':
            return nameB.localeCompare(nameA);
          case 'recent': {
            const timeA = new Date(a.createdAt || 0).getTime() || 0;
            const timeB = new Date(b.createdAt || 0).getTime() || 0;
            return timeB - timeA;
          }
          case 'cost_desc': {
            const costA = a.billingCycle === 'yearly' ? a.cost / 12 : a.cost;
            const costB = b.billingCycle === 'yearly' ? b.cost / 12 : b.cost;
            return costB - costA;
          }
          case 'cost_asc': {
            const costA = a.billingCycle === 'yearly' ? a.cost / 12 : a.cost;
            const costB = b.billingCycle === 'yearly' ? b.cost / 12 : b.cost;
            return costA - costB;
          }
          case 'savings_desc': {
            const incomeA = (a.members || []).reduce((sum, m) => sum + (m.contributionAmount ?? m.amount ?? 0), 0);
            const incomeB = (b.members || []).reduce((sum, m) => sum + (m.contributionAmount ?? m.amount ?? 0), 0);
            return incomeB - incomeA;
          }
          case 'renewal':
          default:
            return (a.billingDay || 1) - (b.billingDay || 1);
        }
      });
  }, [subscriptions, localGuestSubscriptions, user, filters]);

  // Active selected subscription for the right detail panel
  const activeSelectedSubscription = useMemo(() => {
    if (!filteredSubscriptions.length) return null;
    if (selectedSubscriptionId != null) {
      const found = filteredSubscriptions.find(
        (s) => String(s.id) === String(selectedSubscriptionId)
      );
      if (found) return found;
    }
    return filteredSubscriptions[0] || null;
  }, [filteredSubscriptions, selectedSubscriptionId]);

  const handleSelectSubscription = (subId: string) => {
    setSelectedSubscriptionId(subId);
    setShowMobileDetail(true);
  };

  const activeCount = user ? subscriptions.length : localGuestSubscriptions.length;
  const hasActiveFilters =
    filters.search !== '' ||
    filters.category !== 'ALL' ||
    filters.platform !== 'ALL' ||
    filters.paymentStatus !== 'ALL';

  return (
    <div className="min-h-screen bg-main text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        onNewSubscription={handleOpenNewSub}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        subscriptionsCount={activeCount}
        unreadNotificationsCount={unreadNotificationsCount}
        totalNotificationsCount={notifications.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Auth notice banner if not signed in */}
        {!user && (
          <div className="mb-6 p-4.5 rounded-2xl bg-card border border-border text-foreground shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Sincronización en la nube con Google Sign-In
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inicia sesión para guardar de forma permanente tus suscripciones en Cloud Firestore y acceder desde cualquier dispositivo.
                </p>
              </div>
            </div>
            <button
              id="btn-banner-signin"
              onClick={signIn}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-colors shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Conectar con Google</span>
            </button>
          </div>
        )}

        {/* Global errors */}
        {(authError || syncError) && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
            <span>{authError || syncError}</span>
            {authError && (
              <button
                onClick={clearAuthError}
                className="underline hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer"
              >
                Cerrar
              </button>
            )}
          </div>
        )}

        {/* Metrics Summary Header */}
        <div className="mb-6">
          <MetricsHeader
            subscriptions={user ? subscriptions : localGuestSubscriptions}
            onFilterPending={() =>
              setFilters((prev) => ({
                ...prev,
                paymentStatus: prev.paymentStatus === 'has_pending' ? 'ALL' : 'has_pending',
              }))
            }
          />
        </div>

        {/* Content Section */}
        {loadingData ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">
              Sincronizando suscripciones con Cloud Firestore...
            </p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClearFilters={() =>
              setFilters({
                search: '',
                category: 'ALL',
                platform: 'ALL',
                paymentStatus: 'ALL',
                sortBy: 'renewal',
              })
            }
            onNewSubscription={handleOpenNewSub}
          />
        ) : (
          <div>
            {/* Master - Detail 2 Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Subscriptions List */}
              <div className={`md:col-span-4 lg:col-span-4 ${showMobileDetail ? 'hidden md:block' : 'block'}`}>
                <SubscriptionMasterList
                  subscriptions={filteredSubscriptions}
                  selectedSubscriptionId={activeSelectedSubscription?.id || null}
                  onSelectSubscription={handleSelectSubscription}
                  filters={filters}
                  onChangeFilters={setFilters}
                  onNewSubscription={handleOpenNewSub}
                  totalCount={activeCount}
                />
              </div>

              {/* Right Column: Full Subscription Details View */}
              <div className={`md:col-span-8 lg:col-span-8 ${!showMobileDetail ? 'hidden md:block' : 'block'}`}>
                <SubscriptionDetailView
                  key={activeSelectedSubscription ? `sub-detail-${activeSelectedSubscription.id}-${activeSelectedSubscription.customImageUri || ''}-${activeSelectedSubscription.iconType || ''}` : 'sub-detail-empty'}
                  subscription={activeSelectedSubscription}
                  onEdit={handleEditSub}
                  onDelete={handleDeleteSubscription}
                  onManageMembers={handleManageMembers}
                  onToggleMemberPayment={handleToggleMemberPayment}
                  onMarkAllPaid={handleMarkAllPaid}
                  onUpdateSubscription={handleUpdateSubscriptionMembersDeep}
                  onBackToList={() => setShowMobileDetail(false)}
                  isMobile={showMobileDetail}
                />
              </div>
            </div>

            {/* Quick sample data seed */}
            {activeCount < 4 && (
              <div className="mt-8 p-4 rounded-2xl bg-card border border-border text-center flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    ¿Quieres ver un ejemplo con Netflix, Spotify, ChatGPT y co-suscriptores de Together Price, Sharesub y amigos?
                  </span>
                </div>
                <button
                  id="btn-load-sample-data"
                  onClick={handleLoadSampleData}
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Cargar datos de ejemplo
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12 text-center text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">Apleq</strong> · Gestor y optimizador de suscripciones compartidas
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          Soporte para Together Price, Sharesub, Sharingful, Spliiit, Gamsgo, Familia y Amigos.
        </p>
      </footer>

      {/* Modals */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false);
          setSubModalInitialData(null);
        }}
        onSave={handleSaveSubscription}
        onDelete={handleDeleteSubscription}
        initialData={subModalInitialData}
        subscriptionToEdit={subModalInitialData}
      />

      {currentSelectedSubForModal && (
        <MembersDetailModal
          isOpen={isMembersModalOpen}
          onClose={() => {
            setIsMembersModalOpen(false);
            setSelectedSubForMembers(null);
            setSelectedMemberIdForModal(null);
          }}
          subscription={currentSelectedSubForModal}
          onUpdateSubscription={handleUpdateSubscriptionMembersDeep}
          ownerName={user?.displayName || user?.email || undefined}
          initialMemberId={selectedMemberIdForModal}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        subscriptions={user ? subscriptions : localGuestSubscriptions}
        onImport={handleImportSubscriptions}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        subscriptions={activeSubscriptions}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onToggleRead={handleToggleNotificationRead}
        onOpenMemberDetail={(sub, memberId) => {
          setSelectedSubForMembers(sub);
          setSelectedMemberIdForModal(memberId);
          setIsMembersModalOpen(true);
        }}
        onMarkMemberPaid={handleMarkMemberPaidFromNotification}
        ownerName={user?.displayName || user?.email || undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <SharingPlatformsProvider>
            <SplitzyApp />
          </SharingPlatformsProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
