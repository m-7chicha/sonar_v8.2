// Math Engine Simulation - mimics the FastAPI core math engine
// All values are computed live from in-memory simulation state

export const BASE_TIME = 1713290000000;

export interface MachineState {
  id: string;
  status: "running" | "paused" | "stopped";
  product_name: string;
  units_produced: number;
  units_target: number;
  started_at: number; // timestamp
  last_status_change: number;
  downtime_reason: string | null;
  downtime_start: number | null;
  unit_margin: number;
  material_constant_k: number;
  defect_count: number;
  total_checks: number;
  ideal_speed: number; // target units per hour
  progress_delta?: number;
  progress_status?: "ahead" | "behind" | "on_track";
  location_x: number;
  location_y: number;
  history: { timestamp: string; oee: number; units: number }[];
}

// ─── SMART LEDGER INTERFACES ───────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  ref: string;
  name: string;
  qty_current: number;
  qty_min: number; // minimum threshold — triggers reorder alert
  unit_cost: number;
  zone: string;
  shelf: string;
  location: string;
  material_constant_k: number; // consumed per unit produced (mirrors machine k)
  linked_machine_id: string; // which machine depletes this item
  avg_daily_consumption: number; // rolling avg (units/day)
  lead_time_days: number;
  movements: InventoryMovement[];
}

export interface InventoryMovement {
  id: string;
  type: "production_depletion" | "receipt" | "manual_adjustment";
  qty: number; // negative = consumed, positive = received
  source: string; // e.g. machine ID or "manual"
  created_at: number; // timestamp
}

export interface PurchaseOrderSuggestion {
  id: string;
  item_id: string;
  item_ref: string;
  item_name: string;
  suggested_qty: number;
  estimated_cost: number;
  status: "pending" | "approved" | "sent";
  created_at: number;
}

export interface IncomingDelivery {
  id: string;
  order_ref: string;
  client: string;
  product: string;
  qty: number;
  expected_date: number; // timestamp
  logistics_manager: string;
  status: "scheduled" | "on_the_way" | "delayed" | "delivered";
  created_at: number;
}

// ─── CRM INTERFACES ────────────────────────────────────────────────────────

export interface Interaction {
  id: string;
  type: "call" | "email" | "meeting" | "whatsapp";
  notes: string;
  created_at: number;
}

export interface Deal {
  id: string;
  client_id: string;
  stage: "lead" | "contacted" | "negotiation" | "won" | "lost";
  amount: number;
  created_at: number;
  closed_at?: number;
}

export interface SavTicket {
  id: string;
  client_id: string;
  priority: "low" | "medium" | "critical";
  status: "open" | "in_progress" | "closed";
  description: string;
  opened_at: number;
  closed_at?: number;
}

export interface ClientOrder {
  id: string;
  client_id: string;
  product: string;
  qty: number;
  amount: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  created_at: number;
  delivery_date: number;
}

// ─── QUALITY CONTROL INTERFACES ─────────────────────────────────────────────

export type DefectType = 'welding_defect' | 'pressure_failure' | 'finishing_issue' | 'dimensional_error' | 'visual_check';
export type CorrectiveAction = 'repair' | 'rework' | 'rejection' | 'pending';

export interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  defect_type: DefectType;
}

export interface QualityChecklist {
  id: string;
  product_type: string;
  steps: ChecklistStep[];
}

export interface StepResult {
  step_id: string;
  result: 'pass' | 'fail';
  notes?: string;
}

export interface DefectRecord {
  id: string;
  batch_id: string;
  machine_id: string;
  step_id: string;
  defect_type: DefectType;
  description: string;
  corrective_action: CorrectiveAction;
  status: 'open' | 'in_progress' | 'closed';
  created_at: number;
  closed_at?: number;
}

export interface QualityBatch {
  id: string;
  machine_id: string;
  product_name: string;
  operator_id: string;
  units_checked: number;
  defect_count: number;
  defect_rate: number;
  checklist_id: string;
  step_results: StepResult[];
  defects: DefectRecord[];
  status: 'open' | 'passed' | 'failed' | 'rework';
  created_at: number;
  closed_at?: number;
}

export interface Client {
  id: string;
  name: string;
  sector: string;
  status: "prospect" | "negotiation" | "active" | "inactive";
  channel: string;
  sales_rep: string;
  first_contact: number;
  last_interaction: number;
  city: string;
  country: string;
  phone_primary: string;
  email: string;
  commercial_conditions: string;
  interactions: Interaction[];
  deals: Deal[];
  tickets: SavTicket[];
  orders: ClientOrder[];
  // Computed fields set by getLoyaltyScore
  loyalty_score?: number;
  category?: "VIP" | "Standard" | "At-Risk" | "Inactive";
  order_probability?: number;
}

// ─── CRM STATE ─────────────────────────────────────────────────────────────

