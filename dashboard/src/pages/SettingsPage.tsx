import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export const SettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Settings page - Coming soon</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

