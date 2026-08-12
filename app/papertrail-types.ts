export type ReadingStatus = "to-read" | "reading" | "completed";

export type Paper = {
  id: number; title: string; authors: string; year: string; section: string; venue: string;
  url: string; status: ReadingStatus; remarks: string; keyTakeaways: string; limitations: string;
  connections: string; tags: string; focusThisWeek: number; isRead: number; createdAt?: string; updatedAt?: string; completedAt?: string | null;
};

export type PaperForm = Omit<Paper, "id" | "isRead" | "createdAt" | "updatedAt" | "completedAt">;

export const statusLabels: Record<ReadingStatus, string> = { "to-read": "To Read", reading: "Reading", completed: "Completed" };
export const statusIcons: Record<ReadingStatus, string> = { "to-read": "○", reading: "◐", completed: "✓" };
