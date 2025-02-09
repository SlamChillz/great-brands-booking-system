import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Relation, BeforeInsert } from 'typeorm';
import {Booking} from './booking';
import { Waitlist } from './waitList';
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt';
import config from '../../config';

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

  @OneToMany(() => Waitlist, (waitlist) => waitlist.user)
  waitlists!: Relation<Waitlist[]>

  @CreateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date

  @UpdateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updated_at!: Date

  @BeforeInsert()
  generateUUID() {
    this.id = randomUUID()
  }

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, config.hash.SALT)
  }

  async verifyPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password)
  }
}
