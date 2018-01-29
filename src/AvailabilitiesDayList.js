import moment from 'moment'
import AvailabilityDay from './AvailabilityDay'

/**
 * Represents the list (Array) of availabilities for the given week
 */
export default class AvailabilitiesDayList {
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
  