const crmClients: Client[] = [
  {
    id: "CL-001", name: "Meridian Aero SA", sector: "Aerospace", status: "active",
    channel: "Trade Show", sales_rep: "Samira Benali", city: "Casablanca", country: "Morocco",
    first_contact: BASE_TIME - 365 * 86400000, last_interaction: BASE_TIME - 2 * 86400000,
    phone_primary: "+212 661 234 567", email: "procurement@meridian-aero.ma",
    commercial_conditions: "Net 60 · 5% volume discount above 500 units",
    interactions: [
      { id: "I001", type: "meeting", notes: "Q1 capacity review session, potential 200-unit order.", created_at: BASE_TIME - 2 * 86400000 },
      { id: "I002", type: "call", notes: "Confirmed delivery schedule for PO-2024-0041.", created_at: BASE_TIME - 5 * 86400000 },
      { id: "I003", type: "email", notes: "Sent updated product catalog and pricing grid.", created_at: BASE_TIME - 12 * 86400000 },
    ],
    deals: [
      { id: "D001", client_id: "CL-001", stage: "won", amount: 48000, created_at: BASE_TIME - 200 * 86400000, closed_at: BASE_TIME - 185 * 86400000 },
      { id: "D002", client_id: "CL-001", stage: "negotiation", amount: 62000, created_at: BASE_TIME - 15 * 86400000 },
    ],
    tickets: [
      { id: "T001", client_id: "CL-001", priority: "medium", status: "in_progress", description: "Calibration issue on MX02 batch #441.", opened_at: BASE_TIME - 3 * 86400000 }
    ],
    orders: [
      { id: "O001", client_id: "CL-001", product: "Primary Extruder Units", qty: 120, amount: 48000, status: "delivered", created_at: BASE_TIME - 185 * 86400000, delivery_date: BASE_TIME - 170 * 86400000 },
      { id: "O002", client_id: "CL-001", product: "Thermal Processor Pack", qty: 80, amount: 32000, status: "processing", created_at: BASE_TIME - 10 * 86400000, delivery_date: BASE_TIME + 15 * 86400000 },
    ]
  },
  {
    id: "CL-002", name: "Solaris Energie", sector: "Energy", status: "active",
    channel: "Cold Outreach", sales_rep: "Youssef Tazi", city: "Lyon", country: "France",
    first_contact: BASE_TIME - 200 * 86400000, last_interaction: BASE_TIME - 1 * 86400000,
    phone_primary: "+33 4 78 90 12 34", email: "operations@solaris-energie.fr",
    commercial_conditions: "Net 30 · Annual framework contract",
    interactions: [
      { id: "I004", type: "call", notes: "Discussed Q2 requirements — 300 cooling units expected.", created_at: BASE_TIME - 1 * 86400000 },
      { id: "I005", type: "whatsapp", notes: "Quick update on delivery ETA.", created_at: BASE_TIME - 4 * 86400000 },
    ],
    deals: [
      { id: "D003", client_id: "CL-002", stage: "won", amount: 75000, created_at: BASE_TIME - 150 * 86400000, closed_at: BASE_TIME - 130 * 86400000 },
      { id: "D004", client_id: "CL-002", stage: "won", amount: 55000, created_at: BASE_TIME - 60 * 86400000, closed_at: BASE_TIME - 45 * 86400000 },
    ],
    tickets: [],
    orders: [
      { id: "O003", client_id: "CL-002", product: "Cooling Module Array", qty: 200, amount: 75000, status: "delivered", created_at: BASE_TIME - 130 * 86400000, delivery_date: BASE_TIME - 115 * 86400000 },
      { id: "O004", client_id: "CL-002", product: "Cooling Module Array", qty: 150, amount: 55000, status: "shipped", created_at: BASE_TIME - 20 * 86400000, delivery_date: BASE_TIME + 5 * 86400000 },
    ]
  },
  {
    id: "CL-003", name: "Atlas Constructions", sector: "Construction", status: "negotiation",
    channel: "Referral", sales_rep: "Ahmed Karim", city: "Rabat", country: "Morocco",
    first_contact: BASE_TIME - 45 * 86400000, last_interaction: BASE_TIME - 8 * 86400000,
    phone_primary: "+212 537 456 789", email: "supply@atlas-constructions.ma",
    commercial_conditions: "Pending — evaluating payment terms",
    interactions: [
      { id: "I006", type: "meeting", notes: "Site visit completed. Decision expected in 2 weeks.", created_at: BASE_TIME - 8 * 86400000 },
      { id: "I007", type: "email", notes: "Sent technical proposal and references.", created_at: BASE_TIME - 18 * 86400000 },
    ],
    deals: [
      { id: "D005", client_id: "CL-003", stage: "negotiation", amount: 38000, created_at: BASE_TIME - 30 * 86400000 },
    ],
    tickets: [],
    orders: []
  },
  {
    id: "CL-004", name: "Nexagen Pharma", sector: "Pharmaceuticals", status: "active",
    channel: "LinkedIn", sales_rep: "Samira Benali", city: "Tunis", country: "Tunisia",
    first_contact: BASE_TIME - 500 * 86400000, last_interaction: BASE_TIME - 22 * 86400000,
    phone_primary: "+216 71 234 567", email: "procurement@nexagen-pharma.tn",
    commercial_conditions: "Net 45 · Quality certification required",
    interactions: [
      { id: "I008", type: "email", notes: "Renewal notice sent — no response yet.", created_at: BASE_TIME - 22 * 86400000 },
    ],
    deals: [
      { id: "D006", client_id: "CL-004", stage: "won", amount: 92000, created_at: BASE_TIME - 400 * 86400000, closed_at: BASE_TIME - 380 * 86400000 },
      { id: "D007", client_id: "CL-004", stage: "won", amount: 67000, created_at: BASE_TIME - 200 * 86400000, closed_at: BASE_TIME - 180 * 86400000 },
    ],
    tickets: [
      { id: "T002", client_id: "CL-004", priority: "critical", status: "open", description: "Batch contamination risk — urgent inspection requested.", opened_at: BASE_TIME - 2 * 86400000 },
    ],
    orders: [
      { id: "O005", client_id: "CL-004", product: "Final Packing Units", qty: 400, amount: 92000, status: "delivered", created_at: BASE_TIME - 380 * 86400000, delivery_date: BASE_TIME - 360 * 86400000 },
      { id: "O006", client_id: "CL-004", product: "Final Packing Units", qty: 300, amount: 67000, status: "delivered", created_at: BASE_TIME - 180 * 86400000, delivery_date: BASE_TIME - 160 * 86400000 },
    ]
  },
  {
    id: "CL-005", name: "Vega Automotive", sector: "Automotive", status: "prospect",
    channel: "Trade Show", sales_rep: "Youssef Tazi", city: "Tangier", country: "Morocco",
    first_contact: BASE_TIME - 10 * 86400000, last_interaction: BASE_TIME - 10 * 86400000,
    phone_primary: "+212 539 123 456", email: "supply.chain@vega-auto.ma",
    commercial_conditions: "First contact — no terms established",
    interactions: [
      { id: "I009", type: "meeting", notes: "Initial intro at AutoExpo 2024. Requested product catalog.", created_at: BASE_TIME - 10 * 86400000 },
    ],
    deals: [
      { id: "D008", client_id: "CL-005", stage: "lead", amount: 25000, created_at: BASE_TIME - 10 * 86400000 },
    ],
    tickets: [],
    orders: []
  },
  {
    id: "CL-006", name: "Helios Tech SARL", sector: "Technology", status: "inactive",
    channel: "Cold Outreach", sales_rep: "Ahmed Karim", city: "Paris", country: "France",
    first_contact: BASE_TIME - 700 * 86400000, last_interaction: BASE_TIME - 90 * 86400000,
    phone_primary: "+33 1 44 55 66 77", email: "ops@helios-tech.fr",
    commercial_conditions: "Contract expired — not renewed",
    interactions: [
      { id: "I010", type: "email", notes: "Sent re-engagement offer — no response.", created_at: BASE_TIME - 90 * 86400000 },
    ],
    deals: [
      { id: "D009", client_id: "CL-006", stage: "lost", amount: 30000, created_at: BASE_TIME - 300 * 86400000, closed_at: BASE_TIME - 280 * 86400000 },
    ],
    tickets: [],
    orders: [
      { id: "O007", client_id: "CL-006", product: "Primary Extruder Units", qty: 80, amount: 30000, status: "delivered", created_at: BASE_TIME - 280 * 86400000, delivery_date: BASE_TIME - 265 * 86400000 },
    ]
  }
];

