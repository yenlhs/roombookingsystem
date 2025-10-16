'use client';

import { useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts: KeyboardShortcut[] = [
  { key: 'D', description: 'Go to Dashboard', category: 'Navigation' },
  { key: 'R', description: 'Go to Rooms', category: 'Navigation' },
  { key: 'B', description: 'Go to Bookings', category: 'Navigation' },
  { key: 'U', description: 'Go to Users', category: 'Navigation' },
  { key: 'P', description: 'Go to Profile', category: 'Navigation' },
  { key: '?', description: 'Show this help', category: 'General' },
  { key: 'Esc', description: 'Close dialog/modal', category: 'General' },
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate quickly through the app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Keyboard shortcuts won&apos;t work when typing in
            input fields or text areas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KeyboardShortcutsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
        title="Keyboard Shortcuts (Press ?)"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </Button>
      <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
