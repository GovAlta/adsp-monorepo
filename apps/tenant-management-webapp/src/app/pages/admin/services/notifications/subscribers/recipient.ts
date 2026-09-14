import type { Subscriber } from '@store/subscription/models';
import { FormatTimeWithAt } from '@lib/timeUtil';

export const getChannelAddress = (subscriber: Subscriber, channel: string): string =>
  subscriber?.channels?.find((c) => c.channel === channel)?.address;

// A recipient counts as verified only when every address it can be reached at is verified; an
// unverified address is one the notification may not arrive at, whichever channel it belongs to.
export const isVerified = (subscriber: Subscriber): boolean =>
  subscriber?.channels?.length > 0 && subscriber.channels.every((c) => c.verified);

export const formatDate = (date: string): string => (date ? FormatTimeWithAt(new Date(date)) : '—');
