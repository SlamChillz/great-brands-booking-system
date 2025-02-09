import { TInitializeEvent } from '../types';
import { Booking, Event, Waitlist } from '../database/entity';
import * as dbError from '../error/db';
import { BookingStatus, ServiceCart } from '../enum';
import { db } from '../database';

export default class EventRepository {
	public name = ServiceCart.EVENT;
  private static dbClient = db.client
	private static er = db.client.getRepository(Event)

	// constructor(private dbClient: DataSource) {
	// 	this.er = dbClient.getRepository(Event);
	// }

	public static async create(payload: Omit<TInitializeEvent, 'id'>) {
		const event = new Event();
		event.name = payload.name.toLowerCase();
		event.total_tickets = payload.no_tickets;
		event.available_tickets = payload.no_tickets;
		await EventRepository.er.save(event);
		return event;
	}

	public static async status(eventId: string): Promise<Event | null> {
    return await EventRepository.er
			.createQueryBuilder('event')
			// .leftJoinAndSelect('event.waitlists', 'waitlist')
			.loadRelationCountAndMap('event.waitlist_count', 'event.waitlists')
			.select(['event.id', 'event.name', 'event.total_tickets', 'event.available_tickets'])
			.where('event.id = :eventId', { eventId })
			.getOne();
	}

	public static async book(userId: string, eventId: string) {
		return EventRepository.dbClient.transaction(async (em) => {
			const event = await em
				.createQueryBuilder(Event, 'event')
				.setLock('pessimistic_write') // Ensure data integrity
				.where('event.id = :eventId', { eventId: eventId })
				.getOne();

			if (!event) {
				return {
					status: BookingStatus.FAILED,
					data: null,
					error: new Error(dbError.EVENT_NOT_FOUND)
				};
			}

			if (event.available_tickets > 0) {
				const booking = em.create(Booking, {
					user: { id: userId },
					event: { id: eventId }
				});
				await em.save(booking);
				await em
					.createQueryBuilder()
					.update(Event)
					.set({ available_tickets: () => 'available_tickets - 1' })
					.where('id = :eventId', { eventId: eventId })
					.execute();

				return { status: BookingStatus.BOOKED, data: booking, error: null };
			} else {
				const waitListEntry = em.create(Waitlist, {
					user: { id: userId },
					event: { id: eventId }
				});
				await em.save(waitListEntry);
				return { status: BookingStatus.WAITING, data: waitListEntry, error: null };
			}
		});
	}

	public static async cancel(
		userId: string,
		bookId: string
	): Promise<{ status: BookingStatus; newBooking: Booking | null; error: Error | null }> {
		return EventRepository.dbClient.transaction(async (em) => {
			const booking = await em
				.createQueryBuilder(Booking, 'booking')
				.leftJoinAndSelect('booking.user', 'user')
				.leftJoinAndSelect('booking.event', 'event')
				.where('booking.id = :bookId AND status = :status', { bookId, status: BookingStatus.BOOKED })
				.getOne();
			if (!booking) {
				return { status: BookingStatus.FAILED, newBooking: null, error: new Error(dbError.BOOKING_NOT_FOUND) };
			}
			if (booking.user.id !== userId) {
				return { status: BookingStatus.FAILED, newBooking: null, error: new Error(dbError.BOOKING_NOT_FOUND_FOR_USER) };
			}
			const eventId = booking.event.id;
			await em
				.createQueryBuilder()
				.update(Booking)
				.set({ status: BookingStatus.CANCELLED })
				.where('id = :id', { id: booking.id })
				.execute();

			const nextInWaitlist = await em
				.createQueryBuilder(Waitlist, 'waitlist')
				.leftJoinAndSelect('waitlist.user', 'user')
				.leftJoinAndSelect('waitlist.event', 'event')
				.where('waitlist.eventId = :eventId', { eventId })
				.orderBy('waitlist.created_at', 'DESC')
				.getOne();
			if (nextInWaitlist) {
				const newBooking = em.create(Booking, {
					user: { id: nextInWaitlist.user.id },
					event: { id: eventId }
				});
				newBooking.replacing = true;
				await em.save(newBooking);
				await em.remove(nextInWaitlist);
				return { status: BookingStatus.CANCELLED, newBooking: newBooking, error: null };
			} else {
				await em
					.createQueryBuilder()
					.update(Event)
					.set({ available_tickets: () => 'available_tickets + 1' })
					.where('id = :eventId', { eventId })
					.execute();
				return { status: BookingStatus.CANCELLED, newBooking: null, error: null };
			}
		});
	}

	public static async bookings(eventId: string, page: number, limit: number) {
		const skip = (page - 1) * limit;
		const [bookings, total] = await EventRepository.dbClient
			.createQueryBuilder(Booking, 'booking')
			// .leftJoinAndSelect('booking.user', 'user')
			// .leftJoinAndSelect('booking.event', 'event')
			.where('booking.eventId = :eventId', { eventId })
			.andWhere('booking.status != :status', { status: BookingStatus.CANCELLED })
			.orderBy('booking.created_at', 'DESC')
			.skip(skip)
			.take(limit)
			.getManyAndCount();
		const totalPages = Math.ceil(total / limit);
		return {
			data: bookings,
			pagination: {
				total,
				page,
				limit,
				totalPages
			}
		};
	}

	public static async waitlists(eventId: string, page: number, limit: number) {
		const skip = (page - 1) * limit;
		const [waitlists, total] = await EventRepository.dbClient
			.createQueryBuilder(Waitlist, 'waitlist')
			.where('waitlist.eventId = :eventId', { eventId })
			.orderBy('waitlist.created_at', 'DESC')
			.skip(skip)
			.take(limit)
			.getManyAndCount();
		const totalPages = Math.ceil(total / limit);
		return {
			data: waitlists,
			pagination: {
				total,
				page,
				limit,
				totalPages
			}
		};
	}
}
