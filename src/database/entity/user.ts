import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Relation } from 'typeorm';
import {Booking} from './booking';
import { WaitList } from './waitList';

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({unique: true})
  username!: string

  @Column()
  password!: string

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings!: Relation<Booking[]>

  @OneToMany(() => WaitList, (waitList) => waitList.user)
  waitLists!: Relation<WaitList[]>

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
