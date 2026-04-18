STRATUM Industrial OS — AI Agent Build Prompt

Competition: NextHack | Client: 2MP Industrie
Stack: Next.js 14 (App Router + TypeScript) · FastAPI (Python) · Supabase (PostgreSQL + pgvector + Realtime) · TailwindCSS · Framer Motion · React Flow · Recharts
Deployment: Vercel (frontend) + Railway (FastAPI backend)


⚠️ CRITICAL CONSTRAINTS — READ BEFORE BUILDING ANYTHING

NO static dataset. NO mock data. NO seed files. This is a prototype for a hackathon. There is no real database from the client. Every single number displayed anywhere in the UI must be a live mathematical output computed from the in-memory simulation state.
Pure relational simulation: One change in production (e.g., a machine stops) must cascade automatically across inventory levels, financials, logistics ETAs, and CRM alerts — with zero manual trigger.
The simulation tick (FastAPI) is the heartbeat. Every N seconds, the tick fires, increments units_produced on all running machines, and propagates all dependent values simultaneously across all 7 modules.
We win the hackathon first, then the client provides a real dataset. Build the demo so it looks real and feels live — but the data is all computed math, not stored records.


PLATFORM OVERVIEW
Name: STRATUM Industrial OS
Tagline: "The Central Nervous System of Your Factory"
Problem: Industrial SMEs like 2MP Industrie lose time, make human errors, and take poor decisions because of opaque manual processes across production, inventory, and client management.
Solution: An event-driven, real-time Industrial OS that unifies all factory operations into one data-driven ecosystem — where every number on screen is computed live from math, not from a static dataset.
Problem → Result mapping (for pitch):

Lost time → real-time visibility
Human errors → automated math cascades
Poor decisions → data-driven KPIs and alerts


SYSTEM ARCHITECTURE
[ Executive Pulse ] ── [ Digital Twin Workshop ] ── [ Performance Engine ]
        |                        |                            |
        └────────────[ STRATUM CORE MATH ENGINE (FastAPI) ]──┘
                              |              |
                      [ Smart Ledger ]  [ Context-Aware CRM ]
                                               |
                              [ Quality Control ] ── [ Conciergerie AI ]
All 7 verticals share one math engine. Every module reads from and writes to the same state. A machine stopping instantly updates: inventory depletion rate, revenue-at-risk, delivery ETA, client order status, and the executive dashboard — with no manual trigger.

THE MATH ENGINE — FastAPI Core

This engine is the foundation. Build this first. Every section of the platform derives its values from these formulas.

Core Formulas
FormulaOutputUsed ByOEE = Availability × Performance × (1 - Defect_Rate)Machine efficiency %Executive Pulse, Performance Engine, QualityRevenue_at_Risk = Σ(Downtime_min × Unit_Margin × Expected_Throughput_per_min)Financial risk in real timeExecutive PulseInventory_new = Inventory_old - (Units_Produced × Material_Constant_k)Live stock levelSmart LedgerDelivery_ETA = now + (Remaining_Units / Current_Production_Speed)Order delivery estimateCRM, LogisticsProduction_Speed = Units_Produced / Time_ElapsedUnits per hourPerformance Engine, ETAGap = Target_Units - Units_ProducedSchedule deviationDigital Twin, Performance EngineLoyalty_Score = w1×Frequency + w2×Recency + w3×Value + w4×Satisfaction + w5×ClaimsClient score 0–100CRM IntelligenceOrder_Probability = f(avg_cycle_days, days_since_last_order, seasonality_factor)Next order likelihood %CRM ForecastGlobal_Workshop_OEE = avg(OEE_machine_1 … OEE_machine_n)Factory-wide efficiencyExecutive Pulse
OEE sub-formulas:

Availability = (Total_Time - Downtime) / Total_Time
Performance = (Units_Produced / Time_Running) / Ideal_Speed
Quality = 1 - (Defects / Total_Units_Checked)

