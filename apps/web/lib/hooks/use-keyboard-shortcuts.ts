import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const metaMatches = shortcut.metaKey ? event.metaKey : true;

        if (keyMatches && ctrlMatches && shiftMatches && metaMatches) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, router]);
}

// Common keyboard shortcuts
export const commonShortcuts = {
  goToDashboard: { key: 'd', description: 'Go to Dashboard' },
  goToRooms: { key: 'r', description: 'Go to Rooms' },
  goToBookings: { key: 'b', description: 'Go to Bookings' },
  goToUsers: { key: 'u', description: 'Go to Users' },
  goToProfile: { key: 'p', description: 'Go to Profile' },
  createNew: { key: 'n', description: 'Create New' },
  search: { key: '/', description: 'Search' },
  help: { key: '?', shiftKey: true, description: 'Show Keyboard Shortcuts' },
};