// ─── CRM MATH FORMULAS ─────────────────────────────────────────────────────

// Loyalty Score: w1×frequency + w2×regularity + w3×relationship_length + w4×lifetime_value
//               + w5×offer_responsiveness + w6×satisfaction + w7×claims_history
export const getLoyaltyScore = (client: Client): number => {
  const monthsAsClient = (BASE_TIME - client.first_contact) / (30 * 86400000);
  const wonDeals = client.deals.filter(d => d.stage === "won");
  const totalRevenue = wonDeals.reduce((s, d) => s + d.amount, 0);
  const totalOrders = client.orders.length;

  const w1_frequency = Math.min(10, totalOrders / Math.max(1, monthsAsClient) * 10);
  const w2_regularity = Math.min(10, wonDeals.length * 2.5);
  const w3_relationship = Math.min(10, monthsAsClient / 6);
  const w4_lifetime_value = Math.min(10, totalRevenue / 20000);
  const w5_responsiveness = Math.min(10, client.interactions.length * 1.5);
  const w6_satisfaction = client.tickets.some(t => t.priority === "critical" && t.status === "open") ? 2 : 8;
  const w7_claims = Math.max(0, 10 - client.tickets.filter(t => t.status === "open").length * 3);

  const score = (w1_frequency + w2_regularity + w3_relationship + w4_lifetime_value +
                 w5_responsiveness + w6_satisfaction + w7_claims) / 7 * 10;
  return Math.min(100, Math.max(0, parseFloat(score.toFixed(1))));
};

// Order Probability: 1 - (days_since_last_order / avg_order_cycle_days)
export const getOrderProbability = (client: Client): number => {
  const deliveredOrders = client.orders.filter(o => o.status === "delivered");
  if (deliveredOrders.length < 2) return client.status === "active" ? 0.4 : 0.1;
  const sorted = [...deliveredOrders].sort((a, b) => a.created_at - b.created_at);
  const gaps = sorted.slice(1).map((o, i) => (o.created_at - sorted[i].created_at) / 86400000);
  const avgCycleDays = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const daysSinceLast = (Date.now() - sorted[sorted.length - 1].created_at) / 86400000;
  return Math.min(0.99, Math.max(0, parseFloat((1 - daysSinceLast / avgCycleDays).toFixed(2))));
};

// Client category from loyalty score
export const getClientCategory = (score: number): "VIP" | "Standard" | "At-Risk" | "Inactive" => {
  if (score >= 75) return "VIP";
  if (score >= 45) return "Standard";
  if (score >= 20) return "At-Risk";
  return "Inactive";
};

// Enrich all clients with computed scores
export const getEnrichedClients = (): Client[] =>
  crmClients.map(c => {
    const score = getLoyaltyScore(c);
    return {
      ...c,
      loyalty_score: score,
      category: getClientCategory(score),
      order_probability: getOrderProbability(c)
    };
  });

// CRM Alerts (Block B)
export const getCRMAlerts = () => {
  const alerts: { id: string; type: "critical" | "warning" | "info"; message: string; client_id: string }[] = [];
  crmClients.forEach(client => {
    const daysSinceLast = (Date.now() - client.last_interaction) / 86400000;
    const score = getLoyaltyScore(client);

    // VIP inactive > 14d
    if (score >= 75 && daysSinceLast > 14)
      alerts.push({ id: `crm-vip-${client.id}`, type: "critical", message: `VIP client ${client.name} — no contact in ${Math.floor(daysSinceLast)}d`, client_id: client.id });

    // General inactivity > 30d
    else if (client.status === "active" && daysSinceLast > 30)
      alerts.push({ id: `crm-inactive-${client.id}`, type: "warning", message: `${client.name} inactive for ${Math.floor(daysSinceLast)} days`, client_id: client.id });

    // Critical open SAV ticket
    client.tickets.filter(t => t.priority === "critical" && t.status === "open").forEach(t => {
      const ageH = (Date.now() - t.opened_at) / 3600000;
      alerts.push({ id: `crm-sav-${t.id}`, type: "critical", message: `Critical ticket open for ${Math.floor(ageH)}h — ${client.name}: ${t.description.slice(0, 50)}`, client_id: client.id });
    });

    // Stagnant negotiation deal > 20d
    client.deals.filter(d => d.stage === "negotiation").forEach(d => {
      const daysInStage = (Date.now() - d.created_at) / 86400000;
      if (daysInStage > 20)
        alerts.push({ id: `crm-deal-${d.id}`, type: "warning", message: `Deal stagnant ${Math.floor(daysInStage)}d — ${client.name} (€${d.amount.toLocaleString()})`, client_id: client.id });
    });
  });
  return alerts;
};

// Full CRM state getter
export const getCRMState = () => ({
  clients: getEnrichedClients(),
  alerts: getCRMAlerts(),
  pipeline: crmClients.flatMap(c => c.deals),
  totalRevenue: crmClients.flatMap(c => c.deals.filter(d => d.stage === "won")).reduce((s, d) => s + d.amount, 0),
  activeClients: crmClients.filter(c => c.status === "active").length,
  openTickets: crmClients.flatMap(c => c.tickets.filter(t => t.status !== "closed")).length,
});

// ─── QUALITY CONTROL STATE ─────────────────────────────────────────────────

