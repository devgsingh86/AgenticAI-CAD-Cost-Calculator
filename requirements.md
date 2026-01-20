# CAD-Based Cost Estimation - Product Requirements Document

**Project:** LLM-based Cost Estimate of Hardware Design  
**Date:** January 19, 2026  
**Status:** Planning Phase  
**Version:** 2.0

## 1. Business Objectives
- Automate CAD-to-cost pipeline (reduce manual time from hours to <5 seconds)
- Generate DfM suggestions achieving 15-20% cost reduction
- Integrate real-time supplier quotes (Xometry/Fictiv)

**Target Users:**
- Design Engineers (uploading CAD files)
- Cost Estimators (reviewing AI quotes)
- Procurement Teams (supplier negotiation)

## 2. Success Metrics
| Metric | Target | Validation Method |
|--------|--------|-------------------|
| Feature extraction accuracy | >95% vs manual | F1 score against 100-file ground truth dataset |
| Processing latency | <5 seconds per part | 95th percentile across 1000 test runs |
| Quote accuracy | ±5% vs actual supplier quotes | MAPE against historical invoices |
| Time savings | 200+ hours/month | User time-tracking analytics |
| Uptime | 99.5% | Production monitoring (Datadog/Sentry) |
| DfM adoption rate | >30% of suggestions implemented | Post-deployment survey tracking |

## 3. Functional Requirements

### 3.1 Inputs
- **File Formats:** STEP (.stp/.step), STL (.stl), 2D PDFs with technical drawings
- **Metadata (User-Provided):**
  - Material type (aluminum, steel, titanium, plastics, composites)
  - Production volume (prototype: 1-10, small batch: 10-100, production: 100+)
  - Tolerance class (ISO 2768-mK, -mH, or custom GD&T)
  - Surface finish (as-machined, anodized, powder-coated, polished)
  - Lead time requirements (standard/expedited)

### 3.2 Processing Pipeline
**Stage 1: Geometry Extraction (Client-Side WASM)**
- Parse STEP files using OpenCascade.js to extract B-Rep topology
- Compute core metrics:
  - Volume (cm³) for material cost calculation
  - Surface area (cm²) for finishing cost estimation
  - Bounding box dimensions (X/Y/Z) for machine compatibility checks
  - Center of mass and moments of inertia
- Generate mesh preview for 3D viewer (LOD: low/medium/high)

**Stage 2: AI Feature Recognition (Server-Side)**
- Werk24 API integration for automated detection:
  - Holes (through/blind, threaded/non-threaded, countersinks)
  - Pockets and slots (rectangular, circular, T-slots)
  - Fillets and chamfers (edge breaks)
  - Threads (internal/external, ISO/ANSI standards)
  - Undercuts and complex geometries
- Fallback rule-based extraction for API failures (OpenCV contour detection on 2D projections)
- Cache extracted features in Redis with 24h TTL for repeat uploads

**Stage 3: Manufacturing Difficulty Scoring**
- Calculate complexity score (1-10 scale) based on:
  - Feature count and density
  - Tolerance tightness (IT grades)
  - Thin wall detection (<2mm thickness)
  - High aspect ratio features (depth > 5x diameter)
  - Multi-axis machining requirements

**Stage 4: Cost Calculation (LangGraph Multi-Agent System)**
- **Material Cost:** Volume × RAG-retrieved unit price (updated daily from supplier APIs)
- **Setup Cost:** Fixed per-operation charge based on machine type
- **Machining Time Estimation:**
  - Rough cutting time = Volume / material removal rate
  - Finishing passes = Surface area × feed rate
  - Tool changes and indexing overhead
- **Post-Processing:** Surface finish requirements → cost multipliers
- **Overhead & Profit Margin:** Industry-standard 30-40% markup

