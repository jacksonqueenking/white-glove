'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

interface UserMenuProps {
  userName: string;
  userInitial: string;
  userEmail: string;
  isCollapsed: boolean;
}

export function UserMenu({ userName, userInitial, userEmail, isCollapsed }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={[
          "flex w-full items-center gap-3 rounded-2xl bg-[#f4d8c4] px-3 py-2 text-left text-sm font-semibold text-[#624230] transition hover:bg-[#f0c9b1]",
          isCollapsed ? "justify-center px-0" : "",
        ].join(" ")}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs text-[#624230]">
          {userInitial}
        </span>
        {!isCollapsed && <span>{userName}</span>}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-[#e7dfd4] py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-600">{userEmail}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/venue/profile');
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to chat preferences
                alert('Chat preferences coming soon!');
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <span>💬</span>
              <span>Chat Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to account/billing
                alert('Account & billing page coming soon!');
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <span>💳</span>
              <span>Account & Billing</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to help/docs
                router.push('/help');
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <span>❓</span>
              <span>Help & Documentation</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-slate-200 py-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
