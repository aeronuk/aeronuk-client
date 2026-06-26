export interface PaymentAttempt {
  id: string;
  method: string;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingCode: string;
  amount: number;
  currency: string;
  status: string;
  attempts: PaymentAttempt[];
  createdAt: string;
}
