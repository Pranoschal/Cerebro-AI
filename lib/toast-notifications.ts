'use client';

import { toast } from '@/hooks/use-toast';

const TOAST_DURATION = 5000;

export function showErrorToast(title: string, description?: string) {
  toast({
    variant: 'destructive',
    title,
    description,
    duration: TOAST_DURATION,
  });
}

export function showSuccessToast(title: string, description?: string) {
  toast({
    variant: 'success',
    title,
    description,
    duration: TOAST_DURATION,
  });
}

export function showInfoToast(title: string, description?: string) {
  toast({
    variant: 'default',
    title,
    description,
    duration: TOAST_DURATION,
  });
}
