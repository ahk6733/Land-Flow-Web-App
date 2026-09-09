import { LandTransaction, Customer } from '../types';

export const INITIAL_CUSTOMERS: any[] = [];

export const INITIAL_ORDERS: any[] = [];

export const DEFAULT_MOUZAS = [
  'হরিপুর',
  'গোপালপুর',
  'রামপুর',
  'কমলপুর',
  'উত্তরা',
  'তেজগাঁও',
  'মিরপুর',
  'সাভার'
];

export const INITIAL_TRANSACTIONS: LandTransaction[] = [];

export const toBengaliNumber = (num: string | number) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/[0-9]/g, (w) => bengaliDigits[w]);
};