Machine State Object (single source of truth)
typescriptMachineState {
  id: string
  status: "running" | "paused" | "stopped"
  product_name: string
  units_produced: number         // increments on every simulation tick
  units_target: number
  started_at: timestamp
  last_status_change: timestamp
  downtime_reason: string | null // "breakdown" | "material_shortage" | "operator_break" | "maintenance"
  downtime_start: timestamp | null
  unit_margin: number            // currency per unit
  material_constant_k: number   // material consumed per unit produced
  defect_count: number
  total_checks: number
  ideal_speed: number            // target units per hour
}
Every other module derives its values from this object. The FastAPI simulation tick (every N seconds) increments units_produced for running machines and propagates all dependent values simultaneously across all modules.

DATABASE SCHEMA (Supabase PostgreSQL)

Even though this is a prototype with no real client data, the schema must be fully set up to support Supabase Realtime CDC and simulation state persistence.

sqlmachines (
  id, name, location_x, location_y, status,
  product_name, units_produced, units_target,
  started_at, last_status_change,
  downtime_reason, downtime_start,
  unit_margin, material_constant_k,
  ideal_speed, defect_count, total_checks
)

downtime_events (
  id, machine_id, reason,
  started_at, ended_at, duration_min
)

inventory_items (
  id, ref, name,
  qty_current, qty_min, unit_cost,
  zone, shelf, location, material_constant_k
)

inventory_movements (
  id, item_id,
  type,  -- "production_depletion" | "receipt" | "manual_adjustment"
  qty, source, created_at
)

purchase_orders (
  id, item_id, suggested_qty,
  estimated_cost, status, created_at
)

deliveries (
  id, order_id, client_id, product, qty,
  expected_date, logistics_manager,
  status,  -- "scheduled" | "on_the_way" | "delayed" | "delivered"
  created_at
)

clients (
  id, name, sector,
  status,  -- "prospect" | "negotiation" | "active" | "inactive"
  channel, sales_rep,
  first_contact, last_interaction,
  city, country,
  phone_primary, phone_secondary, email,
  commercial_conditions
)

interactions (
  id, client_id,
  type,  -- "call" | "email" | "meeting" | "whatsapp"
  notes, created_at
)

deals (
  id, client_id,
  stage,  -- "lead" | "contacted" | "negotiation" | "won" | "lost"
  amount, created_at, closed_at, result
)

orders (
  id, client_id, product, qty,
  status, delivery_date,
  logistics_manager, created_at
)

tickets_sav (
  id, client_id, priority,
  status,  -- "open" | "in_progress" | "closed"
  description, opened_at, closed_at, resolution_time_hours
)

quality_checks (
  id, machine_id, batch_id,
  operator_id, status, created_at
)

quality_defects (
  id, check_id, defect_type,
  qty_rejected, stage,
  action  -- "repair" | "rework" | "rejection"
)

alerts (
  id, module, type, priority,
  message, is_read,
  triggered_at, resolved_at
)

knowledge_docs (
  id, title, content,
  embedding vector(1536),
  category, created_at
)

chat_sessions (id, client_id, started_at)

chat_messages (
  id, session_id,
  role,  -- "user" | "assistant"
  content, created_at
)

DESIGN SYSTEM — iOS Spatial Theme
TokenValueBackgroundPure white / very light grayCardsGlassmorphism — backdrop-filter: blur() + semi-transparent bgBorder radius24px on cards / 12px on elementsTypographyGeist Sans (headings) + SF Pro (body)Active / RunningEmerald #10B981PausedAmber #F59E0BStopped / ErrorCoral #F43F5EAnimationsFramer Motion — node pulse, page transitions, micro-interactions

BUILD PHASES (AI Agent Execution Order)
PHASE 0 — Foundation

Set up full PostgreSQL schema in Supabase (all tables listed above)
Enable Supabase Realtime CDC on all tables
Seed initial machine config: IDs, product names, unit margins, material constants k, ideal speeds (use realistic fictional data for the demo)
Scaffold Next.js 14 project with App Router + TypeScript + TailwindCSS
Set up Supabase Auth middleware (role-based: admin / operator / sales)
Scaffold FastAPI project with simulation tick loop skeleton
Configure CORS between FastAPI and Next.js

Exit condition: Supabase connected, machines table seeded, Next.js and FastAPI both running, auth working.

