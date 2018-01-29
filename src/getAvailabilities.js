import moment from 'moment'
import knex from 'knexClient'

const OPENING = 'opening'
const APPOINTMENT = 'appointment'

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
    .orWhere({
      weekly_recurring: true
    }).then((events) => {
      const list = new AvailabilitiesDayList(periodStart, events)
      return list.toDoctolibTestFormat()
    }).catch(e => {
      throw e
    }) 
}

class AvailabilitiesDayList {
  constructor (periodStart, events) {
    this._availabities = []
    
    for (let i = 0; i < 7; i++) {
      const day = new AvailabilityDay(moment(periodStart).add(i, 'day'))
      this._availabities.push(day)
    }
    
    events = this.bringRecurrentEventsToCurrentWeek(events)

    this._availabities.forEach(day => {
      this.setTimeSlotsInAvailabilityDay(events, day)
    });
  }

  /**
   * Set availability slots to all AvailabilitiesDay
   * @param {Array} events 
   * @param {AvailabilityDay} availabilityDay 
   */
  setTimeSlotsInAvailabilityDay (events, availabilityDay) {
    events.forEach(event => {
      if (this.isAnIncludedEvent(event, availabilityDay)) {
        availabilityDay.destructureEventToSlots(event)
      }
    })
  }
 
  /**
   * Update all recurring events date to match the current week equivalent days
   * @param {Array} events 
   */
  bringRecurrentEventsToCurrentWeek (events) {
    return events.map(event => {
      if (event.hasOwnProperty('weekly_recurring') && event.weekly_recurring) {
        event = this.recurringEventToCurrentWeek(event)
      }
      return event
    })
  }

  /**
   * Update a recurring event date to match the current week equivalent day
   * @param {Object} event 
   */
  recurringEventToCurrentWeek (event) {
    const event_start = moment(event.starts_at)
    const event_end = moment(event.ends_at)

    this._availabities.forEach(el => {
      if (event_start.day() === el.momentObj.day()) {

        event.starts_at = moment(el.momentObj).set({
          hour: event_start.get('hour'),
          minute: event_start.get('minute'),
          second: event_start.get('second')
        })

        event.ends_at = moment(el.momentObj).set({
          hour: event_end.get('hour'),
          minute: event_end.get('minute'),
          second: event_end.get('second')
        })
        
      }
    });

    return event
  }

  /**
   * Test if given event is included in AvailabilityDay range
   * @param {Object} event 
   * @param {AvailabilityDay} availabilityDay 
   */
  isAnIncludedEvent(event, availabilityDay) {
    const endOfDay = moment(availabilityDay.momentObj).endOf('day')
    const startOfDay = moment(availabilityDay.momentObj).startOf('day')
    return moment(event.starts_at).isSameOrBefore(endOfDay) && moment(event.ends_at).isSameOrAfter(startOfDay)
  }

  /**
   * Transfroms Array to expected return format
   */
  toDoctolibTestFormat () {
    return this._availabities.map(el => ( el.toDoctolibTestFormat() ))
  }
}

class AvailabilityDay {
  constructor (date) {
    this.momentObj = moment(date)
    this._events = {
      opening: [],
      appointment: []
    }
  }

  /**
   * Sets availability slots to corresponding list (opening/appointment)
   * @param {Object} event 
   */
  destructureEventToSlots (event) {
    const time = moment(this.momentObj).startOf('day')

    const endOfDay = moment(this.momentObj).endOf('day')
    while (time < endOfDay) {
      if (time.isBetween(moment(event.starts_at), moment(event.ends_at), null, '[)')) {
        const currentSlot = time.format('HH:mm')
        if (!this._events[event.kind].includes(currentSlot)) {
          this._events[event.kind].push(currentSlot)
        }
      }
      time.add('30', 'minute')
    }
  }

  /**
   * Transfroms object to expected return format
   */
  toDoctolibTestFormat () {
    const {opening, appointment} = this._events
    return {
      slots: opening.filter(el => !appointment.includes(el)),
      date: String(this.momentObj.toDate())
    }
  }
}
