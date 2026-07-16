import { User, LeaveRequest, LeaveType, LeaveBalance, Department, Holiday } from '@prisma/client';

export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export type UserWithDepartmentAndManager = User & {
  department: Department | null;
  manager: { id: string; name: string; email: string } | null;
};

export type LeaveRequestWithRelations = LeaveRequest & {
  user: { id: string; name: string; email: string; avatar: string | null; role: string };
  leaveType: LeaveType;
  approver: { id: string; name: string } | null;
};

export type LeaveBalanceWithType = LeaveBalance & {
  leaveType: LeaveType;
};

export type DashboardStats = {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  leaveTypeBalances: {
    name: string;
    allocated: number;
    used: number;
    pending: number;
    color: string;
  }[];
  recentRequests: LeaveRequestWithRelations[];
  upcomingHolidays: Holiday[];
};

export type ManagerDashboardStats = {
  pendingApprovals: number;
  teamSize: number;
  onLeaveToday: number;
  teamRequests: LeaveRequestWithRelations[];
  recentTeamRequests: LeaveRequestWithRelations[];
};

export type HRDashboardStats = {
  activeEmployees: number;
  activeLeaveRequests: number;
  onLeaveToday: number;
  leaveTypeDistribution: { name: string; count: number; color: string }[];
};
