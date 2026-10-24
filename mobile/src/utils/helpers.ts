import { JourneyStatus } from '../types';

export const STATUS_CONFIG: Record<
  JourneyStatus | 'unassigned',
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  awaiting_boarding: {
    label: 'Awaiting',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  arrived: {
    label: 'Arrived',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  onboard: {
    label: 'Onboard',
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  dropped_off: {
    label: 'Dropped Off',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  unassigned: {
    label: 'Vacant',
    color: '#64748B',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
};

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '');
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}