**Stage 5: DfM Analysis**
- Compare detected features against manufacturing best practices database
- Generate ranked recommendations:
  - Hole depth optimization (max 3× diameter for standard tooling)
  - Fillet radius standardization (use tool radii: 1mm, 2mm, 3mm)
  - Tolerance relaxation opportunities (ISO 2768-m vs -mH savings)
  - Material substitution suggestions (7075-T6 → 6061-T6 for non-structural parts)
  - Design for consolidation (multi-part assemblies → single piece)

### 3.3 Outputs
**Primary Deliverables:**
1. **JSON API Response** (for programmatic integration):
   ```json
   {
     "part_id": "uuid-v4",
     "total_cost": 285.50,
     "breakdown": {
       "material": 45.20,
       "setup": 50.00,
       "machining": 140.30,
       "finishing": 30.00,
       "overhead": 20.00
     },
     "lead_time_days": 7,
     "features": [...],
     "dfm_suggestions": [...],
     "confidence_score": 0.92
   }
   ```

2. **PDF Report** (for stakeholder review):
   - Executive summary with cost comparison vs design targets
   - 3D visualization with feature annotations
   - DfM recommendations with visual markup
   - Supplier quote comparison table
   - Manufacturing process routing (CAM-ready)

3. **Supplier Integration:**
   - Parallel API calls to Xometry and Fictiv for instant quotes
   - Comparison matrix showing price, lead time, quality ratings
   - One-click RFQ submission with pre-filled specifications

## 4. Technical Architecture

### 4.1 Technology Stack

**Frontend (Next.js 15)**
- React Server Components for SSR performance
- Three.js + React Three Fiber for CAD visualization
- Tailwind CSS + shadcn/ui component library
- File upload: drag-drop with validation (max 50MB per file)
- Real-time progress updates via Server-Sent Events

**CAD Processing**
- **Primary:** OpenCascade.js (WASM) for client-side STEP parsing
  - Bundle size: ~8MB (gzipped)
  - Multi-threading support for complex models
  - Instantiation time: <500ms on modern browsers
- **Alternative:** Werk24 API for server-side processing (€0.85/page at €990/month base)

**AI/ML Framework**
- **Agent Orchestration:** LangGraph for multi-agent workflows
- **LLM:** GPT-4o-mini for cost reasoning (latency: <1s per call)
- **Embeddings:** text-embedding-3-large (3072 dimensions)
- **Vector DB:** Pinecone (1536-dimension index, serverless tier)

**Backend Infrastructure**
- **API Framework:** Next.js API routes (Edge runtime for <50ms cold starts)
- **Caching:** Redis (Upstash serverless) for feature extraction results
- **Queue:** Vercel Queues for batch processing (100+ parts/hour)
- **Database:** PostgreSQL (Vercel Postgres) for historical cost data

**External Integrations**
- Werk24 API (feature extraction from 2D drawings)
- Xometry Instant Quoting API
- Fictiv Manufacturing API
- Material pricing feeds (ISO/ASME standards databases)

**DevOps**
- Warp CLI for local development workflow
- GitHub Actions CI/CD pipeline
- Vercel deployment (preview + production environments)
- Sentry error tracking + Datadog APM

### 4.2 LangGraph Multi-Agent Architecture

**Agent 1: Geometry Analyzer**
- **Input:** Parsed CAD topology from OpenCascade.js
- **Processing:** 
  - Calculate volume, surface area, bounding box
  - Compute material utilization percentage
  - Assess geometric complexity (1-10 score)
- **Output:** `GeometryMetrics` object for downstream agents
- **Latency Target:** <200ms

**Agent 2: Feature Extraction Coordinator**
- **Input:** Werk24 API response + geometry data
- **Processing:**
  - Validate API results against geometric constraints
  - Merge rule-based fallback detections
  - Standardize feature format to internal schema
- **Output:** Structured `FeatureList` with tolerances, depths, diameters
- **Latency Target:** <1.5s (API-dependent)

