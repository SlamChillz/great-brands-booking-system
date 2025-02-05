import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation } from "typeorm"
import {Event} from './event';
import {User} from './user';

@Entity()
export class WaitList {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => User, (user) => user.waitLists)
  user!: Relation<User>

  @ManyToOne(() => Event, (event) => event.waitLists)
  event!: Relation<Event>

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
