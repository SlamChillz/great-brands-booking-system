import { EventStatus, RequiredFields, TInitializeEvent } from '../types';
import EventEmitter from 'node:events';
import { EventTrigger } from '../enum';
import { Mutex } from 'async-mutex';

class Cache extends EventEmitter {
	private static instance: Cache;
	private mutex = new Mutex();
	private events: { [key: string]: EventStatus } = {};

	private async acquireLock() {
    return await this.mutex.acquire();
	}

	private _init(event: RequiredFields<TInitializeEvent>) {
		this.events[event.id] = {
			name: event.name,
			available_tickets: event.no_tickets,
			wait_list_count: 0
		};
	}

	public init(event: RequiredFields<TInitializeEvent>) {
		this._init(event);
	}

	private async _book(eventId: string, replacing: boolean) {
		if (!this.events[eventId]) {
			return;
		}
		const release = await this.acquireLock();
		try {
			if (replacing) {
				this.events[eventId].wait_list_count -= 1;
			} else {
				this.events[eventId].available_tickets += 1;
			}
		} finally {
			release();
		}
	}

	public book(eventId: string, replacing: boolean) {
		this._book(eventId, replacing).then(() => {});
	}

	private async _wait(eventId: string) {
		if (!this.events[eventId]) {
			return
		}
		const release = await this.acquireLock();
		try {
			this.events[eventId].wait_list_count += 1;
		} finally {
			release();
		}
	}

	public wait(eventId: string) {
		this._wait(eventId).then(() => {});
	}

	public static SingleInstance(): Cache {
		if (!Cache.instance) {
			Cache.instance = new Cache();
		}
		return Cache.instance;
	}

  public retrieveEvent(eventId: string) {
    const event = this.events[eventId];
    if (!event) {
      return null;
    }
    return {
      id: eventId,
      ...event,
    }
  }
}

const cache = Cache.SingleInstance();
cache.setMaxListeners(100);

cache.on(EventTrigger.INIT, (event: RequiredFields<TInitializeEvent>) => {
	cache.init(event);
});

cache.on(EventTrigger.BOOK, (eventId: string, replacing: boolean) => {
	cache.book(eventId, replacing);
});

cache.on(EventTrigger.WAIT, (eventId: string) => {
	cache.wait(eventId);
});

export default cache;
