export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  stage: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
  score: number;
  source: string;
  value: number;
  createdTime: string;
  avatarColor: string;
  assignedTo?: string;
}

export interface AssignmentRule {
  id: string;
  source: string;
  assigneeName: string;
  isActive: boolean;
}

export interface Campaign {
  platform: string;
  status: "Active" | "Paused" | "Disconnected";
  impressions: number;
  clicks: number;
  ctr: number;
  spent: number;
  conversions: number;
  roi: number;
}

export interface Activity {
  id: string;
  type: "lead" | "email" | "deal" | "task" | "system";
  message: string;
  timestamp: string;
  user?: string;
}

export interface EmailStep {
  step: number;
  subject: string;
  delay: string;
  body: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  trigger: string;
  status: string;
  steps: EmailStep[];
}

export interface MaintenanceStatus {
  lastRun: string;
  health: string;
  totalFixes: number;
  activeOptimization: string;
  benchmarkSyncTime: string;
  industryBenchmarks: {
    averageCpc: number;
    averageCtr: number;
    topTrafficSource: string;
    marketGrowthRate: string;
  };
}
