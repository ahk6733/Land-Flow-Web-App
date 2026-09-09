import React from 'react';
import { Settings, Palette, Database, Moon, Sun } from 'lucide-react';
import UserProfile from './UserProfile';
import { LandTransaction } from '../types';

interface SettingsTabProps {
  currentUser: any;
  onUpdateProfile: (updated: any) => void;
  onLogout: () => void;
  transactions: LandTransaction[];
  onImportBackup: (data: LandTransaction[]) => void;
  onDeleteAllData: () => void;
  registeredUsers: any[];
  onAddUser: ( newUser: any ) => void;
  onRemoveUser: (userId: string) => void;
  onClearUserData?: (userId: string) => void;
  onCleanEntireAppData?: () => void;
  appTheme: string;
  setAppTheme: (theme: string) => void;
  dbSaveLocation: string;
  setDbSaveLocation: (loc: string) => void;
  onAddTokens: (userId: string, amount: number) => void;
}

export default function SettingsTab({
  appTheme, setAppTheme,
  dbSaveLocation, setDbSaveLocation,
  ...userProfileProps
}: SettingsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* User Profile Component Inside Settings */}
      <div>
        <UserProfile {...userProfileProps} />
      </div>
    </div>
  );
}