**Agent 3: Cost Estimation Engine**
- **Input:** Features + material selection + production volume + RAG pricing data
- **Processing:**
  - Query Pinecone for material costs (hybrid search: semantic + metadata filters)
  - Retrieve machining time tables (CNC feed rates by material type)
  - Apply complexity multipliers for tight tolerances
  - Calculate setup costs based on operation count
- **Output:** Itemized cost breakdown with confidence intervals
- **Latency Target:** <1.0s
- **Prompt Strategy:** Chain-of-Thought reasoning for transparency

**Agent 4: DfM Recommendation Generator**
- **Input:** Feature list + manufacturing constraints database
- **Processing:**
  - Compare each feature against best practices (e.g., hole depth rules)
  - Calculate potential savings per recommendation
  - Rank suggestions by ROI (cost reduction / design change effort)
- **Output:** Top 5 DfM suggestions with visual markup coordinates
- **Latency Target:** <800ms

**Agent 5: Supplier Integration Manager**
- **Input:** Final cost estimate + part specifications
- **Processing:**
  - Transform internal schema to Xometry/Fictiv API formats
  - Execute parallel API calls (Promise.allSettled)
  - Normalize responses to common comparison schema
- **Output:** Unified quote comparison matrix
- **Latency Target:** <2.0s (external API-dependent)

**State Management:**
- Shared state object (`CADProcessingState`) persists across all agents
- LangGraph checkpointing for fault tolerance (resume from last successful agent)
- Streaming updates via SSE for progressive result display

### 4.3 RAG System Design

**Vector Database: Pinecone**
- **Index Structure:**
  - `material-costs` namespace: Daily-updated pricing from supplier APIs
  - `machining-standards` namespace: ISO/ASME tolerance grades, surface finish charts
  - `historical-quotes` namespace: Past cost estimates with actual invoice validation
- **Embedding Strategy:**
  - Pre-compute embeddings for static knowledge (tolerance tables, material properties)
  - Real-time embedding for user queries: "What is the machining cost for aluminum 6061-T6 with Ra 1.6 surface finish?"
- **Query Pattern:**
  - Hybrid search: Semantic similarity (0.7 weight) + metadata filters (material type, volume range, tolerance class)
  - Re-ranking with cross-encoder for top-10 results
- **Update Frequency:**
  - Material costs: Daily batch job (supplier API scraping)
  - Machining standards: Quarterly manual review
  - Historical data: Real-time append on invoice validation

**Knowledge Base Content:**
1. **Material Database:**
   - Unit costs ($/lb or $/kg) by alloy/grade
   - Material properties (machinability rating, hardness)
   - Stock availability and lead times

2. **Machining Time Tables:**
   - CNC feed rates by material (IPM for aluminum, steel, titanium)
   - Tool life expectancy and replacement costs
   - Spindle speeds and cutting parameters

3. **Tolerance Cost Multipliers:**
   - ISO 2768 grades (mK, mH, mL) → cost impact
   - GD&T symbols (flatness, perpendicularity) → inspection overhead

4. **Surface Finish Charts:**
   - Ra values → post-processing methods (bead blasting, anodizing, polishing)
   - Cost per cm² by finish type

## 5. Performance Requirements

### 5.1 Latency Budget (End-to-End <5 seconds)

| Processing Stage | Target Latency | Optimization Strategy |
|------------------|----------------|----------------------|
| CAD parsing (WASM) | <2.0s | Stream B-Rep topology, use LOD for 3D preview |
| Feature extraction (Werk24) | <1.5s | Batch API calls, connection pooling, request parallelization |
| RAG query (Pinecone) | <0.3s | Pre-computed embeddings, 95th percentile caching |
| LLM inference (cost calc) | <1.0s | Use GPT-4o-mini, parallel agent execution via LangGraph |
| Report generation (PDF) | <0.2s | Template-based rendering with cached static assets |
| **Total** | **<5.0s** | Progressive UI updates to perceived performance |

