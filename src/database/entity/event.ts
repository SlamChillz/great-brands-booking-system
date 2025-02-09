import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Relation,
  AfterInsert,
  BeforeInsert,
} from 'typeorm';
import {Booking} from './booking';
import {Waitlist} from './waitList';
import { cache } from '../../cache';
import { EventTrigger } from '../../enum';
import { randomUUID } from 'node:crypto';

@Entity()
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ unique: true, type: "varchar", length: 255 })
  name!: string

  @Column()
  total_tickets!: number

  @Column()
  available_tickets!: number

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings!: Relation<Booking[]>

  @OneToMany(() => Waitlist, (waitlist) => waitlist.event)
  waitlists!: Relation< Waitlist[]>

  @CreateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date

  @UpdateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updated_at!: Date

  @BeforeInsert()
  generateUUID() {
    this.id = randomUUID()
  }

  @AfterInsert()
  addNewEventToCache(): void {
    cache.emit(EventTrigger.INIT, {
      name: this.name,
      available_tickets: this.available_tickets,
      wait_list_count: 0
    })
  }
}
