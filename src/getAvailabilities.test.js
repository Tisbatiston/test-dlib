import knex from 'knexClient'
import getAvailabilities from './getAvailabilities'

describe('getAvailabilities', () => {
  beforeEach(() => knex('events').truncate())

  describe('simple case', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2014-08-04 09:30'),
          ends_at: new Date('2014-08-04 12:30'),
          weekly_recurring: true,
        },
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-11 10:30'),
          ends_at: new Date('2014-08-11 11:30'),
        }
      ])
    })

    it('should fetch availabilities correctly', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-10'))
      expect(availabilities.length).toBe(7)

      expect(String(availabilities[0].date)).toBe(
        String(new Date('2014-08-10')),
      )
      expect(availabilities[0].slots).toEqual([])

      expect(String(availabilities[1].date)).toBe(
        String(new Date('2014-08-11')),
      )
      expect(availabilities[1].slots).toEqual([
        '9:30',
        '10:00',
        '11:30',
        '12:00',
      ])

      expect(String(availabilities[6].date)).toBe(
        String(new Date('2014-08-16')),
      )
    })
  })

  describe('Events across days cases', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2018-01-08 06:00'),
          ends_at: new Date('2018-01-14 22:00'),
        },
        {
          kind: 'appointment',
          starts_at: new Date('2018-01-08 05:00'),
          ends_at: new Date('2018-01-11 23:00'),
        },
      ])
    })

    it('should fetch availabilities correctly for multi-days spanning events', async () => {
      const availabilities = await getAvailabilities(new Date('2018-01-08'))
      
      expect(availabilities.length).toBe(7)
      expect(String(availabilities[3].date)).toBe(
        String(new Date('2018-01-11'))
      )
      expect(availabilities[3].slots).toEqual([
        '23:00',
        '23:30',
      ])
    })
  })

  describe('No events cases', () => {
    it('should return empty list when no events are fetched', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-10'))
      expect(availabilities.length).toBe(7)
    })

    it('should raise an error with an invalid date given', async () => {
      try {
        await getAvailabilities()
      }
      catch (e) {
        expect(e.message).toBe('Invalid date supplied')
      }
    })
  })

  describe('Future cases', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2018-12-03 06:00'),
          ends_at: new Date('2018-12-03 22:00'),
          weekly_recurring: true
        }
      ])
    })

    it('should not retrieve future weekly_recurring events', async () => {
      const availabilities = await getAvailabilities(new Date('2018-01-29'))
      expect(availabilities[0].slots).toEqual([])
    })

  })
})
