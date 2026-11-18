import { create } from "zustand";
import { getUnreadNotifications } from "@/lib/api/notifications";

/** Unread count for the account menu's "Notifications" badge. */
interface NotificationStore {
  unread: number;
  setUnread: (n: number) => void;
  refresh: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unread: 0,
  setUnread: (unread) => set({ unread: Math.max(0, unread) }),
  refresh: async () => {
    try {
      set({ unread: await getUnreadNotifications() });
    } catch {
      // Signed out or offline: keep what we have.
    }
  },
}));