PHASE 1 — Math Engine (FastAPI)
Build all computation endpoints. No UI yet.
Endpoints to implement:
POST /tick
  → Advance simulation: for every machine with status="running",
    increment units_produced by (ideal_speed × tick_interval_seconds / 3600)
  → Persist updated MachineState to Supabase
  → Trigger all downstream cascades (inventory depletion, alert checks)

GET /oee/{machine_id}
  → Compute and return full OEE breakdown:
    availability, performance, quality, composite OEE %

GET /oee/global
  → avg(OEE_machine_1 … OEE_machine_n) across all machines

GET /revenue-at-risk
  → Σ(Downtime_min × Unit_Margin × Expected_Throughput_per_min)
    for all stopped machines

GET /delivery-eta/{order_id}
  → now + (Remaining_Units / Current_Production_Speed)

GET /inventory/forecast/{item_id}
  → Forecast_Qty = avg_daily_consumption × forecast_horizon_days + safety_buffer
  → safety_buffer = avg_daily_consumption × lead_time_days

GET /loyalty-score/{client_id}
  → Loyalty_Score = w1×purchase_frequency + w2×order_regularity
    + w3×relationship_length + w4×lifetime_value
    + w5×offer_responsiveness + w6×satisfaction + w7×claims_history

GET /order-probability/{client_id}
  → Probability_next_order = 1 - (days_since_last_order / avg_order_cycle_days)
  → Forecast_volume = avg_units_per_order × probability
The tick loop: Run as a background task. Every N seconds (configurable, suggest 5s for demo), call POST /tick automatically.
Exit condition: All endpoints return correct math. Tick loop fires and updates Supabase. Verified with curl.

PHASE 2 — Vertical I: Executive Pulse (Management Dashboard)
Purpose: Real-time strategic visibility for factory managers. Every number is computed, not stored.
Header KPI Row (live, auto-refresh via Supabase Realtime):

Total Machines — count of all registered machines
Running — count where status = "running"
Paused — count where status = "paused"
Stopped — count where status = "stopped"
Global OEE — avg(OEE per machine) across all assets
Revenue at Risk — Σ(Downtime_min × Unit_Margin × Expected_Throughput_per_min) for all stopped machines (live financial alert)

Production vs Target Card:

Bar chart: actual units produced vs planned target per machine
Delta label: Gap = Target - Produced shown as "+X ahead" or "-X behind"
Color: green if ahead, amber if within 10% behind, red if more than 10% behind

Live Alert Feed:

Machine stopped beyond threshold minutes (configurable per machine)
Inventory item below minimum level (derived from Inventory_new formula)
Critical SAV ticket unresolved beyond SLA
Delivery ETA pushed beyond promised date (derived from Delivery_ETA formula)
Client inactivity alert (derived from days_since_last_interaction)

Cross-Module Dependencies:

Reads machine states from Digital Twin
Reads inventory levels from Smart Ledger
Reads ticket status from CRM SAV module
Reads order ETAs from CRM Logistics module

Exit condition: Dashboard refreshes live as the tick fires. All KPIs update without page reload.

PHASE 3 — Vertical II: Digital Twin Workshop (2D Factory Map)
Purpose: Monitor every machine on the shop floor in real time without physical presence.
2D Interactive Canvas (React Flow):

