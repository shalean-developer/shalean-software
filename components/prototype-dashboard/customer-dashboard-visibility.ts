import {
  MOCK_ARRIVAL_WINDOWS,
  MOCK_CLEANING_PRIORITIES,
  MOCK_FAVORITE_EXTRAS,
  MOCK_MESSAGE_THREADS,
  MOCK_PAYMENT,
  MOCK_PAST,
  MOCK_PREFERENCES,
  MOCK_UPCOMING,
} from "./mock-customer-data";

export function customerHasUpcomingBookings(): boolean {
  return MOCK_UPCOMING.length > 0;
}

export function customerHasPastVisits(): boolean {
  return MOCK_PAST.length > 0;
}

export function customerHasMessageThreads(): boolean {
  return MOCK_MESSAGE_THREADS.length > 0;
}

export function customerHasInvoices(): boolean {
  return MOCK_PAYMENT.invoices.length > 0;
}

export function customerHasPaymentHistory(): boolean {
  return MOCK_PAYMENT.history.length > 0;
}

export function customerHasSavedCards(): boolean {
  return MOCK_PAYMENT.cards.length > 0;
}

export function customerHasPreferenceDetail(): boolean {
  return (
    MOCK_PREFERENCES.length > 0 ||
    MOCK_ARRIVAL_WINDOWS.length > 0 ||
    MOCK_CLEANING_PRIORITIES.length > 0 ||
    MOCK_FAVORITE_EXTRAS.length > 0
  );
}