**Latency Mitigation for Complex Parts:**
- Display results progressively: Geometry preview (2s) → Features (3.5s) → Cost (5s)
- "Quick Estimate" mode: Skip DfM analysis, use cached average pricing → <3s
- Batch processing queue for 10+ parts: Decouple from UI, email results

### 5.2 Accuracy Validation

**Feature Extraction Precision >95%:**
- **Ground Truth Dataset:** Manually annotate 100 diverse CAD files using Fusion 360 inspection tools
- **Evaluation Metrics:**
  - Feature detection F1 score (precision × recall)
  - Dimensional accuracy: ±0.1mm for critical dimensions (holes, pockets)
  - Tolerance detection: 100% recall for GD&T callouts
- **Continuous Monitoring:**
  - Weekly comparison of predicted costs vs actual supplier invoices
  - Track prediction drift (MAPE trending over time)
  - Automatic retraining triggers if accuracy drops below 90%

**Cost Prediction MAPE <5%:**
- Validate against 200+ historical quotes with actual invoices
- Stratify by complexity (simple/medium/high) to identify systematic biases
- Per-agent accuracy tracking (which agent contributes most to error?)

### 5.3 Throughput Requirements
- **Single Part Processing:** <5s end-to-end (95th percentile)
- **Batch Mode:** 100+ parts/hour via queue system
- **Concurrent Users:** Support 50 simultaneous uploads (Vercel Edge autoscaling)

## 6. Data Requirements

### 6.1 Historical Cost Database
- **Minimum Dataset:** 500 CAD files with validated costs
- **Data Structure:**
  - CAD file (STEP/STL)
  - Extracted features (JSON)
  - Quoted cost breakdown
  - Actual invoice amount (ground truth)
  - Supplier name and lead time
  - Manufacturing notes (challenges encountered)

### 6.2 Material Databases
- ISO material grades (aluminum alloys, steel grades, plastics)
- ASME/ANSI equivalents for US-based suppliers
- Unit costs updated daily from supplier APIs
- Machinability ratings and tool life data

### 6.3 Manufacturing Standards
- ISO 2768 tolerance tables (mK, mH, mL grades)
- GD&T symbols and inspection requirements
- Surface finish standards (Ra, Rz values)
- CNC machine capabilities (max dimensions, axis count)

## 7. Sample Test Cases

| Test ID | CAD File | Type | Features | Complexity | Known Cost | Pass Criteria |
|---------|----------|------|----------|------------|------------|---------------|
| TC-001 | simple_bracket.stp | STEP | 4× M6 holes, 2× bends | Low | $45 | Cost: $42-48 (±5%), All features detected |
| TC-002 | complex_housing.stp | STEP | 12× tapped holes, 3× pockets, thin walls | High | $320 | Feature F1 >0.95, Cost: $304-336 |
| TC-003 | organic_shape.stl | STL | Mesh analysis only | Medium | $160 | Surface area ±2%, Volume ±1% |
| TC-004 | multi_body_assy.stp | STEP | 3× separate bodies | Medium | $210 | Correctly separate bodies, individual costs |
| TC-005 | high_tolerance_shaft.stp | STEP | GD&T: 5× tolerance callouts | High | $265 | Detect all tolerances, Apply cost multipliers |
| TC-006 | thin_wall_enclosure.stp | STEP | 1.5mm wall thickness | High | $380 | Flag thin wall warning, DfM suggestion |
| TC-007 | deep_hole_block.stp | STEP | Hole depth 8× diameter | Medium | $125 | DfM: Recommend max 3× diameter |
| TC-008 | threaded_fitting.stp | STEP | M12×1.5 internal thread | Low | $55 | Detect thread type, Apply tap cost |
| TC-009 | anodized_part.stp | STEP | Surface finish: Type II anodize | Medium | $140 | Apply finishing cost multiplier |
| TC-010 | titanium_aerospace.stp | STEP | Ti-6Al-4V, tight tolerances | High | $650 | Material lookup, Hard-to-machine multiplier |

