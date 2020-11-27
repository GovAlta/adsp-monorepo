import { Channel } from './channel';

export interface Subscriber {
  spaceId: string
  id: string
  channels: { channel: Channel, address: string }[]
  userId?: string
  addressAs: string
}

export interface SubscriberCriteria {
  spaceIdEquals?: string
}