Spatial layout of all machines as positioned nodes (use location_x, location_y from DB)
Each node displays: machine ID (e.g. PX01), status color, product name in progress
Color coding: Green = Running (#10B981), Amber = Paused (#F59E0B), Red = Stopped (#F43F5E)
Pulse animation: Active nodes emit a soft radial pulse (Framer Motion) to visualize material flow
Animated edges between nodes representing the production sequence

Machine Node — Data Displayed on hover/click:

Product name currently being produced
units_produced / units_target (e.g. 120 / 200 units)
Start time and elapsed operating duration
Individual OEE % (computed live from /oee/{machine_id})
Schedule status: "ahead" or "behind" with unit delta

Downtime Diagnostic Layer (visible when node is red/amber):

Stoppage reason: breakdown / material shortage / operator break / maintenance
Duration of current stoppage: live counter from now - downtime_start
Financial impact: Revenue_at_Risk for this specific machine

Math Dependencies:

status drives node color
units_produced increments via simulation tick
OEE computed per machine on every tick
Gap = units_target - units_produced
Downtime timer = now - downtime_start

Exit condition: Map renders all machines with correct color states. Clicking a machine shows live stats. Pausing/stopping a machine from the UI updates the node color instantly.

PHASE 4 — Vertical III: Performance Analysis Engine
Purpose: Granular efficiency measurement per machine with temporal comparison.
Per-Machine Metrics Panel:

Individual OEE: full breakdown (Availability × Performance × Quality)
Schedule Gap: Target - Produced (positive = ahead, negative = behind)
Production Speed: Units_Produced / Time_Elapsed in units per hour

Historical Comparison (all computed from running simulation state — no external dataset):

Today vs Yesterday: delta in OEE %, delta in units produced
Today vs Weekly Average: 7-day rolling mean of OEE per machine
All comparisons derived from accumulated simulation state

Filters: By machine ID · By time window (last hour / today / this week) · By product type
Chart Types:

Line chart: OEE trend over time per machine
Bar chart: units produced per hour per machine
Gauge: current OEE vs target OEE

Exit condition: Charts render with live data. Filters work. OEE updates when Quality Control submits a defect checklist.

PHASE 5 — Vertical IV: Smart Ledger (Inventory & WMS)
Purpose: Real-time stock tracking driven entirely by production math — no manual input required for normal depletion.
Live Stock Tracking:

Every unit produced triggers: Inventory_new = Inventory_old - (Units_Produced × k)
k = material constant defined per machine/product pair (configured at setup)
Stock levels update automatically on every simulation tick
No manual scan needed for production depletion — calculated automatically

Manual Entry Points (only human inputs needed):

New stock received from supplier (adds to inventory)
Manual audit correction
Barcode / QR scan on physical receipt of a new delivery

Warehouse Management (WMS):

Items organized by: Zone → Shelf → Location
Each item stores: reference, name, current quantity, minimum threshold, unit cost, warehouse location

Automated Replenishment:

Alert fires when Inventory_new < minimum_threshold
Auto-generates a purchase order suggestion: item reference, suggested quantity, estimated cost
Alert appears in Executive Pulse feed and CRM Alert module

Demand Forecasting (math-based, no ML):

Forecast_Qty = avg_daily_consumption × forecast_horizon_days + safety_buffer
avg_daily_consumption = total_consumed / days_elapsed (rolling average)
safety_buffer = avg_daily_consumption × lead_time_days

Purchase History Panel:

Consumption per material reference by period (monthly / quarterly / annual)
Top 3 most expensive materials by total spend
Cost trend indicator: up/down vs previous period
Time filter: 30 days / 3 months / 1 year

Upcoming Deliveries Table:

Columns: order ref, client, product/batch, expected delivery date, logistics manager, status
Status values: Scheduled / On the Way / Delayed
Auto-sorted by urgency (closest delivery date first)
Delayed rows highlighted — delay detected when expected_date < now AND status ≠ "delivered"

Exit condition: Inventory depletes automatically as the tick fires. Low-stock alert appears in Executive Pulse. Purchase order suggestion auto-generates.

PHASE 6 — Vertical V: Context-Aware CRM (Sales & Logistics)
Purpose: Full client lifecycle management from lead to after-sales, with all intelligence computed from transaction math.
Block A — Client 360° Profile
Client Record Fields:
Identification:

Auto-generated unique ID (immutable)
Company name / Full name
Sector of activity
Record creation date
Acquisition channel (lead origin)
Assigned sales representative

Contact Information:

Full address, City / Region / Country
Primary and secondary phone numbers
Professional email address

Commercial Data:

Business status: Prospect / Negotiation / Active / Inactive
Date of first contact / Date of last interaction
Specific commercial conditions (discounts, contracts, agreements)

Purchase History (all computed):

Total purchase volume
Revenue generated: Σ(order_amounts)
Purchase frequency: total_orders / months_as_client
Average basket size: total_revenue / total_orders
Most consumed products (ranked by order count)

Ongoing Business Activities:

Active quotes (reference, amount, current status)
Orders currently being processed
Active or renewing contracts
Pipeline opportunities

After-Sales Service (SAV) — critical for 2MP machine installations:

Number of open tickets
Active ticket list (ID, priority, status, age)
Closed ticket history
Average resolution time: avg(closed_at - opened_at)
Overall client criticality level
Maintenance requests, warranty tracking, support tickets per installation

Client Performance Indicators (all computed from transaction data):

Total revenue generated
Estimated profitability: Σ(revenue) - Σ(discounts + service_costs)
Commercial responsiveness rate: responses / contacts_initiated
Client category: VIP / Standard / At-Risk / Inactive
Loyalty score (see Block D formula)
Engagement level: computed from interaction frequency over rolling 30 days

Quick Action Buttons:

Create quote · Create SAV ticket · Send commercial email · Schedule follow-up · Assign to sales rep

Interaction Log:

All call references with timestamps and duration
Email exchange history (subject, date, direction)
All actions performed on the account (with actor and timestamp)

Block B — Automated Smart Alerts
3-step engine (runs on every state change):

Real-time data collection from CRM + inventory + SAV + orders
Automatic rule evaluation (thresholds + logic — no ML, pure conditionals)
Alert triggered and routed to the responsible person

Commercial Alerts:

Quote not responded to: now - quote_sent_at > X days
Client inactive: now - last_interaction_at > threshold
Order volume drop: current_period_orders < historical_avg × 0.6
Stagnant pipeline deal: days_in_current_stage > stage_max_days

Client Performance Alerts:

High-potential untapped client: lifetime_value_potential > threshold AND interaction_frequency < minimum
VIP client without recent interaction: category = "VIP" AND now - last_interaction > 14 days
Loyalty score declining: loyalty_score_now < loyalty_score_7d_ago - delta
Disengagement risk: engagement_level < low_threshold

SAV Alerts:

Critical unresolved ticket: priority = "critical" AND status = "open" AND age > X hours
SLA breach: now - opened_at > avg_resolution_time × 1.5
Multiple open complaints from same client: open_tickets_count >= 3
Auto-escalation of incident to manager

Stock and Logistics Alerts:

Stock-out impacting pending order: inventory_level = 0 AND open_order exists for item
Delivery delay: Delivery_ETA > promised_delivery_date
Order vs availability mismatch: order_qty > available_stock

Priority Levels:

Low — informational, no action required
Medium — action recommended
Critical — immediate action required, auto-escalated to responsible manager

Block C — Sales Pipeline

Deal stages: Lead → Contacted → Negotiation → Won / Lost
Centralized communication log per deal: calls, emails, meetings, WhatsApp messages
WhatsApp Business API integration for real-time order updates sent to clients

Block D — Commercial Business Intelligence
Client Loyalty Score:

Score = w1×purchase_frequency + w2×order_regularity + w3×relationship_length + w4×lifetime_value + w5×offer_responsiveness + w6×satisfaction + w7×claims_history
Weights configurable per company profile
Recalculated automatically on every relevant data change
Displayed as 0–100 OR classification: Loyal / Standard / At-Risk / Inactive

Order Forecasting (math only, no ML):

Probability_next_order = 1 - (days_since_last_order / avg_order_cycle_days)
Forecast_volume = avg_units_per_order × probability
High_demand_flag = forecast_volume > 1.2 × historical_avg_volume
Outputs per client: order probability %, likely products, estimated volume, recommended re-contact date

Sales Dashboard:
Commercial Performance:

Total revenue: Σ(closed_won deal amounts)
Revenue by period: daily / weekly / monthly (time-series chart)
Lead-to-client conversion rate: won / total_leads
Quotes sent (count) · Sales closed (count)

Client Portfolio:

Active clients count · New clients acquired (current period)
Inactive clients count · High-risk clients count

Commercial Activity:

Open opportunities (count and value)
Follow-ups due today
Quotes awaiting response for more than X days
Average commercial processing time: avg(deal_closed_at - deal_created_at)

Strategic Analysis:

Top revenue-generating clients (ranked table)
Most sold products by volume and by revenue
Monthly sales trend (line chart)
Future demand forecast (bar chart from Order Forecasting formula)

Display Requirements:

All charts dynamic and reactive to filter changes
KPI cards with period-over-period delta
Filters: period / sales rep / geographic region / client segment
CSV data export per view

Exit condition: Client 360 profile renders with computed KPIs. Alerts fire automatically based on rule conditions. Pipeline Kanban board functional. Sales dashboard charts render.

PHASE 7 — Vertical VI: Quality Control System
Purpose: Standardized quality procedures with full batch traceability, feeding directly into OEE.
Digital Checklists (Operator Input):

Step-by-step procedure checklist per product type
Each step: Pass / Fail input by the operator
Control points tailored to 2MP: welding quality, pressure tests, finishing quality
Each submission linked to: machine ID, batch ID, operator ID, timestamp

Defect Analysis (computed):

Defect_Rate = defect_count / total_units_checked
Breakdown per defect type: welding defect / pressure failure / finishing issue / dimensional error
Production stage where defect occurred (tracked per step in checklist)
Rejected volume vs total produced volume

Corrective Actions:

Per defect record: Repair / Rework / Final Rejection
Status tracked per batch until closed

Quality → OEE Feedback Loop (critical):

Defect_Rate feeds directly into OEE = Availability × Performance × (1 - Defect_Rate)
Every checklist submission instantly recomputes the machine OEE in the Performance Engine and Executive Pulse
Quality data and production data are the same state — no synchronization needed

Traceability:

Batch number linked to every quality record
Full audit trail: machine ID, operator ID, product, date, checklist result, defects found, action taken

Exit condition: Operator submits a checklist. Defect_Rate updates. OEE recomputes live. Executive Pulse KPI card updates immediately.

PHASE 8 — Vertical VII: Conciergerie Industrielle (External AI Chatbot)
Purpose: Premium client-facing support chatbot powered by RAG — clients get instant answers without calling anyone.
Chatbot Capabilities:

Order tracking: client asks for live order status and delivery ETA — reads directly from Delivery_ETA formula output
Technical support: answers FAQs using the 2MP product knowledge base (retrieved via vector search)
Lead capture: unidentified visitor inquiries are auto-funneled into the CRM as new leads with source tag "Conciergerie"

RAG Pipeline:

Knowledge base: 2MP product catalog, technical specs, warranty policies, installation and maintenance guides
Vector storage: pgvector on Supabase (knowledge_docs table with embedding vector(1536))
Retrieval: semantic search over knowledge documents, top-K results injected into LLM context
LLM: any instruction-tuned model (Mistral / Llama / GPT-4o)
Interface: embeddable chat widget (can be embedded on 2MP's external-facing website)

Exit condition: Chatbot answers a product question using retrieved context. Asks "who are you?" → creates a new lead in CRM. Live order ETA query returns the computed formula output.

FULL CROSS-MODULE DATA FLOW
SIMULATION TICK (FastAPI — fires every N seconds)
│
├─ Increment units_produced on all running machines
│
├──► DIGITAL TWIN
│     └─ Update node: units display, OEE, gap, pulse animation, schedule status
│
├──► PERFORMANCE ENGINE
│     └─ Recompute per-machine OEE, production speed, historical delta
│
├──► SMART LEDGER
│     └─ Inventory_new = Inventory_old - (Δunits × k)
│           └─ If Inventory_new < minimum_threshold → fire stock alert → Executive Pulse feed
│
├──► EXECUTIVE PULSE
│     ├─ Recompute Global_OEE = avg(all machine OEEs)
│     ├─ Recompute Revenue_at_Risk = Σ(stopped machine downtimes × margins)
│     └─ Refresh all KPI cards
│
├──► CRM LOGISTICS
│     └─ Recompute Delivery_ETA = now + (Remaining_Units / Production_Speed)
│           └─ If ETA > promised_date → fire delivery delay alert → CRM alert feed
│
└──► QUALITY CONTROL
      └─ On checklist submission: recompute Defect_Rate → recompute machine OEE
            └─ Updated OEE propagates back to Performance Engine and Executive Pulse