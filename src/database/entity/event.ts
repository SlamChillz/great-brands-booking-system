import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Relation } from 'typeorm';
import {Booking} from './booking';
import {WaitList} from './waitList';

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

  @OneToMany(() => WaitList, (waitList) => waitList.event)
  waitLists!: Relation< WaitList[]>

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
