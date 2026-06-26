export interface Passenger {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Booking {
  bookingCode: string;
  flightId: string;
  seatNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  passenger: Passenger;
  createdAt: string;
}