export const checklistTemplates: QualityChecklist[] = [
  {
    id: 'CL-MX01', product_type: 'Primary Extruder',
    steps: [
      { id: 'S1', label: 'Weld Joint Inspection', description: 'Inspect all weld joints for cracks, porosity, and incomplete fusion', defect_type: 'welding_defect' },
      { id: 'S2', label: 'Dimensional Tolerances', description: 'Verify extrusion diameter within ±0.05mm tolerance using micrometer', defect_type: 'dimensional_error' },
      { id: 'S3', label: 'Surface Finishing', description: 'Check surface roughness Ra ≤ 1.6μm, no burrs or sharp edges', defect_type: 'finishing_issue' },
      { id: 'S4', label: 'Hydraulic Pressure Test', description: '150% working pressure for 30 min — zero leaks tolerated', defect_type: 'pressure_failure' },
      { id: 'S5', label: 'Final Visual Inspection', description: 'Color, CE marking, label placement, packaging integrity', defect_type: 'visual_check' },
    ]
  },
  {
    id: 'CL-MX02', product_type: 'Thermal Processor',
    steps: [
      { id: 'S1', label: 'Thermal Seal Integrity', description: 'IR camera scan — no heat bridges or cold spots', defect_type: 'pressure_failure' },
      { id: 'S2', label: 'MIG Weld Quality', description: 'Visual + dye penetrant test on critical joints', defect_type: 'welding_defect' },
      { id: 'S3', label: 'Plate Thickness (5-point)', description: 'Micrometer check: thickness ±0.1mm at 5 random sample points', defect_type: 'dimensional_error' },
      { id: 'S4', label: 'Surface Coating Adhesion', description: 'Coating adhesion test — no peel, bubble, or rust spots', defect_type: 'finishing_issue' },
      { id: 'S5', label: 'Assembly & Torque Check', description: 'Fastener torque verification, component alignment inspection', defect_type: 'visual_check' },
    ]
  },
  {
    id: 'CL-MX03', product_type: 'Cooling Module',
    steps: [
      { id: 'S1', label: 'Pneumatic Leak Test', description: '6 bar test for 15 min — zero tolerance for leaks', defect_type: 'pressure_failure' },
      { id: 'S2', label: 'Fin Spacing Alignment', description: 'Cooling fin spacing: gap within spec ±0.2mm with go/no-go gauge', defect_type: 'dimensional_error' },
      { id: 'S3', label: 'Header Tank Weld (UT)', description: 'Ultrasonic probe on all header welds — no voids < 2mm', defect_type: 'welding_defect' },
      { id: 'S4', label: 'Powder Coat Uniformity', description: 'Coating thickness 60–80μm, CE mark + part number legible', defect_type: 'finishing_issue' },
      { id: 'S5', label: 'Flow Rate Performance Test', description: 'Flow at rated RPM must reach ≥ 95% of spec value', defect_type: 'visual_check' },
    ]
  },
  {
    id: 'CL-MX04', product_type: 'Final Packing',
    steps: [
      { id: 'S1', label: 'Label & Barcode Accuracy', description: 'Batch code, expiry, CE mark, and barcode scan on all units', defect_type: 'visual_check' },
      { id: 'S2', label: 'Heat Seal Integrity', description: 'No voids, wrinkles, or delamination — peel force ≥ 8N', defect_type: 'finishing_issue' },
      { id: 'S3', label: 'Unit Count Verification', description: 'Box count must match packing list ±0 units', defect_type: 'dimensional_error' },
      { id: 'S4', label: 'Carton Drop Test (1m)', description: 'Drop from 1m on all 6 faces — no damage to inner units', defect_type: 'pressure_failure' },
      { id: 'S5', label: 'Documentation Completeness', description: 'CoC, packing list, and customs docs complete and accurate', defect_type: 'visual_check' },
    ]
  }
];

let qualityBatches: QualityBatch[] = [
  {
    id: 'BATCH-MX01-001', machine_id: 'MX01', product_name: 'Primary Extruder', operator_id: 'OP-Karim',
    units_checked: 50, defect_count: 1, defect_rate: 0.02, checklist_id: 'CL-MX01',
    step_results: [
      { step_id: 'S1', result: 'pass' }, { step_id: 'S2', result: 'fail', notes: 'Diameter at 0.06mm over tolerance on 3 units' },
      { step_id: 'S3', result: 'pass' }, { step_id: 'S4', result: 'pass' }, { step_id: 'S5', result: 'pass' }
    ],
    defects: [{ id: 'DEF-001', batch_id: 'BATCH-MX01-001', machine_id: 'MX01', step_id: 'S2', defect_type: 'dimensional_error', description: 'Diameter over tolerance on 3 units', corrective_action: 'rework', status: 'closed', created_at: BASE_TIME - 3 * 86400000, closed_at: BASE_TIME - 2 * 86400000 }],
    status: 'rework', created_at: BASE_TIME - 3 * 86400000, closed_at: BASE_TIME - 2 * 86400000
  },
  {
    id: 'BATCH-MX01-002', machine_id: 'MX01', product_name: 'Primary Extruder', operator_id: 'OP-Samira',
    units_checked: 60, defect_count: 0, defect_rate: 0, checklist_id: 'CL-MX01',
    step_results: [
      { step_id: 'S1', result: 'pass' }, { step_id: 'S2', result: 'pass' },
      { step_id: 'S3', result: 'pass' }, { step_id: 'S4', result: 'pass' }, { step_id: 'S5', result: 'pass' }
    ],
    defects: [], status: 'passed', created_at: BASE_TIME - 86400000, closed_at: BASE_TIME - 80000000
  },
  {
    id: 'BATCH-MX03-001', machine_id: 'MX03', product_name: 'Cooling Module', operator_id: 'OP-Youssef',
    units_checked: 40, defect_count: 2, defect_rate: 0.05, checklist_id: 'CL-MX03',
    step_results: [
      { step_id: 'S1', result: 'fail', notes: 'Minor leak detected at header joint on unit #17' }, { step_id: 'S2', result: 'pass' },
      { step_id: 'S3', result: 'pass' }, { step_id: 'S4', result: 'fail', notes: 'CE marking illegible on 2 units' }, { step_id: 'S5', result: 'pass' }
    ],
    defects: [
      { id: 'DEF-002', batch_id: 'BATCH-MX03-001', machine_id: 'MX03', step_id: 'S1', defect_type: 'pressure_failure', description: 'Minor leak at header joint on unit #17', corrective_action: 'repair', status: 'in_progress', created_at: BASE_TIME - 2 * 86400000 },
      { id: 'DEF-003', batch_id: 'BATCH-MX03-001', machine_id: 'MX03', step_id: 'S4', defect_type: 'finishing_issue', description: 'CE marking illegible on 2 units', corrective_action: 'rework', status: 'open', created_at: BASE_TIME - 2 * 86400000 }
    ],
    status: 'rework', created_at: BASE_TIME - 2 * 86400000
  },
  {
    id: 'BATCH-MX04-001', machine_id: 'MX04', product_name: 'Final Packing', operator_id: 'OP-Karim',
    units_checked: 100, defect_count: 5, defect_rate: 0.05, checklist_id: 'CL-MX04',
    step_results: [
      { step_id: 'S1', result: 'pass' }, { step_id: 'S2', result: 'fail', notes: 'Delamination on 3 cartons batch ref MX04-B12' },
      { step_id: 'S3', result: 'pass' }, { step_id: 'S4', result: 'fail', notes: 'Inner unit damaged — carton crush on 2 drop tests' }, { step_id: 'S5', result: 'pass' }
    ],
    defects: [
      { id: 'DEF-004', batch_id: 'BATCH-MX04-001', machine_id: 'MX04', step_id: 'S2', defect_type: 'finishing_issue', description: 'Delamination on 3 cartons — batch MX04-B12', corrective_action: 'rejection', status: 'closed', created_at: BASE_TIME - 86400000, closed_at: BASE_TIME - 60000000 },
      { id: 'DEF-005', batch_id: 'BATCH-MX04-001', machine_id: 'MX04', step_id: 'S4', defect_type: 'pressure_failure', description: 'Inner unit damaged in carton drop test', corrective_action: 'rejection', status: 'closed', created_at: BASE_TIME - 86400000, closed_at: BASE_TIME - 60000000 }
    ],
    status: 'failed', created_at: BASE_TIME - 86400000, closed_at: BASE_TIME - 55000000
  },
  {
    id: 'BATCH-MX02-001', machine_id: 'MX02', product_name: 'Thermal Processor', operator_id: 'OP-Samira',
    units_checked: 30, defect_count: 0, defect_rate: 0, checklist_id: 'CL-MX02',
    step_results: [
      { step_id: 'S1', result: 'pass' }, { step_id: 'S2', result: 'pass' },
      { step_id: 'S3', result: 'pass' }, { step_id: 'S4', result: 'pass' }, { step_id: 'S5', result: 'pass' }
    ],
    defects: [], status: 'passed', created_at: BASE_TIME - 4 * 86400000, closed_at: BASE_TIME - 4 * 86400000 + 3600000
  }
];

