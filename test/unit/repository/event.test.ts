import EventRepository from '../../../src/repository/event';
import { Booking, Event, User, Waitlist } from '../../../src/database/entity';
import { BookingStatus } from '../../../src/enum';
import {randomUUID} from 'node:crypto';
import {randomEventName} from '../../util';
import { db } from '../../../src/database'

let eventRepository: typeof EventRepository;

beforeAll(async () => {
  await db.initialize()
  eventRepository = EventRepository;
});

afterAll(async () => {
  await db.client.destroy();
});

describe("EventRepository - create", () => {
  it("should create an event successfully", async () => {
    const payload = { name: randomEventName(), no_tickets: 100 };
    const result = await eventRepository.create(payload);

    expect(result).toBeInstanceOf(Event);
    expect(result.name).toBe(payload.name.toLowerCase());
    expect(result.total_tickets).toBe(payload.no_tickets);
    expect(result.available_tickets).toBe(payload.no_tickets);
  });

  it("should throw an error if the database fails", async () => {
    jest.spyOn(db.client.getRepository(Event).manager, "save").mockRejectedValueOnce(new Error("Database error"));

    const payload = { name: randomEventName(), no_tickets: 100 };
    await expect(eventRepository.create(payload)).rejects.toThrow("Database error");
  });
});

describe("EventRepository - status", () => {
  it("should retrieve event status successfully", async () => {
    const event = new Event();
    event.name = randomEventName();
    event.total_tickets = 100;
    event.available_tickets = 50;
    await db.client.getRepository(Event).save(event);

    const result = await eventRepository.status(event.id);

    expect(result).toBeDefined();
    expect(result?.name).toBe(event.name);
    expect(result?.available_tickets).toBe(event.available_tickets);
  });

  it("should return null if the event does not exist", async () => {
    const result = await eventRepository.status(randomUUID());
    expect(result).toBeNull();
  });
});

