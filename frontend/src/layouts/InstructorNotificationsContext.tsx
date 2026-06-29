'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import { useNotifications, type Notification } from '../hooks/useNotifications';

type InstructorNotificationsValue = ReturnType<typeof useNotifications>;

const InstructorNotificationsContext =
  createContext<InstructorNotificationsValue | null>(null);

export function InstructorNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const notifications = useNotifications();

  return (
    <InstructorNotificationsContext.Provider value={notifications}>
      {children}
    </InstructorNotificationsContext.Provider>
  );
}

export function useInstructorNotifications() {
  const context = useContext(InstructorNotificationsContext);

  if (!context) {
    throw new Error(
      'useInstructorNotifications must be used within InstructorNotificationsProvider',
    );
  }

  return context;
}

export type { Notification };
