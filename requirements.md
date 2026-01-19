# CAD-Based Cost Estimation - Product Requirements Document

**Project:** LLM-based Cost Estimate of Hardware Design  
**Date:** January 19, 2026  
**Status:** Planning Phase

## 1. Business Objectives
- Automate CAD-to-cost pipeline (reduce manual time from hours to <5 seconds)
- Generate DfM suggestions achieving 15-20% cost reduction
- Integrate real-time supplier quotes (Xometry/Fictiv)

**Target Users:**
- Design Engineers (uploading CAD files)
- Cost Estimators (reviewing AI quotes)
- Procurement Teams (supplier negotiation)

## 2. Success Metrics
| Metric | Target |
|--------|--------|
| Feature extraction accuracy | >95% vs manual |
| Processing latency | <5 seconds per part |
| Quote accuracy | ±5% vs actual supplier quotes |
| Time savings | 200+ hours/month |
| Uptime | 99.5% |

## 3. Functional Requirements

### Inputs
- **File Formats:** STEP (.stp/.step), STL (.stl), 2D PDFs
- **Metadata:** Material type, production volume, tolerance class, surface finish

### Processing
- Extract geometry (volume, surface area, bounding box)
- Identify features (holes, pockets, threads, fillets)
- Calculate machining difficulty score
- Detect GD&T tolerances
- AI-predicted labor costs
- Real-time material pricing

### Outputs
- Cost breakdown (JSON + PDF report)
- DfM recommendations ranked by savings
- Supplier quote comparisons
- Manufacturing process routing

## 4. Technical Requirements

### Performance KPIs
- Latency: <5s end-to-end
- Throughput: 100+ parts/hour batch
- Accuracy: ±5% vs actuals

### Tech Stack (Validated via Deep Research)
- **Frontend:** Next.js 15, Three.js for 3D rendering
- **CAD Processing:** OpenCascade.js (Wasm), Werk24 API
- **AI Framework:** LangGraph agents, Vercel AI SDK
- **RAG:** Pinecone vector DB, LangChain
- **APIs:** Xometry/Fictiv for quotes
- **Dev Tools:** Warp CLI, Git
- **Deployment:** Vercel Edge, Kubernetes

### Data Requirements
- 500+ historical CAD files with actual costs
- Material databases (ISO/ASME standards)
- Supplier catalogs

## 5. Sample CAD Files for Testing
| File Name | Type | Complexity | Known Cost |
|-----------|------|------------|------------|
| bracket_001.stp | STEP | Simple | $45 |
| housing_complex.stp | STEP | High | $320 |
| ...add 8-18 more... | | | |

## 6. Open Questions
- [ ] Which Wasm library performs better: OpenCascade.js vs custom build?
- [ ] Werk24 pricing acceptable for 100+ parts/day?
- [ ] On-device LLM via WebGPU vs cloud latency trade-offs?

## 7. Next Steps
- Complete Deep Research validation (Phase 1, Step 4)
- Initialize Git repo structure (Phase 1, Step 5)
- Collect 20 sample CADs with cost data (Phase 1, Step 6)
