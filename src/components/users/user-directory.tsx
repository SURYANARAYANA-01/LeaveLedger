'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, CreateUserInput, updateUserSchema, UpdateUserInput } from '@/lib/validators/user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Building,
  UserCheck,
  X
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  phone: string | null;
  isActive: boolean;
  joiningDate: string;
  department: {
    id: string;
    name: string;
  } | null;
  manager: {
    id: string;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

interface UserDirectoryProps {
  users: UserType[];
  departments: Department[];
  managers: { id: string; name: string }[];
  currentRole: 'ADMIN' | 'MANAGER' | 'CEO';
}

export default function UserDirectory({ users: initialUsers, departments, managers, currentRole }: UserDirectoryProps) {
  const isManager = currentRole === 'MANAGER';
  const isCeo = currentRole === 'CEO';
  // Add/Edit are allowed for everyone within what they can see; the Add-form
  // role choices and Edit button are scoped further below per user.
  const canAdd = true;

  const canEditUser = (user: UserType) => {
    if (isCeo) return true;
    if (currentRole === 'ADMIN') return user.role !== 'ADMIN'; // HR: managers + employees, not other HR
    if (isManager) return user.role === 'EMPLOYEE'; // Manager: employees only
    return false;
  };
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // React Hook Form for Create User
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    formState: { errors: addErrors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      role: 'EMPLOYEE',
      departmentId: '',
      managerId: '',
      phone: '',
    },
  });

  // React Hook Form for Edit User
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  const onAddUser = async (data: CreateUserInput) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('User created and balances initialized successfully!');
        setIsAddOpen(false);
        resetAdd();
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to create user.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const onEditUser = async (data: UpdateUserInput) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('User updated successfully!');
        setIsEditOpen(false);
        setEditingUser(null);
        resetEdit();
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to update user.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: UserType) => {
    setEditingUser(user);
    setEditValue('id', user.id);
    setEditValue('name', user.name);
    setEditValue('email', user.email);
    setEditValue('role', user.role);
    setEditValue('departmentId', user.department?.id || '');
    setEditValue('managerId', user.manager?.id || '');
    setEditValue('phone', user.phone || '');
    setEditValue('isActive', user.isActive);
    setIsEditOpen(true);
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesDept = deptFilter === 'ALL' || user.department?.id === deptFilter;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, searchTerm, roleFilter, deptFilter]);

  const roleGroupOrder: { role: UserType['role']; label: string }[] = [
    { role: 'ADMIN', label: 'HR Admin' },
    { role: 'MANAGER', label: 'Manager' },
    { role: 'EMPLOYEE', label: 'Employee' },
  ];

  const groupedUsers = useMemo(() => {
    return roleGroupOrder
      .map((g) => ({ ...g, list: filteredUsers.filter((u) => u.role === g.role) }))
      .filter((g) => g.list.length > 0);
  }, [filteredUsers]);

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-650 dark:text-slate-350"
            >
              <option value="ALL">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              {!isManager && <option value="MANAGER">Manager</option>}
              {isCeo && <option value="ADMIN">HR Admin</option>}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-650 dark:text-slate-350"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {canAdd && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="xl:ml-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid, grouped by role */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-12 text-center text-sm text-slate-400">
          No employees found matching criteria.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedUsers.map((group) => (
            <div key={group.role} className="space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {group.label}
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                  {group.list.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.list.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              {/* User Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0 pr-2">
                  <h3 className="font-extrabold text-slate-850 dark:text-slate-100 truncate block">
                    {user.name}
                  </h3>
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded text-[10px] font-bold border',
                      user.role === 'ADMIN'
                        ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100/50'
                        : user.role === 'MANAGER'
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/50'
                        : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100/50'
                    )}
                  >
                    {user.role === 'ADMIN' ? 'HR Admin' : user.role === 'MANAGER' ? 'Manager' : 'Employee'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    title={user.isActive ? 'Active Employee' : 'Deactivated Account'}
                    className={cn(
                      'p-1 rounded-full',
                      user.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                    )}
                  >
                    {user.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </span>

                  {canEditUser(user) && (
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-500 flex-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.department?.name || 'No Department'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manager: {user.manager?.name || 'None'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined: {formatDate(user.joiningDate)}</span>
                </div>
              </div>
            </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-850 dark:text-slate-100">Add New Employee</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit(onAddUser)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Full Name</label>
                <input
                  type="text"
                  {...registerAdd('name')}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {addErrors.name && <p className="text-xs text-rose-500">{addErrors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Email Address</label>
                <input
                  type="email"
                  {...registerAdd('email')}
                  placeholder="john.doe@company.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {addErrors.email && <p className="text-xs text-rose-500">{addErrors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Temporary Password</label>
                <input
                  type="password"
                  {...registerAdd('password')}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {addErrors.password && <p className="text-xs text-rose-500">{addErrors.password.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Role</label>
                  <select
                    {...registerAdd('role')}
                    disabled={isManager}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    {!isManager && <option value="MANAGER">Manager</option>}
                    {isCeo && <option value="ADMIN">HR Admin</option>}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Phone (Optional)</label>
                  <input
                    type="text"
                    {...registerAdd('phone')}
                    placeholder="+123456789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Department</label>
                  <select
                    {...registerAdd('departmentId')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Manager</label>
                  <select
                    {...registerAdd('managerId')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Create Account</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-850 dark:text-slate-100">Modify Employee Details</h2>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(onEditUser)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <input type="hidden" {...registerEdit('id')} />

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Full Name</label>
                <input
                  type="text"
                  {...registerEdit('name')}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {editErrors.name && <p className="text-xs text-rose-500">{editErrors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Email Address</label>
                <input
                  type="email"
                  {...registerEdit('email')}
                  placeholder="john.doe@company.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {editErrors.email && <p className="text-xs text-rose-500">{editErrors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Role</label>
                  <select
                    {...registerEdit('role')}
                    disabled={isManager}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    {!isManager && <option value="MANAGER">Manager</option>}
                    {isCeo && <option value="ADMIN">HR Admin</option>}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Phone (Optional)</label>
                  <input
                    type="text"
                    {...registerEdit('phone')}
                    placeholder="+123456789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Department</label>
                  <select
                    {...registerEdit('departmentId')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Manager</label>
                  <select
                    {...registerEdit('managerId')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Manager</option>
                    {managers.filter(m => m.id !== editingUser?.id).map((m) => ( // Filter out self from managers
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" {...registerEdit('isActive')} id="isActive" className="rounded border-slate-300" />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  Is Active Employee
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