**Test Execution Plan:**
- Run all 10 test cases on every code commit (CI/CD pipeline)
- Track accuracy trends over time (store results in PostgreSQL)
- Automated alerts if any test case regresses >10% from target

## 8. Security & Compliance

### 8.1 Data Privacy
- **CAD File Handling:**
  - Contains proprietary designs → Encrypt at rest (AES-256)
  - Encrypt in transit (TLS 1.3)
  - Automatic purge after 48 hours (unless user opts for cloud storage)
  - GDPR-compliant data retention policies

### 8.2 API Key Management
- Store Werk24/Xometry credentials in environment variables (Vercel Secrets)
- Rotate API keys quarterly
- Rate limiting: Max 100 requests/hour per user (prevent abuse)

### 8.3 Regulatory Compliance
- **ITAR Compliance:** 
  - Add user checkbox for export-controlled designs
  - Restrict API routing to US-based servers only for ITAR parts
  - Audit logging for all ITAR file uploads
- **ISO 9001 Traceability:**
  - Store evidence snapshots (bounding box annotations, feature detections)
  - Reproducible cost calculations (version-pinned algorithms)

## 9. Error Handling & Edge Cases

### 9.1 Invalid CAD Files
- **Non-Manifold Geometry:** Return user-friendly error: "Non-manifold geometry detected at face ID 42. Repair in CAD software."
- **Corrupted STEP Files:** Fallback to STL mesh import, display accuracy warning
- **Unsupported Features:** Flag features that exceed system capabilities (e.g., freeform surfaces → "Manual review required")

### 9.2 API Failures
- **Werk24 Downtime:** Use rule-based feature extraction (OpenCV), display confidence warning
- **Supplier API Timeout:** Show stale cached quotes with timestamp
- **Pinecone Query Failure:** Fallback to hardcoded material cost averages

### 9.3 Ambiguous Cases
- **Multiple Material Options:** Prompt user to confirm material selection
- **Unclear Tolerances:** Default to ISO 2768-m (medium), flag for manual review
- **Complex Assemblies:** Offer per-component breakdown or simplified aggregate estimate

## 10. Development Roadmap

### Phase 1: Foundation (Weeks 1-4)
- **Week 1-2:** 
  - Complete requirements and architecture documentation
  - Setup GitHub repo with CI/CD (GitHub Actions)
  - Initialize Next.js 15 project with TypeScript
  - Configure Warp CLI aliases for common tasks
- **Week 3-4:**
  - Build OpenCascade.js WASM integration POC
  - Test with 10 sample STEP files (simple → complex)
  - Measure parsing latency and memory usage
  - Create 3D visualization with Three.js

### Phase 2: CAD Processing (Weeks 5-8)
- **Week 5-6:**
  - Integrate Werk24 API for feature extraction
  - Build ground truth annotation tooling (label 100 files)
  - Validate feature detection accuracy (target F1 >0.95)
- **Week 7-8:**
  - Implement rule-based fallback extraction
  - Add Redis caching for repeat uploads
  - Performance optimization (achieve <2s parsing)

### Phase 3: AI Agents (Weeks 9-12)
- **Week 9-10:**
  - Setup Pinecone vector database
  - Load material cost database and tolerance standards
  - Build RAG query pipeline (hybrid search)
- **Week 11-12:**
  - Implement first LangGraph agent (Geometry Analyzer)
  - Test state management and checkpointing
  - Integrate GPT-4o-mini for cost reasoning

### Phase 4: Integration & Testing (Weeks 13-16)
- **Week 13-14:**
  - Complete all 5 LangGraph agents
  - Test multi-agent orchestration
  - Implement DfM recommendation logic
