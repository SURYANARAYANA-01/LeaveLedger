'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateProfileSchema,
  UpdateProfileInput,
  changePasswordSchema,
  ChangePasswordInput
} from '@/lib/validators/user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Mail,
  Phone,
  Calendar,
  Building,
  UserCheck,
  Loader2,
  Camera,
  KeyRound,
  Upload
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'HR' | 'CEO';
  phone: string | null;
  joiningDate: string;
  avatar: string | null;
  department: { name: string } | null;
  manager: { name: string } | null;
}

interface ProfileEditorProps {
  user: UserProfile;
}

export default function ProfileEditor({ user }: ProfileEditorProps) {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || '',
      avatar: user.avatar || '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  /** Open the hidden file input when the camera icon is clicked */
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  /** Convert file to base64 and update form state + live preview */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setProfileValue('avatar', base64);
    };
    reader.readAsDataURL(file);
  };

  const onUpdateProfile = async (data: UpdateProfileInput) => {
    setProfileLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', ...data }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Profile updated successfully!');
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to update profile.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordInput) => {
    setPasswordLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password', ...data }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Password updated successfully!');
        resetPassword();
      } else {
        toast.error(result.message || 'Failed to update password.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleLabel =
    user.role === 'CEO'
      ? 'Chief Executive Officer'
      : user.role === 'HR'
      ? 'HR Director'
      : user.role === 'MANAGER'
      ? 'Engineering Manager'
      : 'Software Engineer';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Left side: Premium User Profile Summary Card */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md flex flex-col items-center text-center relative overflow-hidden group">
          {/* Abstract glow effects */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Avatar Container */}
          <div className="relative mt-4 mb-4 group/avatar">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt={user.name} 
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-xl transition-all duration-300 group-hover/avatar:scale-105"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center font-black text-3xl transition-all duration-300 group-hover/avatar:scale-105">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={handleCameraClick}
              title="Upload profile picture"
              className="absolute bottom-0 right-0 p-2 bg-indigo-600 dark:bg-indigo-500 border border-white dark:border-slate-800 text-white rounded-full shadow-lg cursor-pointer transform hover:scale-110 transition-transform"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg tracking-tight mt-1">{user.name}</h3>
          
          {/* Position Tag */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 mt-2 border border-indigo-100/40">
            {roleLabel}
          </span>

          {/* User Details Grid */}
          <div className="w-full border-t border-slate-100 dark:border-slate-800/80 mt-6 pt-5 space-y-4 text-xs text-left text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate mt-0.5">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{user.department?.name || 'Engineering'} Department</span>
              </div>
            </div>

            {user.manager && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reporting Manager</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{user.manager.name}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{formatDate(user.joiningDate)}</span>
              </div>
            </div>
          </div>

          {/* Upload hint */}
          <button
            type="button"
            onClick={handleCameraClick}
            className="mt-5 flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Profile Picture</span>
          </button>
        </div>
      </div>

      {/* Right side: Forms for Personal Details & Password Change */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Form 1: Personal Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <User className="w-4 h-4 text-indigo-500" />
            <span>Personal Information</span>
          </h2>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-5 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...registerProfile('name')}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                {profileErrors.name && <p className="text-xs text-rose-500 mt-1 font-bold">{profileErrors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...registerProfile('phone')}
                    placeholder="+1 (555) 010-0202"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Avatar hidden field (populated by file picker) */}
            <input type="hidden" {...registerProfile('avatar')} />

            {/* Avatar preview in form */}
            {avatarPreview && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30"
                />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Profile picture selected</p>
                  <p className="text-[10px] text-slate-400">Click Save Changes to apply</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Password Change */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>Change Account Password</span>
          </h2>

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...registerPassword('currentPassword')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>
              {passwordErrors.currentPassword && <p className="text-xs text-rose-500 mt-1 font-bold">{passwordErrors.currentPassword.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    {...registerPassword('newPassword')}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                {passwordErrors.newPassword && <p className="text-xs text-rose-500 mt-1 font-bold">{passwordErrors.newPassword.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    {...registerPassword('confirmPassword')}
                    placeholder="Must match new password"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                {passwordErrors.confirmPassword && <p className="text-xs text-rose-500 mt-1 font-bold">{passwordErrors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Change Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
