export interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  date: string;
  time: string;
  notes: string;
  coupon: string;
  gpsCoords: string;
  mapsLink: string;
}

export interface SavedAddress {
  id: string;
  type: string;
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  gpsCoords?: string;
  mapsLink?: string;
  isDefault?: boolean;
}
