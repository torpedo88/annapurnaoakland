// Mirrors the server's PrintOrder shape (src/lib/print/serialize.ts in the web app).
export type PrintLineItem = {
  name: string;
  qty: number;
  spiceLevel: string | null;
  riceChoice: string | null;
  specialInstructions: string | null;
  traySize: string | null;
};

export type PrintOrder = {
  id: string;
  orderNumber: number | null;
  orderType: "pickup" | "delivery";
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  items: PrintLineItem[];
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: string;
  source: string;
};

export type Settings = {
  serverUrl: string;
  token: string;
  printerId: string | null;
  enabled: boolean;
};
