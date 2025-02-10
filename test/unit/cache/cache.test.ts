import { cache as Cache } from '../../../src/cache';
import { EventTrigger } from '../../../src/enum';

jest.mock('async-mutex');

describe('Cache', () => {
  let cache: typeof Cache;

  beforeEach(() => {
    cache = Cache;
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize an event in the cache', () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.init(event);
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent).toEqual({
        id: 'event-1',
        name: 'Test Event',
        available_tickets: 100,
        wait_list_count: 0,
      });
    });
  });

  describe('book', () => {
    it('should decrease available_tickets when booking', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.init(event);
      cache.book('event-1', false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent?.available_tickets).toBe(101);
    });

    it('should decrease wait_list_count when replacing', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.init(event);
      cache.book('event-1', true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent?.wait_list_count).toBe(-1);
    });

    it('should do nothing if the event does not exist', async () => {
      cache.book('non-existent-event', false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const cachedEvent = cache.retrieveEvent('non-existent-event');
      expect(cachedEvent).toBeNull();
    });
  });

  describe('wait', () => {
    it('should increase wait_list_count when adding to waitlist', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.init(event);
      cache.wait('event-1');
      await new Promise((resolve) => setTimeout(resolve, 0));
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent?.wait_list_count).toBe(1);
    });

    it('should do nothing if the event does not exist', async () => {
      cache.wait('non-existent-event');
      await new Promise((resolve) => setTimeout(resolve, 0));
      const cachedEvent = cache.retrieveEvent('non-existent-event');
      expect(cachedEvent).toBeNull();
    });
  });

  describe('retrieveEvent', () => {
    it('should return the event if it exists', () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.init(event);
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent).toEqual({
        id: 'event-1',
        name: 'Test Event',
        available_tickets: 100,
        wait_list_count: 0,
      });
    });

    it('should return null if the event does not exist', () => {
      const cachedEvent = cache.retrieveEvent('non-existent-event');
      expect(cachedEvent).toBeNull();
    });
  });

  describe('event listeners', () => {
    it('should handle INIT event', () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.emit(EventTrigger.INIT, event);
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent).toEqual({
        id: 'event-1',
        name: 'Test Event',
        available_tickets: 100,
        wait_list_count: 0,
      });
    });

    it('should handle BOOK event', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.init(event);
      cache.emit(EventTrigger.BOOK, 'event-1', false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent?.available_tickets).toBe(101);
    });

    it('should handle WAIT event', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        no_tickets: 100,
      };
      cache.init(event);
      cache.emit(EventTrigger.WAIT, 'event-1');
      await new Promise((resolve) => setTimeout(resolve, 100));
      const cachedEvent = cache.retrieveEvent('event-1');
      expect(cachedEvent?.wait_list_count).toBe(1);
    });
  });
});
