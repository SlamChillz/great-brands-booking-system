export enum BookingStatus {
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  FAILED = 'failed',
}

export enum EventTrigger {
  BOOK = 'book',
  CANCEL = 'cancel',
  INIT = 'init',
  REPLACE = 'replace',
  WAIT = 'wait',
}

export enum ServiceCart {
  USER = 'user',
  EVENT = 'event',
}
