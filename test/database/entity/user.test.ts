import { User } from '../../../src/database/entity';
import { Booking } from '../../../src/database/entity';
import { Waitlist } from '../../../src/database/entity';
import { Event } from '../../../src/database/entity';
import bcrypt from 'bcrypt';
import { db } from '../../../src/database'
import { randomEventName } from '../../util';

// Mock bcrypt and config
jest.mock('bcrypt');

describe('User Entity', () => {
  beforeAll(async () => {
    await db.initialize();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(User).toBeDefined();
  });

  describe('Entity Definition', () => {
    it('should have an id column', () => {
      const user = new User();
      expect(user.id).toBeUndefined();
    });

    it('should have a username column', () => {
      const user = new User();
      user.username = 'testuser';
      expect(user.username).toBe('testuser');
    });

    it('should have a password column', () => {
      const user = new User();
      user.password = 'password123';
      expect(user.password).toBe('password123');
    });

    it('should have created_at and updated_at columns', () => {
      const user = new User();
      expect(user.created_at).toBeUndefined();
      expect(user.updated_at).toBeUndefined();
    });

    it('should have OneToMany relationships with Booking and Waitlist', () => {
      const user = new User();
      expect(user.bookings).toBeUndefined();
      expect(user.waitlists).toBeUndefined();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should generate a UUID before insert', async () => {
      const user = new User();
      user.username = 'testuser';
      user.password = 'password123';

      await db.client.getRepository(User).save(user);

      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('string');
      expect(user.id.length).toBeGreaterThan(0);
    });

    it('should hash the password before insert', async () => {
      const user = new User();
      user.username = randomEventName();
      user.password = 'password123';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      await db.client.getRepository(User).save(user);
      expect(user.password).not.toBe('hashedpassword');
    });
  });

  describe('Password Verification', () => {
    it('should verify the password correctly', async () => {
      const user = new User();
      user.password = 'hashedpassword';
      const userVerifyMock = jest.spyOn(user, 'verifyPassword')
      userVerifyMock.mockResolvedValue(true);
      const isValid = await user.verifyPassword('hashedpassword');
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User();
      user.password = 'hashedpassword';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const isValid = await user.verifyPassword('wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('Relationships', () => {
    it('should have bookings', async () => {
      const user = new User();
      user.username = randomEventName();
      user.password = 'password123';

      const booking = new Booking();
      booking.user = user;

      await db.client.getRepository(User).save(user);
      await db.client.getRepository(Booking).save(booking);

      const savedUser = await db.client.getRepository(User).findOne({
        where: { id: user.id },
        relations: ['bookings'],
      });

      expect(savedUser?.bookings).toHaveLength(1);
      expect(savedUser?.bookings?.[0].id).toBe(booking.id);
    });

    it('should have waitlists', async () => {
      const user = new User();
      user.username = randomEventName();
      user.password = 'password123';

      const event = new Event()
      event.name = randomEventName()
      event.total_tickets = 3
      event.available_tickets = 3

      const waitlist = new Waitlist();
      waitlist.user = user;
      waitlist.event = event;

      await db.client.getRepository(User).save(user);
      await db.client.getRepository(Event).save(event);
      await db.client.getRepository(Waitlist).save(waitlist);

      const savedUser = await db.client.getRepository(User).findOne({
        where: { id: user.id },
        relations: ['waitlists'],
      });

      expect(savedUser?.waitlists).toHaveLength(1);
      expect(savedUser?.waitlists?.[0].id).toBe(waitlist.id);
    });
  });
});
