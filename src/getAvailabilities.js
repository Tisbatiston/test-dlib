import moment from 'moment'
import knex from 'knexClient'
import AvailabilitiesDayList from './AvailabilitiesDayList'

/**
 * Returns availabilities for the 7 days following the given date
 * @param {Date} date 
 */
export default async function getAvailabilities (date) {
  const periodStart = moment(date)
  if (!periodStart.isValid()) {
    throw new RangeError('Invalid date supplied')
  }
  const periodEnd = moment(date).add(7, 'day')

  return knex('events')
    .where(function () {
      this.where('starts_at', '<=', periodEnd.format('x')).andWhere('ends_at', '>=', periodStart.format('x'))
    })
    .orWhere(function() {
      this.where('weekly_recurring', true).andWhere('starts_at', '<', periodEnd.format('x'))
    }).then((events) => {
      const list = new AvailabilitiesDayList(periodStart, events)
      return list.toDoctolibTestFormat()
    }).catch(e => {
      throw e
    }) 
}