describe("EventRepository - book", () => {
  let user: User;

  beforeAll(async () => {
    user = new User();
    user.username = 'test';
    user.password = 'test-password';
    await db.client.getRepository(User).save(user);
  })

  afterAll(async () => {
    await db.truncate();
  })

  it("should book a ticket successfully", async () => {
    const event = new Event();
    event.name = randomEventName();
    event.total_tickets = 100;
    event.available_tickets = 100;
    await db.client.getRepository(Event).save(event);

    const result = await eventRepository.book(user.id, event.id);

    expect(result.status).toBe(BookingStatus.BOOKED);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it("should add user to the waiting list if tickets are sold out", async () => {
    const event = new Event();
    event.name = randomEventName();
    event.total_tickets = 100;
    event.available_tickets = 0;
    await db.client.getRepository(Event).save(event);

    const result = await eventRepository.book(user.id, event.id);

    expect(result.status).toBe(BookingStatus.WAITING);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it("should fail if the event does not exist", async () => {
    const result = await eventRepository.book(user.id, randomUUID());

    expect(result.status).toBe(BookingStatus.FAILED);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });
});

describe("EventRepository - cancel", () => {
  let user: User;
  let user2: User;

  beforeAll(async () => {
    user = new User();
    user.username = 'tester';
    user.password = 'tester-password';
    await db.client.getRepository(User).save(user);

    user2 = new User();
    user2.username = 'tester2';
    user2.password = 'tester2-password';
    await db.client.getRepository(User).save(user2);
  })

  afterAll(async () => {
    await db.truncate();
  })

  it("should cancel a booking successfully", async () => {
    const event = new Event();
    event.name = randomEventName();
    event.total_tickets = 100;
    event.available_tickets = 50;
    await db.client.getRepository(Event).save(event);

    const booking = new Booking();
    booking.user = user;
    booking.event = event;
    await db.client.getRepository(Booking).save(booking);

    const result = await eventRepository.cancel(user.id, booking.id);

    expect(result.status).toBe(BookingStatus.CANCELLED);
    expect(result.error).toBeNull();
  });

  it("should assign the ticket to the next user in the waiting list", async () => {
    const event = new Event();
    event.name = randomEventName();
    event.total_tickets = 100;
    event.available_tickets = 0;
    await db.client.getRepository(Event).save(event);

    const waitListEntry = new Waitlist();
    waitListEntry.user = user2;
    waitListEntry.event = event;
    await db.client.getRepository(Waitlist).save(waitListEntry);

    const booking = new Booking();
    booking.user = user;
    booking.event = event;
    await db.client.getRepository(Booking).save(booking);

    const result = await eventRepository.cancel(user.id, booking.id);
    const checkWaitList = await db.client.getRepository(Waitlist).findOneBy({
      id: waitListEntry.id,
    });

    expect(checkWaitList).toBeNull();
    expect(result.status).toBe(BookingStatus.CANCELLED);
    expect(result.error).toBeNull();
  });

  it("should fail if the booking does not exist", async () => {
    const result = await eventRepository.cancel(user.id, randomUUID());

    expect(result.status).toBe(BookingStatus.FAILED);
    expect(result.error).toBeDefined();
  });

  it("should fail if the booking does not belong to the user", async () => {
    const event = new Event();
    event.name = randomEventName();
    event.total_tickets = 100;
    event.available_tickets = 0;
    await db.client.getRepository(Event).save(event);

    const booking = new Booking();
    booking.user = user2;
    booking.event = event;
    await db.client.getRepository(Booking).save(booking);

    const result = await eventRepository.cancel(user.id, booking.id);

    expect(result.status).toBe(BookingStatus.FAILED);
    expect(result.error).toBeDefined();
  });
});

describe("EventRepository - bookings", () => {
  let eventId: string;

  beforeAll(async () => {
    const event = await eventRepository.create({ name: "Tech Event", no_tickets: 5 });
    eventId = event.id;

    await db.client.getRepository(Booking).save([
      { event: { id: eventId }, status: BookingStatus.BOOKED },
      { event: { id: eventId }, status: BookingStatus.BOOKED },
      { event: { id: eventId }, status: BookingStatus.CANCELLED },
    ]);
  });

  afterAll(async () => {
    await db.client.getRepository(Booking).delete({event: {id: eventId}});
    await db.client.getRepository(Event).delete({id: eventId});
  })

  it("should return only non-cancelled bookings", async () => {
    const result = await eventRepository.bookings(eventId, 1, 10);
    expect(result.data.length).toBe(2);
    expect(result.pagination.total).toBe(2);
  });

  it("should paginate bookings correctly", async () => {
    const result = await eventRepository.bookings(eventId, 1, 1);
    expect(result.data.length).toBe(1);
    expect(result.pagination.totalPages).toBe(2);
  });
});

describe("EventRepository - waitlists", () => {
  let eventId: string;

  beforeAll(async () => {
    const event = await eventRepository.create({ name: "Tech Event", no_tickets: 5 });
    eventId = event.id;

    await db.client.getRepository(Waitlist).save([
      { event: { id: eventId } },
      { event: { id: eventId } },
    ]);
  });

  afterAll(async () => {
    await db.truncate()
  })

  afterAll(async () => {
    await db.client.getRepository(Waitlist).delete({
      event: { id: eventId }
    });
    await db.client.getRepository(Event).delete({id: eventId});
  })

  it("should return all waitlist entries", async () => {
    const result = await eventRepository.waitlists(eventId, 1, 10);
    expect(result.data.length).toBe(2);
    expect(result.pagination.total).toBe(2);
  });

  it("should paginate waitlist entries correctly", async () => {
    const result = await eventRepository.waitlists(eventId, 1, 1);
    expect(result.data.length).toBe(1);
    expect(result.pagination.totalPages).toBe(2);
  });
});