// ─── QUALITY CONTROL FUNCTIONS ─────────────────────────────────────────────

// Defect_Rate = defect_count / total_units_checked
export const getDefectRate = (machineId: string): number => {
  const batches = qualityBatches.filter(b => b.machine_id === machineId);
  if (!batches.length) return 0;
  const totalChecked = batches.reduce((s, b) => s + b.units_checked, 0);
  const totalDefects = batches.reduce((s, b) => s + b.defect_count, 0);
  return totalChecked > 0 ? parseFloat((totalDefects / totalChecked).toFixed(4)) : 0;
};

// Full quality state getter
export const getQualityState = () => ({
  batches: [...qualityBatches],
  templates: checklistTemplates,
  allDefects: qualityBatches.flatMap(b => b.defects),
  totalBatches: qualityBatches.length,
  totalDefects: qualityBatches.reduce((s, b) => s + b.defect_count, 0),
  passRate: qualityBatches.length > 0
    ? parseFloat((qualityBatches.filter(b => b.status === 'passed').length / qualityBatches.length * 100).toFixed(1))
    : 100,
  defectsByType: (['welding_defect', 'pressure_failure', 'finishing_issue', 'dimensional_error', 'visual_check'] as DefectType[]).map(type => ({
    type,
    count: qualityBatches.flatMap(b => b.defects).filter(d => d.defect_type === type).length
  }))
});

// Quality Alerts
export const getQualityAlerts = (): { id: string; type: 'critical' | 'warning'; message: string; machine_id: string }[] => {
  const alerts: { id: string; type: 'critical' | 'warning'; message: string; machine_id: string }[] = [];
  ['MX01', 'MX02', 'MX03', 'MX04'].forEach(machineId => {
    const rate = getDefectRate(machineId);
    const openDefects = qualityBatches.filter(b => b.machine_id === machineId).flatMap(b => b.defects).filter(d => d.status !== 'closed');
    if (rate > 0.08)
      alerts.push({ id: `qc-rate-${machineId}`, type: 'critical', message: `Node ${machineId} defect rate critical: ${(rate * 100).toFixed(1)}% — exceeds 8% threshold`, machine_id: machineId });
    else if (rate > 0.04)
      alerts.push({ id: `qc-rate-warn-${machineId}`, type: 'warning', message: `Node ${machineId} defect rate elevated: ${(rate * 100).toFixed(1)}%`, machine_id: machineId });
    if (openDefects.length > 0)
      alerts.push({ id: `qc-open-${machineId}`, type: openDefects.some(d => d.corrective_action === 'pending') ? 'critical' : 'warning', message: `${openDefects.length} unresolved defect(s) on Node ${machineId}`, machine_id: machineId });
  });
  return alerts;
};

// Submit a new quality checklist — feeds directly into OEE
export const submitChecklist = (
  machineId: string,
  operatorId: string,
  batchId: string,
  stepResults: StepResult[],
  unitsChecked: number
): QualityBatch => {
  const template = checklistTemplates.find(t => {
    const m = machines.find(m => m.id === machineId);
    return m && t.product_type === m.product_name;
  });
  if (!template) throw new Error(`No checklist template for machine ${machineId}`);

  const failedSteps = stepResults.filter(r => r.result === 'fail');
  const defects: DefectRecord[] = failedSteps.map((r, i) => {
    const step = template.steps.find(s => s.id === r.step_id)!;
    return {
      id: `DEF-NEW-${Date.now()}-${i}`,
      batch_id: batchId,
      machine_id: machineId,
      step_id: r.step_id,
      defect_type: step.defect_type,
      description: r.notes || step.label,
      corrective_action: 'pending',
      status: 'open',
      created_at: Date.now()
    };
  });

  const defectCount = failedSteps.length;
  const defectRate = stepResults.length > 0 ? defectCount / stepResults.length : 0;
  const batchStatus: QualityBatch['status'] = defectCount === 0 ? 'passed' : defectRate > 0.3 ? 'failed' : 'rework';

  const batch: QualityBatch = {
    id: batchId,
    machine_id: machineId,
    product_name: machines.find(m => m.id === machineId)?.product_name || machineId,
    operator_id: operatorId,
    units_checked: unitsChecked,
    defect_count: defectCount,
    defect_rate: defectRate,
    checklist_id: template.id,
    step_results: stepResults,
    defects,
    status: batchStatus,
    created_at: Date.now(),
    closed_at: Date.now()
  };

  qualityBatches = [batch, ...qualityBatches];

  // ── QC → OEE FEEDBACK LOOP: update machine defect_count and total_checks ──
  machines = machines.map(m => {
    if (m.id !== machineId) return m;
    return {
      ...m,
      defect_count: m.defect_count + defectCount,
      total_checks: m.total_checks + unitsChecked
    };
  });

  // Cascade: recompute OEE → notify all dashboard subscribers
  notifySubscribers();
  return batch;
};

// Resolve a defect with corrective action
export const resolveDefect = (defectId: string, action: CorrectiveAction): void => {
  qualityBatches = qualityBatches.map(batch => ({
    ...batch,
    defects: batch.defects.map(d =>
      d.id === defectId
        ? { ...d, corrective_action: action, status: 'closed' as const, closed_at: Date.now() }
        : d
    )
  }));
  notifySubscribers();
};

