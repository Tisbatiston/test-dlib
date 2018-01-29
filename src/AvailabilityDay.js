import moment from 'moment'

/**
 * Represents a day in the given week
 */
export default class AvailabilityDay {
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
  