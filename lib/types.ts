export type Ticket = Record<string, unknown> & { INCIDENT: string; WORKZONE: string };
export type Workzone = { branch: string; sa: string; region: string };
export type Reference = {
  mapping: Record<string, Workzone>;
  customers: Record<string, number>;
  snapshots: Record<string, Ticket[]>;
  monthly: Record<string, { saldo: Record<string, number>; customers: Record<string, number>; label: string }>;
  imjas: { weight: number; branch: Record<string, number>; sa: Record<string, number>; regionalReported: number };
};