let machines: MachineState[] = [
  {
    id: "MX01",
    status: "running",
    product_name: "Primary Extruder",
    units_produced: 120,
    units_target: 200,
    started_at: BASE_TIME - 8 * 60 * 60 * 1000,
    last_status_change: BASE_TIME - 2 * 60 * 60 * 1000,
    downtime_reason: null,
    downtime_start: null,
    unit_margin: 25.5,
    material_constant_k: 0.8,
    defect_count: 2,
    total_checks: 100,
    ideal_speed: 25,
    location_x: 50,
    location_y: 200,
    history: Array.from({length: 12}, (_, i) => ({
      timestamp: `${8+i}:00`,
      oee: 70 + Math.random() * 20,
      units: i * 15
    }))
  },
  {
    id: "MX02",
    status: "stopped",
    product_name: "Thermal Processor",
    units_produced: 85,
    units_target: 150,
    started_at: BASE_TIME - 10 * 60 * 60 * 1000,
    last_status_change: BASE_TIME - 30 * 60 * 1000,
    downtime_reason: "material_shortage",
    downtime_start: BASE_TIME - 30 * 60 * 1000,
    unit_margin: 30.0,
    material_constant_k: 1.2,
    defect_count: 1,
    total_checks: 85,
    ideal_speed: 20,
    location_x: 350,
    location_y: 50,
    history: Array.from({length: 12}, (_, i) => ({
      timestamp: `${8+i}:00`,
      oee: 40 + Math.random() * 30,
      units: i * 8
    }))
  },
  {
    id: "MX03",
    status: "running",
    product_name: "Cooling Module",
    units_produced: 200,
    units_target: 180,
    started_at: BASE_TIME - 12 * 60 * 60 * 1000,
    last_status_change: BASE_TIME,
    downtime_reason: null,
    downtime_start: null,
    unit_margin: 22.0,
    material_constant_k: 0.5,
    defect_count: 0,
    total_checks: 200,
    ideal_speed: 30,
    location_x: 350,
    location_y: 350,
    history: Array.from({length: 12}, (_, i) => ({
      timestamp: `${8+i}:00`,
      oee: 80 + Math.random() * 15,
      units: i * 20
    }))
  },
  {
    id: "MX04",
    status: "running",
    product_name: "Final Packing",
    units_produced: 450,
    units_target: 600,
    started_at: BASE_TIME - 24 * 60 * 60 * 1000,
    last_status_change: BASE_TIME,
    downtime_reason: null,
    downtime_start: null,
    unit_margin: 15.0,
    material_constant_k: 0.3,
    defect_count: 5,
    total_checks: 455,
    ideal_speed: 50,
    location_x: 650,
    location_y: 200,
    history: Array.from({length: 12}, (_, i) => ({
      timestamp: `${8+i}:00`,
      oee: 85 + Math.random() * 10,
      units: i * 40
    }))
  }
];

// ─── INVENTORY STATE ───────────────────────────────────────────────────────

let inventoryItems: InventoryItem[] = [
  {
    id: "INV-001",
    ref: "RAW-ALU-5083",
    name: "Aluminium Alloy 5083",
    qty_current: 1240,
    qty_min: 400,
    unit_cost: 3.8,
    zone: "A",
    shelf: "A-03",
    location: "A-03-B",
    material_constant_k: 0.8,
    linked_machine_id: "MX01",
    avg_daily_consumption: 160,
    lead_time_days: 5,
    movements: [
      { id: "M001", type: "receipt", qty: 2000, source: "Supplier SUD-MET", created_at: BASE_TIME - 7 * 86400000 },
      { id: "M002", type: "production_depletion", qty: -760, source: "MX01", created_at: BASE_TIME - 86400000 },
    ]
  },
  {
    id: "INV-002",
    ref: "RAW-STST-316L",
    name: "Stainless Steel 316L",
    qty_current: 320,
    qty_min: 350,
    unit_cost: 6.2,
    zone: "A",
    shelf: "A-07",
    location: "A-07-C",
    material_constant_k: 1.2,
    linked_machine_id: "MX02",
    avg_daily_consumption: 102,
    lead_time_days: 7,
    movements: [
      { id: "M003", type: "receipt", qty: 1500, source: "Supplier ACIER-PLUS", created_at: BASE_TIME - 14 * 86400000 },
      { id: "M004", type: "production_depletion", qty: -1180, source: "MX02", created_at: BASE_TIME - 86400000 },
    ]
  },
  {
    id: "INV-003",
    ref: "CHEM-COOL-HC32",
    name: "Cooling Fluid HC-32",
    qty_current: 890,
    qty_min: 200,
    unit_cost: 1.4,
    zone: "B",
    shelf: "B-02",
    location: "B-02-A",
    material_constant_k: 0.5,
    linked_machine_id: "MX03",
    avg_daily_consumption: 120,
    lead_time_days: 3,
    movements: [
      { id: "M005", type: "receipt", qty: 1000, source: "Supplier CHIMIX", created_at: BASE_TIME - 5 * 86400000 },
      { id: "M006", type: "production_depletion", qty: -110, source: "MX03", created_at: BASE_TIME - 86400000 },
    ]
  },
  {
    id: "INV-004",
    ref: "PKG-BOX-L40",
    name: "Protective Packaging L40",
    qty_current: 4800,
    qty_min: 1000,
    unit_cost: 0.22,
    zone: "C",
    shelf: "C-01",
    location: "C-01-A",
    material_constant_k: 0.3,
    linked_machine_id: "MX04",
    avg_daily_consumption: 360,
    lead_time_days: 2,
    movements: [
      { id: "M007", type: "receipt", qty: 6000, source: "Supplier PACKPRO", created_at: BASE_TIME - 3 * 86400000 },
      { id: "M008", type: "production_depletion", qty: -1200, source: "MX04", created_at: BASE_TIME - 86400000 },
    ]
  }
];

// Auto-generated purchase orders when stock drops below minimum
let purchaseOrders: PurchaseOrderSuggestion[] = [];

