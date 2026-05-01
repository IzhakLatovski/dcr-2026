import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import CommandPalette from "../CommandPalette/CommandPalette";
import type { SearchItem } from "../CommandPalette/CommandPalette";
import { Toaster, toast } from "sonner";
import { Check, X } from "lucide-react";
import FormsPage from "../FormsPage/FormsPage";
import GuidelinesPage from "../GuidelinesPage/GuidelinesPage";
import FaqPage from "../FaqPage/FaqPage";
import CatalogPage from "../CatalogPage/CatalogPage";
import ExtraPage from "../ExtraPage/ExtraPage";
import SimulatorPage from "../SimulatorPage/SimulatorPage";
import { TeamLeaderDashboard } from "../TeamLeaderDashboard/TeamLeaderDashboard";
import ProfilePage from "../ProfilePage/ProfilePage";
import {
  ProfileSetupModal,
  type ProfileSetupData,
} from "../ProfileSetupModal/ProfileSetupModal";
import { PendingApprovalPage } from "../PendingApprovalPage/PendingApprovalPage";
import HomePage from "../HomePage/HomePage";
import { getAllNavItems } from "../../data/navigation";
import { professionalism } from "../../data/catalog/professionalism";
import { tech } from "../../data/catalog/tech";
import { knowledge } from "../../data/catalog/knowledge";
import { collaboration } from "../../data/catalog/collaboration";
import { roadmaps } from "../../data/catalog/roadmaps";
import { useTheme } from "../../hooks/useTheme";
import { useSimulatorCart } from "../../hooks/useSimulatorCart";
import { useUserPlan } from "../../hooks/useUserPlan";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useAppConfig } from "../../hooks/useAppConfig";
import { computeCurrentCalendarQuarter } from "../../utils/quarterUtils";
import { QuarterProvider } from "../../contexts/QuarterContext";
import { useTeamMembers } from "../../hooks/useTeamMembers";
import { useLevelUpRequests } from "../../hooks/useLevelUpRequests";
import { usePlanHistory } from "../../hooks/usePlanHistory";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";
import type { AuthUser } from "../../hooks/useAuth";
import type { CatalogItem, RoadmapItem, UserDocument } from "../../data/types";
import { levels } from "../../data/levels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Search, Sun, Moon, LogOut, UserStar, Clock as ClockIcon, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function HeaderUser({
  user,
  userProfile,
  teamLeaderName,
  onSignIn,
  onSignOut,
}: {
  user: AuthUser | null;
  userProfile: UserDocument | null;
  teamLeaderName: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImgError(false);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={onSignIn}>
        <i className="ri-google-fill" />
        <span>Sign in</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={user.email}
        className="inline-flex size-9 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-primary outline-none transition-all duration-150 hover:ring-2 hover:ring-ring/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {user.photoURL && !imgError ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-sm font-semibold">{getInitials(user.displayName)}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="px-4 py-2 flex flex-col gap-1.5">
            {userProfile?.role === "team_leader" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserStar className="size-3.5" /> Team Leader
              </span>
            )}
            {userProfile?.role === "employee" &&
              userProfile?.approvalStatus === "approved" &&
              teamLeaderName && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserStar className="size-3.5" />
                  Reports to <strong className="text-foreground">{teamLeaderName}</strong>
                </span>
              )}
            {userProfile?.role === "employee" &&
              userProfile?.approvalStatus === "pending" && (
                <Badge variant="warning" size="sm" className="self-start">
                  <ClockIcon className="size-3" /> Awaiting approval
                </Badge>
              )}
            {userProfile?.role === "employee" &&
              userProfile?.approvalStatus === "rejected" && (
                <Badge variant="destructive" size="sm" className="self-start">
                  <XCircle className="size-3" /> Approval rejected
                </Badge>
              )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-2 border-t border-border px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function isRoadmapComplete(
  roadmap: RoadmapItem,
  satisfiedIds: Set<string>,
): boolean {
  if (!roadmap.requiredCerts?.length) return false;
  const seenGroups = new Set<string>();
  for (const cert of roadmap.requiredCerts) {
    if (cert.choiceGroup) {
      if (seenGroups.has(cert.choiceGroup)) continue;
      seenGroups.add(cert.choiceGroup);
      const groupSatisfied = roadmap.requiredCerts
        .filter((c) => c.choiceGroup === cert.choiceGroup)
        .some((c) => satisfiedIds.has(c.id));
      if (!groupSatisfied) return false;
    } else {
      if (!satisfiedIds.has(cert.id)) return false;
    }
  }
  return true;
}

export default function Layout() {
  const [activeId, setActiveId] = useState("home");
  const [activeLabel, setActiveLabel] = useState("Home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("dcr-sidebar-collapsed") === "true";
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const [focusItemId, setFocusItemId] = useState<number | null>(null);
  const [focusCatalogItemId, setFocusCatalogItemId] = useState<string | null>(
    null,
  );
  const [certBackNav, setCertBackNav] = useState<{
    id: string;
    label: string;
    openItemId?: string;
  } | null>(null);
  const [simulatorBackNav, setSimulatorBackNav] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const initialRoadmapCheckDone = useRef(false);
  const { theme, toggleTheme } = useTheme();
  const auth = useAuth();
  const userProfile = useUserProfile(auth.user);
  const simulatorCart = useSimulatorCart();
  const { activeQuarter, setActiveQuarter } = useAppConfig();
  const currentQuarter = activeQuarter ?? computeCurrentCalendarQuarter();
  const userPlan = useUserPlan(auth.user, currentQuarter);

  // Fetch team members for team leaders and admins (to show pending count in sidebar)
  const isTeamLeader = userProfile.profile?.role === "team_leader";
  const isAdmin = userProfile.profile?.role === "admin";
  const teamMembers = useTeamMembers(
    (isTeamLeader || isAdmin) && auth.user ? auth.user.email : null,
    isAdmin,
  );
  const { requests: levelUpRequests } = useLevelUpRequests(
    isAdmin && auth.user ? auth.user.uid : null,
    isAdmin,
  );
  const pendingLevelUpsCount = isAdmin
    ? levelUpRequests.filter((r) => r.status === "pending").length
    : 0;

  // Team leader name is stored directly in the user's profile document

  const notifications = useNotifications(auth.user?.email ?? null);

  const [isSimulatorMode, setIsSimulatorMode] = useState(() => {
    const saved = localStorage.getItem("dcr-simulator-mode");
    return saved ? saved === "true" : true; // Default to simulator mode
  });
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Unified cart interface - switches between simulator and real plan based on mode
  const useRealPlan = !isSimulatorMode && !!auth.user;
  const cart = useRealPlan ? userPlan : simulatorCart;

  // Plan history — used to compute carryover points for the real plan
  const { planHistory } = usePlanHistory(
    useRealPlan ? (auth.user?.email ?? null) : null,
  );

  // Carryover points: surplus from last approved plan (or pre-system bonus if no approved plans yet)
  const carryOverPoints = (() => {
    if (!useRealPlan) return 0;
    const lastApproved = [...planHistory]
      .filter((e) => e.status === "approved" && e.levelAchieved != null)
      .sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
    if (lastApproved && lastApproved.levelAchieved != null) {
      const lvl = levels.find((l) => l.id === lastApproved.levelAchieved);
      return Math.max(0, lastApproved.totalPoints - (lvl?.points ?? 0));
    }
    return userProfile.profile?.preSystemPoints ?? 0;
  })();
  const carryOverLabel = (() => {
    if (!useRealPlan || carryOverPoints === 0) return undefined;
    const lastApproved = [...planHistory]
      .filter((e) => e.status === "approved" && e.levelAchieved != null)
      .sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
    return lastApproved
      ? `Carryover from ${lastApproved.quarter}`
      : "Previous level points";
  })();

  const showToast = useCallback((text: string, type: "added" | "removed") => {
    toast(text, {
      icon:
        type === "added" ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <X className="size-4 text-muted-foreground" />
        ),
    });
  }, []);

  // Show a toast whenever a new notification arrives
  useEffect(() => {
    if (notifications.latestNew) {
      showToast(notifications.latestNew.message, "added");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.latestNew]);

  const handleAddAllRequired = useCallback(async () => {
    const requiredItems = professionalism.filter((item) => item.required);
    const toAdd = requiredItems.filter((item) => !cart.isInCart(item.id));
    try {
      for (const item of toAdd) {
        await cart.addItem(item);
      }
      if (toAdd.length > 0) {
        showToast(
          `Added ${toAdd.length} required item${toAdd.length > 1 ? "s" : ""}`,
          "added",
        );
      }
    } catch (err) {
      console.error("Failed to add required items:", err);
      showToast("Failed to add items", "removed");
    }
  }, [cart, showToast]);

  const handleAddMissingItems = useCallback(
    async (items: CatalogItem[]) => {
      const toAdd = items.filter((item) => !cart.isInCart(item.id));
      try {
        for (const item of toAdd) {
          await cart.addItem(item);
        }
        if (toAdd.length > 0) {
          showToast(
            `Added ${toAdd.length} missing item${toAdd.length > 1 ? "s" : ""}`,
            "added",
          );
        }
      } catch (err) {
        console.error("Failed to add missing items:", err);
        showToast("Failed to add items", "removed");
      }
    },
    [cart, showToast],
  );

  const handleSignIn = useCallback(async () => {
    await auth.signInWithGoogle();
    // Error handling is done by the useEffect that watches auth.error
  }, [auth]);

  const handleSignOut = useCallback(async () => {
    await auth.signOut();
    showToast("Signed out successfully", "added");
  }, [auth, showToast]);

  const handleToggleMode = useCallback(() => {
    // If switching to Real Plan, check if profile is set up
    if (isSimulatorMode && auth.user) {
      const profile = userProfile.profile;
      const isUserTeamLeader = profile?.role === "team_leader";

      if (isUserTeamLeader) {
        // Team leader needs to complete profile setup first
        if (profile?.approvalStatus !== 'approved') {
          setShowProfileSetup(true);
          return;
        }
      } else {
        // Employee: hasn't selected a team leader yet → show setup
        if (!profile?.teamLeaderId) {
          setShowProfileSetup(true);
          return;
        }
        // Employee pending approval → switch to real plan and navigate to plan page,
        // which will render PendingApprovalPage automatically
        if (profile?.approvalStatus !== "approved") {
          setIsSimulatorMode(false);
          setActiveId("simulator");
          setActiveLabel("My Plan");
          showToast("Switched to Real Plan mode", "added");
          return;
        }
      }
    }

    setIsSimulatorMode((prev) => !prev);
    showToast(
      !isSimulatorMode
        ? "Switched to Simulator mode"
        : "Switched to Real Plan mode",
      "added",
    );
  }, [isSimulatorMode, showToast, auth.user, userProfile.profile]);

  const handleProfileSetupComplete = useCallback(
    async (data: ProfileSetupData) => {
      if (!auth.user) return;

      const isUserTeamLeader = userProfile.profile?.role === "team_leader";
      const now = new Date().toISOString();

      try {
        const achievedField = {
          items: data.achievements.map((a) => ({
            itemId: a.itemId,
            item: a.item,
            completionDate: a.completionDate,
            proofLink: a.proofLink,
            notes: a.notes || "",
            status: "pending" as const,
          })),
          lastUpdated: now,
        };

        if (isUserTeamLeader) {
          await userProfile.updateProfile({
            currentLevel: data.currentLevel,
            approvalStatus: "approved",
            approvedAt: now,
            achieved: achievedField,
            ...(data.preSystemPoints != null
              ? { preSystemPoints: data.preSystemPoints }
              : {}),
          });
        } else {
          await userProfile.updateProfile({
            teamLeaderId: data.teamLeaderId,
            teamLeaderName: data.teamLeaderName ?? null,
            currentLevel: data.currentLevel,
            approvalStatus: "pending",
            pendingApprovalType: "initial",
            achieved: achievedField,
            ...(data.preSystemPoints != null
              ? { preSystemPoints: data.preSystemPoints }
              : {}),
          });
        }

        console.log(
          "[Layout] Saved profile with achieved items:",
          data.achievements.length,
        );
        setShowProfileSetup(false);

        const achievementSuffix =
          data.achievements.length > 0
            ? ` with ${data.achievements.length} achievement${data.achievements.length !== 1 ? "s" : ""}`
            : "";

        showToast(
          isUserTeamLeader
            ? `Profile saved${achievementSuffix}`
            : `Profile submitted for approval${achievementSuffix}`,
          "added",
        );
      } catch (err) {
        console.error("[Layout] Error setting up profile:", err);
        throw err; // Let ProfileSetupModal handle the error
      }
    },
    [auth.user, userProfile, showToast],
  );

  const handleProfileSetupCancel = useCallback(() => {
    setShowProfileSetup(false);
    if (!isTeamLeader) {
      showToast("Switched back to Simulator mode", "added");
    }
  }, [showToast, isTeamLeader]);

  const handleUseSimulator = useCallback(() => {
    setIsSimulatorMode(true);
  }, []);

  // Show auth error toast
  useEffect(() => {
    if (auth.error) {
      showToast(auth.error, "removed");
      auth.clearError();
    }
  }, [auth.error, auth.clearError, showToast]);

  // Show userPlan error toast
  useEffect(() => {
    if (userPlan.error) {
      showToast(userPlan.error, "removed");
    }
  }, [userPlan.error, showToast]);

  // Auto-show profile setup for team leaders who haven't completed setup yet
  useEffect(() => {
    if (
      auth.user &&
      !userProfile.isLoading &&
      userProfile.profile?.role === "team_leader" &&
      userProfile.profile?.approvalStatus !== "approved"
    ) {
      setShowProfileSetup(true);
    }
  }, [
    auth.user,
    userProfile.isLoading,
    userProfile.profile?.role,
    userProfile.profile?.approvalStatus,
  ]);

  // Auto-show profile setup for new employees who haven't selected a team leader yet
  useEffect(() => {
    if (
      auth.user &&
      !userProfile.isLoading &&
      userProfile.profile?.role === "employee" &&
      !userProfile.profile?.teamLeaderId
    ) {
      setShowProfileSetup(true);
    }
  }, [
    auth.user,
    userProfile.isLoading,
    userProfile.profile?.role,
    userProfile.profile?.teamLeaderId,
  ]);

  const catalogData: Record<string, CatalogItem[]> = {
    professionalism,
    tech,
    "knowledge-unlock": knowledge,
    collaboration,
    roadmaps,
  };

  // Set of approved achieved item IDs — only relevant in real plan mode for approved employees
  const achievedItemIds =
    useRealPlan && userProfile.profile?.approvalStatus === "approved"
      ? new Set(
          (userProfile.profile?.achieved?.items ?? [])
            .filter((a) => a.status === "approved")
            .map((a) => a.itemId),
        )
      : null;

  // All profile-setup achievements (any status) — used for roadmap completion checks
  const pastAchievedIds = new Set(
    (userProfile.profile?.achieved?.items ?? []).map((a) => a.itemId),
  );

  const isAchieved = achievedItemIds
    ? (itemId: string) => achievedItemIds.has(itemId)
    : undefined;

  const autoAddCompletedRoadmaps = useCallback(
    async (extraSatisfiedId?: string) => {
      const satisfiedIds = new Set([
        ...cart.items.map((i) => i.id),
        ...(extraSatisfiedId ? [extraSatisfiedId] : []),
        ...pastAchievedIds,
      ]);
      const toAutoAdd = (roadmaps as RoadmapItem[]).filter(
        (r) =>
          !cart.isInCart(r.id) &&
          !achievedItemIds?.has(r.id) &&
          isRoadmapComplete(r, satisfiedIds),
      );
      for (const roadmap of toAutoAdd) {
        await cart.addItem(roadmap);
        showToast(`Roadmap unlocked: ${roadmap.name}`, "added");
      }
    },
    [cart, pastAchievedIds, achievedItemIds, showToast],
  );

  // Cascade-remove circles and roadmaps that depend on a cert being removed.
  // Call BEFORE the primary removal so we can read current cart state accurately.
  const autoRemoveDependents = useCallback(
    async (removedItemId: string) => {
      // Circle items tied to this cert
      const circleItems = cart.items.filter((i) =>
        i.id.startsWith(`extra-circle-${removedItemId}-`),
      );

      // Build the set of IDs that will remain after all removals
      const removedIds = new Set([
        removedItemId,
        ...circleItems.map((i) => i.id),
      ]);
      const remainingIds = new Set([
        ...cart.items.map((i) => i.id).filter((id) => !removedIds.has(id)),
        ...pastAchievedIds,
      ]);

      // Roadmaps currently in cart whose requirements will no longer be met
      const roadmapsToRemove = (roadmaps as RoadmapItem[]).filter(
        (r) =>
          cart.isInCart(r.id) &&
          !removedIds.has(r.id) &&
          !isRoadmapComplete(r, remainingIds),
      );

      for (const circle of circleItems) {
        await cart.removeItem(circle.id);
        showToast(`Removed ${circle.name}`, "removed");
      }
      for (const roadmap of roadmapsToRemove) {
        await cart.removeItem(roadmap.id);
        showToast(`Roadmap removed: ${roadmap.name}`, "removed");
      }
    },
    [cart, pastAchievedIds, showToast],
  );

  const handleToggleItem = useCallback(
    async (item: CatalogItem) => {
      const wasInCart = cart.isInCart(item.id);
      try {
        if (wasInCart && item.category !== "roadmaps") {
          await autoRemoveDependents(item.id);
        }
        await cart.toggleItem(item);
        showToast(
          wasInCart ? `Removed ${item.name}` : `Added ${item.name}`,
          wasInCart ? "removed" : "added",
        );
        if (!wasInCart && item.category !== "roadmaps") {
          await autoAddCompletedRoadmaps(item.id);
        }
      } catch (err) {
        console.error("Failed to toggle item:", err);
        showToast("Failed to update cart", "removed");
      }
    },
    [cart, showToast, autoAddCompletedRoadmaps, autoRemoveDependents],
  );

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      const isLastInstance =
        cart.items.filter((i) => i.id === itemId).length === 1;
      if (isLastInstance) {
        await autoRemoveDependents(itemId);
      }
      await cart.removeItem(itemId);
    },
    [cart, autoRemoveDependents],
  );

  // Per-item plan status — only relevant in real plan mode; drives purple/amber visual states
  const getPlanItemStatus = useRealPlan
    ? (itemId: string): "pending" | "approved" | undefined => {
        if (!cart.isInCart(itemId)) return undefined;
        if (userPlan.planStatus === "pending") return "pending";
        if (userPlan.planStatus === "approved") return "approved";
        return undefined;
      }
    : undefined;

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("dcr-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // Persist simulator mode
  useEffect(() => {
    localStorage.setItem("dcr-simulator-mode", String(isSimulatorMode));
  }, [isSimulatorMode]);

  // Auto-add roadmaps when past achievements already satisfy all requirements on first load
  useEffect(() => {
    if (initialRoadmapCheckDone.current) return;
    if (userPlan.isLoading || userProfile.isLoading) return;
    if (!useRealPlan) return;
    if (pastAchievedIds.size === 0) return;
    initialRoadmapCheckDone.current = true;
    void autoAddCompletedRoadmaps();
  }, [
    useRealPlan,
    userPlan.isLoading,
    userProfile.isLoading,
    pastAchievedIds.size,
    autoAddCompletedRoadmaps,
  ]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleNavigate = useCallback((id: string, label: string) => {
    setActiveId(id);
    setActiveLabel(label);
    setCertBackNav(null);
    setSimulatorBackNav(false);

    // Scroll content area to top
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    // Trigger page transition animation
    setPageTransition(true);
    setTimeout(() => setPageTransition(false), 300);
  }, []);

  const handleNavigateToCert = useCallback(
    (certId: string, roadmapId: string, roadmapName: string) => {
      handleNavigate("tech", "Tech");
      setFocusCatalogItemId(certId);
      setCertBackNav({
        id: "roadmaps",
        label: roadmapName,
        openItemId: roadmapId,
      });
    },
    [handleNavigate],
  );

  const profile = userProfile.profile;
  const teamLeaderName = profile?.teamLeaderName ?? null;

  // True when a pending employee is viewing the app in real plan mode
  const isPendingInRealPlan =
    useRealPlan &&
    profile?.role === "employee" &&
    profile?.approvalStatus !== "approved" &&
    !!profile?.teamLeaderId;

  return (
    <QuarterProvider
      currentQuarter={currentQuarter}
      isFrozen={activeQuarter !== null}
      activeQuarter={activeQuarter}
      setActiveQuarter={setActiveQuarter}
    >
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <Sidebar
        activeId={activeId}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        cartTotalItems={cart.totalItems}
        cartTotalPoints={cart.totalPoints}
        user={auth.user}
        isSimulatorMode={isSimulatorMode}
        onToggleMode={handleToggleMode}
        userRole={userProfile.profile?.role}
        pendingTeamCount={teamMembers.pendingCount + pendingLevelUpsCount}
        unreadNotifications={notifications.unreadCount}
        onNotificationsClick={() => notifications.markAllAsRead()}
      />
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="shrink-0 border-b border-border bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {activeLabel}
            </h2>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 pl-3 pr-1.5 h-9 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Search className="size-4" />
                <span>Search</span>
                <kbd className="inline-flex items-center rounded-md border border-border bg-card px-1.5 py-0.5 text-[0.6rem] font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>
              <HeaderUser
                user={auth.user}
                userProfile={userProfile.profile}
                teamLeaderName={teamLeaderName}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </header>
        <div
          className={cn(
            "flex-1 min-h-0 overflow-hidden transition-opacity duration-200",
            pageTransition && "opacity-0",
          )}
          ref={contentRef}
        >
          {activeId === "home" && (
            <HomePage
              user={auth.user}
              profile={profile}
              cartItems={cart.items}
              cartTotalPoints={cart.totalPoints}
              planStatus={useRealPlan ? userPlan.planStatus : undefined}
              isSimulatorMode={isSimulatorMode}
              useRealPlan={useRealPlan}
              carryOverPoints={carryOverPoints}
              onNavigate={handleNavigate}
            />
          )}
          {activeId === "guidelines" && (
            <GuidelinesPage
              focusId={focusItemId}
              onFocusConsumed={() => setFocusItemId(null)}
            />
          )}
          {activeId === "faq" && (
            <FaqPage
              focusId={focusItemId}
              onFocusConsumed={() => setFocusItemId(null)}
            />
          )}
          {activeId === "forms" && <FormsPage />}
          {activeId in catalogData &&
            (isPendingInRealPlan ? (
              <PendingApprovalPage
                teamLeaderId={profile!.teamLeaderId!}
                requestDate={profile!.createdAt}
                onChangeTeamLeader={() => setShowProfileSetup(true)}
                onUseSimulator={handleUseSimulator}
              />
            ) : (
              <CatalogPage
                items={catalogData[activeId]}
                onToggleItem={handleToggleItem}
                isInCart={cart.isInCart}
                getQuantity={cart.getQuantity}
                onAddItem={cart.addItem}
                onRemoveItem={handleRemoveItem}
                isAchieved={activeId === "tech" ? isAchieved : undefined}
                getPlanItemStatus={getPlanItemStatus}
                onAddAllRequired={
                  activeId === "professionalism"
                    ? handleAddAllRequired
                    : undefined
                }
                hasRequired={activeId === "professionalism"}
                openItemId={focusCatalogItemId}
                onOpenItemConsumed={() => setFocusCatalogItemId(null)}
                onNavigateToCert={
                  activeId === "roadmaps" ? handleNavigateToCert : undefined
                }
                modalBackNav={
                  certBackNav
                    ? {
                        label: certBackNav.label,
                        onClick: () => {
                          const nav = certBackNav;
                          handleNavigate(nav.id, "Roadmaps");
                          if (nav.openItemId)
                            setFocusCatalogItemId(nav.openItemId);
                        },
                      }
                    : simulatorBackNav
                      ? {
                          label: "Plan",
                          onClick: () => handleNavigate("simulator", "Plan"),
                        }
                      : undefined
                }
                authUser={auth.user}
              />
            ))}
          {activeId === "simulator" &&
            (isPendingInRealPlan ? (
              <PendingApprovalPage
                teamLeaderId={profile!.teamLeaderId!}
                requestDate={profile!.createdAt}
                onChangeTeamLeader={() => setShowProfileSetup(true)}
                onUseSimulator={handleUseSimulator}
              />
            ) : (
              <SimulatorPage
                items={cart.items}
                totalPoints={cart.totalPoints}
                totalItems={cart.totalItems}
                onRemoveItem={handleRemoveItem}
                onClearAll={cart.clearAll}
                onAddMissingItems={handleAddMissingItems}
                onOpenItem={(item) => {
                  const CATEGORY_NAV: Record<
                    string,
                    { id: string; label: string }
                  > = {
                    tech: { id: "tech", label: "Tech" },
                    roadmaps: { id: "roadmaps", label: "Roadmaps" },
                    professionalism: {
                      id: "professionalism",
                      label: "Professionalism",
                    },
                    "knowledge-unlock": {
                      id: "knowledge-unlock",
                      label: "Knowledge Unlock",
                    },
                    collaboration: {
                      id: "collaboration",
                      label: "Collaboration",
                    },
                    extra: { id: "extra", label: "Extra" },
                  };
                  const nav = CATEGORY_NAV[item.category] ?? {
                    id: "tech",
                    label: "Tech",
                  };
                  handleNavigate(nav.id, nav.label);
                  setSimulatorBackNav(true);
                  setFocusCatalogItemId(item.id);
                }}
                selectedLevelId={
                  useRealPlan ? userPlan.selectedLevelId : undefined
                }
                onSetSelectedLevel={
                  useRealPlan ? userPlan.setSelectedLevel : undefined
                }
                currentLevel={
                  useRealPlan ? (profile?.currentLevel ?? null) : undefined
                }
                planStatus={useRealPlan ? userPlan.planStatus : undefined}
                planSubmittedAt={
                  useRealPlan ? userPlan.planSubmittedAt : undefined
                }
                planRejectionReason={
                  useRealPlan ? userPlan.planRejectionReason : undefined
                }
                onSubmitPlan={
                  useRealPlan
                    ? async () => {
                        await userPlan.submitPlan(carryOverPoints);
                        showToast(
                          "Plan submitted for team leader approval",
                          "added",
                        );
                      }
                    : undefined
                }
                onWithdrawPlan={
                  useRealPlan
                    ? async () => {
                        await userPlan.withdrawPlan();
                        showToast("Plan submission withdrawn", "removed");
                      }
                    : undefined
                }
                onWithdrawApproval={
                  useRealPlan
                    ? async () => {
                        await userPlan.withdrawApproval();
                        showToast(
                          "Plan approval withdrawn — back to draft",
                          "removed",
                        );
                      }
                    : undefined
                }
                proofEntries={useRealPlan ? userPlan.proofEntries : undefined}
                onAddProof={useRealPlan ? userPlan.addProof : undefined}
                onDeleteProof={useRealPlan ? userPlan.deleteProof : undefined}
                onUploadFileProof={
                  useRealPlan ? userPlan.uploadFileProof : undefined
                }
                uploadingItemIds={
                  useRealPlan ? userPlan.uploadingItemIds : undefined
                }
                completedItemKeys={
                  useRealPlan ? userPlan.completedItemKeys : undefined
                }
                completionStatus={
                  useRealPlan ? userPlan.completionStatus : undefined
                }
                completionSubmittedAt={
                  useRealPlan ? userPlan.completionSubmittedAt : undefined
                }
                completionRejectionReason={
                  useRealPlan ? userPlan.completionRejectionReason : undefined
                }
                completionRequirementsMet={
                  useRealPlan ? userPlan.completionRequirementsMet : undefined
                }
                completionShortfalls={
                  useRealPlan ? userPlan.completionShortfalls : undefined
                }
                onToggleItemComplete={
                  useRealPlan ? userPlan.toggleItemComplete : undefined
                }
                onSubmitCompletedPlan={
                  useRealPlan
                    ? async () => {
                        await userPlan.submitCompletedPlan();
                        showToast(
                          "Completed plan sent for level-up review",
                          "added",
                        );
                      }
                    : undefined
                }
                onWithdrawCompletedPlan={
                  useRealPlan
                    ? async () => {
                        await userPlan.withdrawCompletedPlan();
                        showToast(
                          "Level-up review submission withdrawn",
                          "removed",
                        );
                      }
                    : undefined
                }
                carryOverPoints={
                  carryOverPoints > 0 ? carryOverPoints : undefined
                }
                carryOverLabel={carryOverLabel}
                carriedItems={useRealPlan ? userPlan.carriedItems : undefined}
                carriedFromQuarter={
                  useRealPlan ? userPlan.carriedFromQuarter : undefined
                }
              />
            ))}
          {activeId === "my-profile" && (
            <ProfilePage
              profile={userProfile.profile}
              user={auth.user}
              planStatus={useRealPlan ? userPlan.planStatus : undefined}
              planItems={useRealPlan ? userPlan.items : undefined}
              planTotalPoints={useRealPlan ? userPlan.totalPoints : undefined}
              planSelectedLevelId={
                useRealPlan ? userPlan.selectedLevelId : undefined
              }
              planSubmittedAt={
                useRealPlan ? userPlan.planSubmittedAt : undefined
              }
              planRejectionReason={
                useRealPlan ? userPlan.planRejectionReason : undefined
              }
              planCarryOverPoints={useRealPlan ? carryOverPoints : undefined}
              planCarryOverLabel={useRealPlan ? carryOverLabel : undefined}
              onNavigate={setActiveId}
            />
          )}
          {activeId === "team-dashboard" &&
            auth.user &&
            (profile?.role === "team_leader" || profile?.role === "admin") && (
              <TeamLeaderDashboard
                userId={auth.user.email}
                userDisplayName={profile?.displayName ?? ""}
                userEmail={auth.user.email ?? ""}
                isAdmin={profile?.role === "admin"}
              />
            )}
          {activeId === "extra" && (
            <ExtraPage
              onAddItem={cart.addItem}
              onToggleItem={handleToggleItem}
              isInCart={cart.isInCart}
              certItems={tech}
            />
          )}
        </div>
      </main>
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={(item: SearchItem) => {
          const navItems = getAllNavItems();
          const navItem = navItems.find((n) => n.id === item.pageId);
          const label = navItem?.label ?? item.label;
          handleNavigate(item.pageId, label);
          if (item.subId != null) {
            setFocusItemId(item.subId);
          }
          if (item.catalogItemId != null) {
            setFocusCatalogItemId(item.catalogItemId);
          }
          setPaletteOpen(false);
        }}
      />
      <Toaster position="bottom-right" />
      {showProfileSetup && (
        <ProfileSetupModal
          onComplete={handleProfileSetupComplete}
          onCancel={handleProfileSetupCancel}
          isTeamLeader={isTeamLeader}
          userId={auth.user?.email}
        />
      )}
    </div>
    </QuarterProvider>
  );
}
