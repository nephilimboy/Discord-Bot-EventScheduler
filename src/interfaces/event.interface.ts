export interface Event {
  name: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  repeat?: string;
}

export default Event;