// Upcoming / incoming deliveries
const incomingDeliveries: IncomingDelivery[] = [
  {
    id: "DEL-001",
    order_ref: "PO-2024-0041",
    client: "2MP Industrie",
    product: "Aluminium Alloy 5083 — 2000 kg",
    qty: 2000,
    expected_date: BASE_TIME + 2 * 86400000,
    logistics_manager: "Ahmed Karim",
    status: "on_the_way",
    created_at: BASE_TIME - 3 * 86400000
  },
  {
    id: "DEL-002",
    order_ref: "PO-2024-0039",
    client: "2MP Industrie",
    product: "Stainless Steel 316L — 1500 kg",
    qty: 1500,
    expected_date: BASE_TIME - 86400000,
    logistics_manager: "Samira Benali",
    status: "delayed",
    created_at: BASE_TIME - 10 * 86400000
  },
  {
    id: "DEL-003",
    order_ref: "PO-2024-0042",
    client: "2MP Industrie",
    product: "Protective Packaging L40 — 5000 units",
    qty: 5000,
    expected_date: BASE_TIME + 5 * 86400000,
    logistics_manager: "Youssef Tazi",
    status: "scheduled",
    created_at: BASE_TIME - 86400000
  }
];

// ─── INVENTORY FUNCTIONS ───────────────────────────────────────────────────

// Inventory depletion on tick: Inventory_new = Inventory_old - (units_produced_delta × k)
const depleteInventory = (machineId: string, unitsProducedDelta: number) => {
  inventoryItems = inventoryItems.map(item => {
    if (item.linked_machine_id !== machineId) return item;
    const consumed = unitsProducedDelta * item.material_constant_k;
    const newQty = Math.max(0, item.qty_current - consumed);
    const movement: InventoryMovement = {
      id: `M-${Date.now()}-${machineId}`,
      type: "production_depletion",
      qty: -consumed,
      source: machineId,
      created_at: Date.now()
    };
    // Auto-generate purchase order suggestion if below minimum and none pending
    if (newQty < item.qty_min && !purchaseOrders.find(po => po.item_id === item.id && po.status === "pending")) {
      const forecastQty = item.avg_daily_consumption * (item.lead_time_days + 7);
      purchaseOrders = [
        ...purchaseOrders,
        {
          id: `PO-AUTO-${Date.now()}`,
          item_id: item.id,
          item_ref: item.ref,
          item_name: item.name,
          suggested_qty: Math.ceil(forecastQty),
          estimated_cost: parseFloat((Math.ceil(forecastQty) * item.unit_cost).toFixed(2)),
          status: "pending",
          created_at: Date.now()
        }
      ];
    }
    return {
      ...item,
      qty_current: parseFloat(newQty.toFixed(2)),
      movements: [...item.movements.slice(-49), movement]
    };
  });
};

// Demand Forecast: Forecast_Qty = avg_daily_consumption × horizon_days + safety_buffer
export const getForecastQty = (item: InventoryItem, horizonDays = 30): number => {
  const safetyBuffer = item.avg_daily_consumption * item.lead_time_days;
  return Math.ceil(item.avg_daily_consumption * horizonDays + safetyBuffer);
};

// Inventory state getter
export const getInventoryState = () => ({
  items: [...inventoryItems],
  purchaseOrders: [...purchaseOrders],
  deliveries: [...incomingDeliveries]
});

// Get low stock items (qty_current < qty_min)
export const getLowStockItems = () =>
  inventoryItems.filter(i => i.qty_current < i.qty_min);

// Overall warehouse health score 0–100
export const getStockHealthScore = (): number => {
  const scores = inventoryItems.map(i => Math.min(100, (i.qty_current / (i.qty_min * 2)) * 100));
  return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
};

// Manual stock receipt (supplier delivery arrives)
export const addStockReceipt = (itemId: string, qty: number, source: string) => {
  inventoryItems = inventoryItems.map(item => {
    if (item.id !== itemId) return item;
    const movement: InventoryMovement = {
      id: `M-RCV-${Date.now()}`,
      type: "receipt",
      qty,
      source,
      created_at: Date.now()
    };
    purchaseOrders = purchaseOrders.map(po =>
      po.item_id === itemId && po.status === "pending" ? { ...po, status: "approved" as const } : po
    );
    return {
      ...item,
      qty_current: parseFloat((item.qty_current + qty).toFixed(2)),
      movements: [...item.movements.slice(-49), movement]
    };
  });
  notifyInventorySubscribers();
};

// List of subscribers for real-time updates
const subscribers: Array<(data: { machines: MachineState[]; executivePulse: ExecutivePulseMetrics; inventory: ReturnType<typeof getInventoryState> }) => void> = [];

// Inventory-only subscribers
const inventorySubscribers: Array<() => void> = [];
const notifyInventorySubscribers = () => inventorySubscribers.forEach(cb => cb());

// Simulation tick interval (5 seconds for demo)
const TICK_INTERVAL_MS = 5000;

// Start simulation tick
let simulationInterval: NodeJS.Timeout | undefined;

export const subscribeToInventory = (cb: () => void) => {
  inventorySubscribers.push(cb);
  return () => {
    const idx = inventorySubscribers.indexOf(cb);
    if (idx > -1) inventorySubscribers.splice(idx, 1);
  };
};

// OEE Calculation Functions
export const calculateAvailability = (machine: MachineState): number => {
  if (machine.status === "stopped" && machine.downtime_start !== null) {
    const downtimeMs = Date.now() - machine.downtime_start;
    const totalTimeMs = Date.now() - machine.started_at;
    return (totalTimeMs - downtimeMs) / totalTimeMs;
  }
  return 1.0; // No downtime
};

export const calculatePerformance = (machine: MachineState): number => {
  const timeRunningMs =
    machine.status === "stopped" && machine.downtime_start !== null
      ? machine.downtime_start - machine.started_at
      : Date.now() - machine.started_at;
  const hoursRunning = timeRunningMs / (60 * 60 * 1000);
  const expectedUnits = machine.ideal_speed * hoursRunning;
  return expectedUnits > 0 ? machine.units_produced / expectedUnits : 0;
};

export const calculateQuality = (machine: MachineState): number => {
  return machine.total_checks > 0
    ? 1 - machine.defect_count / machine.total_checks
    : 1;
};

export const calculateOEE = (machine: MachineState): number => {
  const availability = calculateAvailability(machine);
  const performance = calculatePerformance(machine);
  const quality = calculateQuality(machine);
  return availability * performance * quality;
};

export interface Alert {
  id: string;
  module: "production" | "inventory" | "sav" | "logistics" | "crm" | "quality";
  type: "critical" | "warning" | "info";
  message: string;
  triggered_at: number;
}

interface ExecutivePulseMetrics {
  totalMachines: number;
  runningMachines: number;
  pausedMachines: number;
  stoppedMachines: number;
  globalOEE: number; // as percentage
  revenueAtRisk: number;
  alerts: Alert[];
}

