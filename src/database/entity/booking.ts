import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation } from 'typeorm';
import {BookingStatus} from '../../enum';
import { User } from './user'
import { Event } from './event'

@Entity()
export class Booking {
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

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
