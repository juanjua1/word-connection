export interface UserStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  weeklyTrend: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface DailyActivity {
  date: string;
  created: number;
  completed: number;
  productivity: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  users: Array<{
    userId: string;
    userName: string;
    stats: UserStats;
  }>;
  totalTasks: number;
  completedTasks: number;
  teamProductivity: number;
}

export interface AnalyticsData {
  personalStats: UserStats;
  categoryStats: CategoryStats[];
  dailyActivity: DailyActivity[];
  teamStats?: TeamStats;
  selectedUserStats?: UserStats;
}

export interface SavedTeam {
  id: string;
  name: string;
  userIds: string[];
  createdBy: string;
  createdAt: string;
}

export type TimeFrame = 'week' | 'month' | 'quarter';
