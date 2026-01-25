// types/index.ts
export interface MenuItem {
  _id: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  ingredients?: string[];
  preparationTime?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reservationCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterSubscription {
  email: string;
}