- **Week 15-16:**
  - Integrate Xometry and Fictiv APIs
  - Build PDF report generation
  - Run full test suite (10 CAD files)

### Phase 5: Production Launch (Weeks 17-20)
- **Week 17-18:**
  - User acceptance testing with design engineers
  - Performance tuning (achieve <5s latency)
  - Security audit and penetration testing
- **Week 19-20:**
  - Production deployment to Vercel
  - Monitoring setup (Sentry + Datadog)
  - Documentation and user training

## 11. Open Architecture Decisions

- [ ] **LangGraph vs CrewAI:** LangGraph offers superior state management for multi-agent coordination, but CrewAI has simpler syntax. Decision: Use LangGraph for checkpointing and streaming updates (validated Jan 2026).

- [ ] **Client vs Server CAD Processing:** 
  - **Client-side (OpenCascade.js):** Reduces server costs, enables offline mode, but risks browser compatibility issues
  - **Server-side (Werk24 API):** Consistent results, but adds latency and cost (€0.85/page)
  - **Decision:** Hybrid approach - Client-side for STEP parsing, Werk24 for 2D drawing extraction

- [ ] **WebAssembly Multi-Threading:** Safari still has limited SharedArrayBuffer support. Test on iOS Safari 17+ before enabling multi-threading.

- [ ] **Streaming vs Batch Uploads:** For 10+ parts, should users upload sequentially or zip files?
  - **Sequential:** Simpler UI, but slower
  - **Batch:** Better UX, requires queue management
  - **Decision:** Implement both - sequential for <5 parts, batch queue for 5+

- [ ] **Cost Model Transparency:** Should we expose the Chain-of-Thought reasoning to users?
  - **Pros:** Builds trust, helps users understand cost drivers
  - **Cons:** May overwhelm non-technical users
  - **Decision:** Add optional "Show Calculation Details" toggle

## 12. Success Criteria & KPIs

### Launch Readiness Checklist
- [ ] Feature extraction F1 score >0.95 on 100-file test set
- [ ] Cost prediction MAPE <5% vs 200 historical quotes
- [ ] End-to-end latency <5s for 95th percentile
- [ ] All 10 test cases passing in CI/CD
- [ ] Security audit completed (ITAR compliance validated)
- [ ] User documentation and video tutorials ready

### Post-Launch Monitoring (First 90 Days)
- Track time savings: Target 200+ hours/month (survey users monthly)
- DfM adoption rate: >30% of recommendations implemented
- User satisfaction: NPS score >50
- Cost accuracy: Continuously validate predictions vs actual invoices
- System uptime: 99.5% (max 3.6 hours downtime/month)

### Continuous Improvement
- Monthly model retraining with new invoice data
- Quarterly material cost database updates
- Bi-annual supplier API integration reviews
- Annual technology stack evaluation (LangGraph roadmap, new CAD formats)

---

## Appendix A: Glossary

- **B-Rep:** Boundary Representation (CAD topology format)
- **DfM:** Design for Manufacturing
- **GD&T:** Geometric Dimensioning and Tolerancing
- **ITAR:** International Traffic in Arms Regulations
- **MAPE:** Mean Absolute Percentage Error
- **Ra:** Roughness Average (surface finish metric)
- **STEP:** Standard for the Exchange of Product Data (ISO 10303)

## Appendix B: References

- ISO 2768-1:1989 (General tolerances for linear and angular dimensions)
- ISO 1302:2002 (Surface texture indication)
- ASME Y14.5-2018 (Dimensioning and Tolerancing standard)
- OpenCascade.js documentation: https://ocjs.org
- LangGraph multi-agent patterns: https://langchain.com/langgraph
- Werk24 API documentation: https://werk24.io/docs

---

**Document Version:** 2.0  
**Last Updated:** January 19, 2026  
**Author:** Senior AI Architect, AgenticAI-CAD-Cost-Calculator Team  
**Review Cycle:** Quarterly (next review: April 2026)