// Executive Pulse Metrics
export const getExecutivePulseMetrics = (): ExecutivePulseMetrics => {
  const totalMachines = machines.length;
  const runningMachines = machines.filter((m) => m.status === "running").length;
  const pausedMachines = machines.filter((m) => m.status === "paused").length;
  const stoppedMachines = machines.filter((m) => m.status === "stopped").length;
  
  const globalOEE =
    machines.reduce((sum, m) => sum + calculateOEE(m), 0) / totalMachines || 0;
    
  const revenueAtRisk = machines
    .filter((m) => m.status === "stopped")
    .reduce(
      (sum, m) => {
        if (m.downtime_start !== null) {
          const downtimeMin = (Date.now() - m.downtime_start) / (60 * 1000);
          const expectedThroughputPerMin = m.ideal_speed / 60;
          return (
            sum +
            downtimeMin *
              m.unit_margin *
              expectedThroughputPerMin
          );
        }
        return sum;
      },
      0
    );

  const alerts: Alert[] = [];
  
  // Machine Stoppage Alerts
  machines.forEach(m => {
    if (m.status === "stopped" && m.downtime_start) {
      const downtimeMin = (Date.now() - m.downtime_start) / (60 * 1000);
      if (downtimeMin > 10) {
        alerts.push({
          id: `alert-stop-${m.id}`,
          module: "production",
          type: "critical",
          message: `Node ${m.id} stopped for >10m (${m.downtime_reason})`,
          triggered_at: m.downtime_start
        });
      }
    }
    
    const oee = calculateOEE(m);
    if (m.status === "running" && oee < 0.4) {
      alerts.push({
        id: `alert-oee-${m.id}`,
        module: "production",
        type: "warning",
        message: `Low efficiency on Node ${m.id}: ${(oee * 100).toFixed(1)}%`,
        triggered_at: Date.now()
      });
    }
  });

  // Inventory Low-Stock Alerts (cascade from Smart Ledger)
  getLowStockItems().forEach(item => {
    alerts.push({
      id: `alert-stock-${item.id}`,
      module: "inventory",
      type: item.qty_current < item.qty_min * 0.5 ? "critical" : "warning",
      message: `Low stock: ${item.name} — ${item.qty_current.toFixed(0)} remaining (min: ${item.qty_min})`,
      triggered_at: Date.now()
    });
  });

  // Delayed delivery alerts
  incomingDeliveries.forEach(del => {
    if (del.status === "delayed") {
      alerts.push({
        id: `alert-del-${del.id}`,
        module: "logistics",
        type: "warning",
        message: `Delivery delayed: ${del.product} (Ref: ${del.order_ref})`,
        triggered_at: del.expected_date
      });
    }
  });

  // CRM Smart Alerts (Loyalty dips, stagnant deals, critical SAV)
  getCRMAlerts().forEach(alert => {
    alerts.push({
      id: alert.id,
      module: "crm",
      type: alert.type as 'critical' | 'warning',
      message: alert.message,
      triggered_at: Date.now()
    });
  });

  // Quality Control Alerts (defect rate > threshold / open defects)
  getQualityAlerts().forEach(alert => {
    alerts.push({
      id: alert.id,
      module: "quality",
      type: alert.type,
      message: alert.message,
      triggered_at: Date.now()
    });
  });

  return {
    totalMachines,
    runningMachines,
    pausedMachines,
    stoppedMachines,
    globalOEE: parseFloat((globalOEE * 100).toFixed(2)), // as percentage
    revenueAtRisk: parseFloat(revenueAtRisk.toFixed(2)),
    alerts
  };
};

// Notify all subscribers
const notifySubscribers = () => {
  const data = {
    machines: [...machines],
    executivePulse: getExecutivePulseMetrics(),
    inventory: getInventoryState()
  };
  subscribers.forEach(callback => callback(data));
};

// Start the simulation
export const startSimulation = () => {
  if (simulationInterval) return;
  
  simulationInterval = setInterval(() => {
    // Increment units produced and calculate deltas
    machines = machines.map((machine) => {
      const updatedMachine = { ...machine };
      
      if (machine.status === "running") {
        const unitsPerTick = (machine.ideal_speed * TICK_INTERVAL_MS) / (60 * 60 * 1000);
        updatedMachine.units_produced += unitsPerTick;
        // ── SMART LEDGER CASCADE: deplete inventory on every tick ──
        depleteInventory(machine.id, unitsPerTick);
      }

      // Calculate gap/delta
      const hoursElapsed = (Date.now() - machine.started_at) / (60 * 60 * 1000);
      const expectedAtThisTime = machine.ideal_speed * hoursElapsed;
      const delta = updatedMachine.units_produced - expectedAtThisTime;
      
      updatedMachine.progress_delta = parseFloat(delta.toFixed(1));
      updatedMachine.progress_status = delta > 5 ? "ahead" : delta < -5 ? "behind" : "on_track";

      // Append to history periodically
      if (Math.random() > 0.9) {
        updatedMachine.history = [
          ...updatedMachine.history.slice(-19),
          { 
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
            oee: parseFloat((calculateOEE(updatedMachine) * 100).toFixed(1)),
            units: Math.floor(updatedMachine.units_produced)
          }
        ];
      }

      return updatedMachine;
    });
    
    // Notify subscribers of update
    notifySubscribers();
  }, TICK_INTERVAL_MS);
};

// Stop the simulation
export const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = undefined;
  }
};

// Subscribe to updates
export const subscribeToUpdates = (callback: (data: { machines: MachineState[]; executivePulse: ExecutivePulseMetrics; inventory: ReturnType<typeof getInventoryState> }) => void) => {
  subscribers.push(callback);
  // Initial call with current state
  callback({
    machines: [...machines],
    executivePulse: getExecutivePulseMetrics(),
    inventory: getInventoryState()
  });
  
  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
};

// Get machine data for Digital Twin
export const getMachines = () => [...machines];

// Update machine status (for UI interaction)
export const updateMachineStatus = (
  id: string,
  status: MachineState["status"],
  reason: string | null = null
) => {
  machines = machines.map((m) =>
    m.id === id
      ? {
          ...m,
          status,
          last_status_change: Date.now(),
          ...(status === "stopped" && reason
            ? { downtime_reason: reason, downtime_start: Date.now() }
            : status !== "stopped"
            ? { downtime_reason: null, downtime_start: null }
            : {}),
        }
      : m
  );
  
  // Notify subscribers of update
  notifySubscribers();
};

// Initialize simulation
startSimulation();

// Export types for use in components
export type { ExecutivePulseMetrics };
export { incomingDeliveries };
