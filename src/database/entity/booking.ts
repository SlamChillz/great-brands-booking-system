import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation, AfterInsert, AfterUpdate, BeforeInsert } from 'typeorm';
import {BookingStatus} from '../../enum';
import { User } from './user'
import { Event } from './event'
import { cache } from '../../cache';
import { EventTrigger } from '../../enum';
import { randomUUID } from 'node:crypto';

@Entity()
export class Booking {
  public replacing: boolean = false;

  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.BOOKED
  })
  status!: string

  @ManyToOne(() => User, (user) => user.bookings)
  user!: Relation<User>

  @ManyToOne(() => Event, (event) => event.bookings)
  event!: Relation<Event>

  @CreateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date

  @UpdateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updated_at!: Date

  @BeforeInsert()
  generateUUID() {
    this.id = randomUUID()
  }

  @AfterInsert()
  newBookingCacheNotification() {
    cache.emit(EventTrigger.BOOK, this.id, this.replacing)
  }
}
