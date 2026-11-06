'use client';

import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PasswordDialogProps {
  mode: 'add' | 'remove';
  isOpenFlow?: boolean; // true when triggered by opening an encrypted PDF
  onConfirm: (password: string, ownerPassword?: string) => void;
  onClose: () => void;
}

export default function PasswordDialog({ mode, isOpenFlow = false, onConfirm, onClose }: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (mode === 'add') {
      if (!password.trim()) {
        setError('Password cannot be empty');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
    }
    setError('');
    onConfirm(password, ownerPassword || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOpenFlow ? 'bg-yellow-100' : mode === 'add' ? 'bg-blue-100' : 'bg-orange-100'
          }`}>
            {isOpenFlow
              ? <Lock size={18} className="text-yellow-600" />
              : mode === 'add'
              ? <Lock size={18} className="text-blue-600" />
              : <Unlock size={18} className="text-orange-600" />
            }
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {isOpenFlow
                ? 'This PDF is Password Protected'
                : mode === 'add'
                ? 'Protect PDF with Password'
                : 'Remove PDF Password'
              }
            </h2>
            <p className="text-sm text-gray-500">
              {isOpenFlow
                ? 'Enter the password to open and edit this document'
                : mode === 'add'
                ? 'Set a password to restrict access'
                : 'Enter the current password to unlock'
              }
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isOpenFlow ? 'Document Password' : mode === 'add' ? 'User Password' : 'Current Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder={mode === 'add' ? 'Enter password for viewers' : 'Enter current password'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'add' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Owner Password <span className="text-gray-400 font-normal">(optional — for editing permissions)</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Leave blank to use same as user password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle size={15} />
              {error}
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
              isOpenFlow
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : mode === 'add'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isOpenFlow ? 'Open PDF' : mode === 'add' ? 'Protect PDF' : 'Remove Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
