import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation, AfterInsert } from "typeorm"
import {Event} from './event';
import {User} from './user';
import { cache } from '../../cache';
import { EventTrigger } from '../../enum';

@Entity()
export class Waitlist {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => User, (user) => user.waitlists)
  user!: Relation<User>

  @ManyToOne(() => Event, (event) => event.waitlists)
  event!: Relation<Event>

  @CreateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date

  @UpdateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updated_at!: Date

  @AfterInsert()
  newWaitRecordCacheNotification() {
    cache.emit(EventTrigger.WAIT, this.event.id)
  }
}
