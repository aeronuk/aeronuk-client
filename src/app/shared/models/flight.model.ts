export interface Flight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: { amount: number; currency: string };
}

export interface Seat {
  id: string;
  seatNumber: string;
  class: string;
  available: boolean;
}
