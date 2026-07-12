import { PrismaClient, UserRole, LeaveStatus, DayType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.leaveType.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 12);

  // 1. Create Departments
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
      description: 'Software development, infrastructure, and engineering operations',
    },
  });

  const product = await prisma.department.create({
    data: {
      name: 'Product & Design',
      description: 'Product management and user experience design',
    },
  });

  const hr = await prisma.department.create({
    data: {
      name: 'Human Resources',
      description: 'Talent acquisition, operations, and culture',
    },
  });

  // 2. Create Leave Types
  const annualLeave = await prisma.leaveType.create({
    data: {
      name: 'Annual Leave',
      description: 'Paid vacation time accrued yearly',
      defaultDaysPerYear: 20,
      maxCarryOver: 5,
      requiresApproval: true,
      requiresDocument: false,
      color: '#4F46E5', // Indigo
    },
  });

  const sickLeave = await prisma.leaveType.create({
    data: {
      name: 'Sick Leave',
      description: 'Paid time off for medical rest or illness',
      defaultDaysPerYear: 12,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: true,
      color: '#F43F5E', // Rose
    },
  });

  const casualLeave = await prisma.leaveType.create({
    data: {
      name: 'Casual Leave',
      description: 'Paid time off for unplanned personal matters',
      defaultDaysPerYear: 5,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: false,
      color: '#8B5CF6', // Violet
    },
  });

  const wfh = await prisma.leaveType.create({
    data: {
      name: 'Work From Home',
      description: 'Remote work tracking',
      defaultDaysPerYear: 365,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: false,
      isPaid: true,
      color: '#06B6D4', // Cyan
    },
  });

  const unpaidLeave = await prisma.leaveType.create({
    data: {
      name: 'Unpaid Leave',
      description: 'Unpaid time off after exhausting balances',
      defaultDaysPerYear: 30,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: false,
      isPaid: false,
      color: '#64748B', // Slate
    },
  });

  // 3. Create Users (CEO, HR Admin, Manager, Employee)
  const ceo = await prisma.user.create({
    data: {
      email: 'ceo@leaveledger.com',
      name: 'Charles CEO',
      password: passwordHash,
      role: UserRole.CEO,
      phone: '+15550100300',
    },
  });

  const hrAdmin = await prisma.user.create({
    data: {
      email: 'admin@leaveledger.com',
      name: 'Sarah HR Admin',
      password: passwordHash,
      role: UserRole.ADMIN,
      departmentId: hr.id,
      managerId: ceo.id,
      phone: '+15550100200',
    },
  });

  // Update HR department with head
  await prisma.department.update({
    where: { id: hr.id },
    data: { headId: hrAdmin.id },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@leaveledger.com',
      name: 'David Manager',
      password: passwordHash,
      role: UserRole.MANAGER,
      departmentId: engineering.id,
      managerId: hrAdmin.id,
      phone: '+15550100201',
    },
  });

  // Update Engineering department with head
  await prisma.department.update({
    where: { id: engineering.id },
    data: { headId: manager.id },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'demo@leaveledger.com',
      name: 'Alex Employee',
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      departmentId: engineering.id,
      managerId: manager.id,
      phone: '+15550100202',
    },
  });

  // 4. Set Leave Balances for all users
  const users = [ceo, hrAdmin, manager, employee];
  const leaveTypesList = [annualLeave, sickLeave, casualLeave, wfh, unpaidLeave];

  for (const u of users) {
    for (const lt of leaveTypesList) {
      await prisma.leaveBalance.create({
        data: {
          userId: u.id,
          leaveTypeId: lt.id,
          year: 2026,
          allocated: lt.defaultDaysPerYear,
          used: 0,
          pending: 0,
          carriedOver: 0,
        },
      });
    }
  }

  // 5. Create Holidays
  const holidays = [
    { name: 'New Year\'s Day', date: new Date('2026-01-01'), year: 2026 },
    { name: 'Republic Day', date: new Date('2026-01-26'), year: 2026 },
    { name: 'Good Friday', date: new Date('2026-04-03'), year: 2026 },
    { name: 'Labor Day', date: new Date('2026-05-01'), year: 2026 },
    { name: 'Independence Day', date: new Date('2026-08-15'), year: 2026 },
    { name: 'Christmas Day', date: new Date('2026-12-25'), year: 2026 },
  ];

  for (const h of holidays) {
    await prisma.holiday.create({
      data: {
        name: h.name,
        date: h.date,
        year: h.year,
        isOptional: false,
        description: 'National public holiday',
      },
    });
  }

  // 6. Create some sample Leave Requests
  const today = new Date();
  
  // Past Approved Leave Request
  const pastStart = new Date(today);
  pastStart.setDate(today.getDate() - 15);
  const pastEnd = new Date(today);
  pastEnd.setDate(today.getDate() - 13);
  
  const approvedRequest = await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveTypeId: annualLeave.id,
      startDate: pastStart,
      endDate: pastEnd,
      totalDays: 3,
      dayType: DayType.FULL_DAY,
      reason: 'Family trip to Yosemite national park.',
      status: LeaveStatus.APPROVED,
      approverId: manager.id,
      approverNote: 'Have fun and make sure files are handed off!',
      reviewedAt: new Date(pastStart.getTime() - 86400000 * 2),
    },
  });

  // Deduct from balance
  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: employee.id,
        leaveTypeId: annualLeave.id,
        year: 2026,
      },
    },
    data: {
      used: 3,
    },
  });

  // Pending Leave Request
  const futureStart = new Date(today);
  futureStart.setDate(today.getDate() + 10);
  const futureEnd = new Date(today);
  futureEnd.setDate(today.getDate() + 11);

  const pendingRequest = await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveTypeId: casualLeave.id,
      startDate: futureStart,
      endDate: futureEnd,
      totalDays: 2,
      dayType: DayType.FULL_DAY,
      reason: 'Attending cousin\'s wedding ceremony.',
      status: LeaveStatus.PENDING,
    },
  });

  // Add to pending balance
  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: employee.id,
        leaveTypeId: casualLeave.id,
        year: 2026,
      },
    },
    data: {
      pending: 2,
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: manager.id,
      title: 'New Leave Request',
      message: `Alex Employee has requested 2 days of Casual Leave.`,
      type: 'LEAVE_REQUEST',
      linkUrl: '/dashboard/approvals',
    },
  });

  await prisma.notification.create({
    data: {
      userId: employee.id,
      title: 'Leave Request Approved',
      message: `Your request for 3 days of Annual Leave has been approved.`,
      type: 'LEAVE_APPROVAL',
      linkUrl: '/dashboard/leave/history',
      isRead: true,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
