type YearlyStats = {
  [year: string]: number; // 예: { "2023": 12, "2024": 8 }
};

type MonthlyStats = {
  [yearMonth: string]: number; // 예: { "2024-08": 5, "2024-09": 3 }
};

type WeeklyStats = {
  [yearWeek: string]: number; // 예: { "2024-W32": 4, "2024-W33": 2 }
};

type DailyStats = {
  [date: string]: number; // 예: { "2024-08-08": 2, "2024-08-09": 1 }
};

type ReleaseStats = {
  yearly: YearlyStats;
  monthly: MonthlyStats;
  weekly: WeeklyStats;
  daily: DailyStats;
};

type ReleaseEntry = {
  repo: string;
  published_at: string;
  year: string;
  month: string;       // "2024-08"
  week: string;        // "2024-W32"
  day: string;         // "2024-08-08"
};

type ParsedReleases = ReleaseEntry[];

export interface ReleaseEntryDto {
  repo: string;
  published_at: string;
}
