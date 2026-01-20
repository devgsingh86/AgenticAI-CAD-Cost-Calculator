# System Architecture - CAD Cost Estimation Platform

**Project:** AgenticAI-CAD-Cost-Calculator  
**Date:** January 19, 2026  
**Version:** 1.0

## 1. High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Next.js 15 Frontend (React Server Components)                  │   │
│  │  • CAD File Upload (Drag & Drop)                                │   │
│  │  • 3D Viewer (Three.js + React Three Fiber)                     │   │
│  │  • Real-time Progress (Server-Sent Events)                      │   │
│  │  • Cost Dashboard & DfM Recommendations                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS (TLS 1.3)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT-SIDE PROCESSING LAYER                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  WebAssembly CAD Kernel (OpenCascade.js)                        │  │
│  │  • STEP File Parsing → B-Rep Topology Extraction                │  │
│  │  • Volume, Surface Area, Bounding Box Calculation               │  │
│  │  • Mesh Generation (LOD: Low/Medium/High)                       │  │
│  │  • Multi-threading (SharedArrayBuffer for complex models)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Parsed Geometry Data (JSON)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Next.js Edge API Routes (Vercel Edge Runtime)                  │  │
│  │  • Request Validation & Authentication                          │  │
│  │  • Rate Limiting (100 req/hour per user)                        │  │
│  │  • Load Balancing & Auto-scaling                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────┬───────────────────────────────────────────────────────────────┬───┘
      │                                                               │
      ▼                                                               ▼
┌─────────────────────────┐                           ┌─────────────────────┐
│  CACHING LAYER          │                           │  EXTERNAL APIs      │
│  ┌──────────────────┐   │                           │  ┌──────────────┐   │
│  │  Redis (Upstash) │   │                           │  │  Werk24 API  │   │
│  │  • Feature Cache │   │                           │  │  (€0.85/page)│   │
│  │  • TTL: 24h      │   │                           │  └──────────────┘   │
│  └──────────────────┘   │                           │  ┌──────────────┐   │
└─────────────────────────┘                           │  │  Xometry API │   │
                                                      │  └──────────────┘   │
                                                      │  ┌──────────────┐   │
                                                      │  │  Fictiv API  │   │
                                                      │  └──────────────┘   │
                                                      └─────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT ORCHESTRATION LAYER                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  LangGraph Agent Runtime                                        │  │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │  │
│  │  │ Agent 1:       │  │ Agent 2:        │  │ Agent 3:         │  │  │
│  │  │ Geometry       │→ │ Feature         │→ │ Cost             │  │  │
│  │  │ Analyzer       │  │ Extraction      │  │ Estimation       │  │  │
│  │  └────────────────┘  └─────────────────┘  └──────────────────┘  │  │
│  │           ↓                   ↓                      ↓           │  │
│  │  ┌────────────────┐  ┌─────────────────┐                       │  │
│  │  │ Agent 4:       │  │ Agent 5:        │                       │  │
│  │  │ DfM            │  │ Supplier        │                       │  │
│  │  │ Recommender    │  │ Integration     │                       │  │
│  │  └────────────────┘  └─────────────────┘                       │  │
│  │                                                                  │  │
│  │  • Shared State: CADProcessingState (typed schema)              │  │
│  │  • Checkpointing: Fault-tolerant agent execution                │  │
│  │  • Streaming: Progressive result updates via SSE                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────────┬───────────┘
         │                                                    │
         ▼                                                    ▼
┌──────────────────────┐                          ┌──────────────────────┐
│  RAG SYSTEM          │                          │  LLM INFERENCE       │
│  ┌────────────────┐  │                          │  ┌────────────────┐  │
│  │ Pinecone       │  │                          │  │ GPT-4o-mini    │  │
│  │ Vector DB      │  │                          │  │ (OpenAI API)   │  │
│  │                │  │                          │  │                │  │
│  │ Namespaces:    │  │                          │  │ • Chain-of-    │  │
│  │ • material-    │  │                          │  │   Thought      │  │
│  │   costs        │  │                          │  │ • Cost         │  │
│  │ • machining-   │  │                          │  │   Reasoning    │  │
│  │   standards    │  │                          │  │ • DfM          │  │
│  │ • historical-  │  │                          │  │   Generation   │  │
│  │   quotes       │  │                          │  └────────────────┘  │
│  └────────────────┘  │                          └──────────────────────┘
└──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA PERSISTENCE LAYER                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL      │  │  Object Storage  │  │  Audit Logs          │  │
│  │  (Vercel)        │  │  (Vercel Blob)   │  │  (Datadog/Sentry)    │  │
│  │                  │  │                  │  │                      │  │
│  │  • Historical    │  │  • CAD Files     │  │  • API Requests      │  │
│  │    Quotes        │  │    (48h TTL)     │  │  • Error Tracking    │  │
│  │  • User Data     │  │  • PDF Reports   │  │  • Performance       │  │
│  │  • Audit Trail   │  │  • 3D Previews   │  │    Metrics           │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Component-Level Architecture

### 2.1 Frontend Architecture (Next.js 15)

**Technology Choices:**
- **Framework:** Next.js 15 with App Router (React Server Components)
- **Rendering Strategy:** Hybrid SSR + Client-side interactivity
- **State Management:** Zustand for global state (uploaded files, processing status)
- **3D Visualization:** Three.js + React Three Fiber + Drei helpers
- **UI Components:** shadcn/ui (Radix primitives + Tailwind CSS)
- **Form Handling:** React Hook Form + Zod validation

**Key Pages/Routes:**
```
/                          → Landing page (SSR)
/upload                    → CAD file upload interface (Client)
/processing/[jobId]        → Real-time processing status (SSE)
/results/[jobId]           → Cost breakdown & DfM recommendations
/history                   → User's past estimates (SSR with data fetching)
/api/upload                → File upload endpoint
/api/process               → Trigger LangGraph workflow
/api/stream/[jobId]        → Server-Sent Events for progress
```

**File Upload Component:**
```typescript
// Pseudo-code for upload workflow
const handleFileUpload = async (file: File) => {
  // 1. Client-side validation
  if (!['stp', 'step', 'stl'].includes(file.extension)) {
    throw new Error('Invalid file format');
  }

  // 2. Instantiate OpenCascade.js WASM module
  const oc = await initOpenCascade();

  // 3. Parse STEP file in browser (avoid server upload delay)
  const geometry = await oc.parseSTEP(file);
  const metrics = {
    volume: oc.calculateVolume(geometry),
    surfaceArea: oc.calculateSurfaceArea(geometry),
    boundingBox: oc.getBoundingBox(geometry)
  };

  // 4. Generate 3D preview mesh
  const mesh = oc.generateMesh(geometry, LOD.MEDIUM);

  // 5. Send parsed data to backend (not raw CAD file)
  const response = await fetch('/api/process', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      geometryMetrics: metrics,
      meshData: mesh.toJSON(),
      userInputs: { material, volume, tolerance, finish }
    })
  });

  // 6. Start SSE connection for real-time updates
  const eventSource = new EventSource(`/api/stream/${response.jobId}`);
  eventSource.onmessage = (event) => {
    updateProgress(JSON.parse(event.data));
  };
};
```

### 2.2 CAD Processing Pipeline (OpenCascade.js)

**WebAssembly Module Configuration:**
```javascript
// opencascade.config.js
export default {
  module: 'opencascade.wasm.wasm',
  moduleName: 'opencascade',
  libs: [
    'ModelingData',      // B-Rep topology
    'ModelingAlgorithms', // Boolean operations
    'Visualization',     // Mesh generation
    'DataExchange'       // STEP/STL import
  ],
  mainThread: true,       // Enable SharedArrayBuffer
  simdWasm: true,         // SIMD optimizations
  pthreads: 4             // Multi-threading (4 workers)
};
```

**Geometry Extraction Flow:**
```
STEP File (Client Upload)
  ↓
OpenCascade.js WASM Parser
  ↓
TopoDS_Shape (B-Rep Structure)
  ├─→ Faces → Surface Area Calculation
  ├─→ Edges → Feature Edge Detection
  ├─→ Vertices → Bounding Box Computation
  └─→ Solids → Volume Integration
  ↓
Geometric Metrics (JSON)
{
  "volume_cm3": 245.7,
  "surface_area_cm2": 382.4,
  "bounding_box": {"x": 120, "y": 80, "z": 45},
  "center_of_mass": [60, 40, 22.5],
  "face_count": 24,
  "edge_count": 48
}
  ↓
Send to Backend API
```

### 2.3 Multi-Agent System (LangGraph)

**Agent State Schema:**
```typescript
interface CADProcessingState {
  // Input metadata
  jobId: string;
  fileName: string;
  uploadTimestamp: Date;
  userInputs: {
    material: MaterialType;
    productionVolume: number;
    toleranceClass: ToleranceClass;
    surfaceFinish: FinishType;
  };

  // Stage 1: Geometry Analysis
  geometryMetrics?: {
    volume: number;
    surfaceArea: number;
    boundingBox: Vector3;
    complexityScore: number; // 1-10
  };

  // Stage 2: Feature Extraction
  features?: Feature[];
  featureExtractionConfidence?: number;

  // Stage 3: Cost Estimation
  costBreakdown?: {
    material: number;
    setup: number;
    machining: number;
    finishing: number;
    overhead: number;
    total: number;
  };

  // Stage 4: DfM Recommendations
  dfmSuggestions?: DfMRecommendation[];

  // Stage 5: Supplier Quotes
  supplierQuotes?: SupplierQuote[];

  // Metadata
  processingStage: ProcessingStage;
  errors: Error[];
  confidenceScore: number;
}
```

**LangGraph Workflow Definition:**
```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# Define agent nodes
def geometry_analyzer_node(state: CADProcessingState):
    # Calculate complexity score based on feature density
    feature_density = state.geometryMetrics.face_count / state.geometryMetrics.volume
    complexity = min(10, feature_density * 0.5 + tolerance_multiplier)

    return {
        **state,
        "geometryMetrics": {
            **state.geometryMetrics,
            "complexityScore": complexity
        },
        "processingStage": "FEATURE_EXTRACTION"
    }

def feature_extraction_node(state: CADProcessingState):
    # Check cache first
    cached_features = redis.get(f"features:{state.fileName}")
    if cached_features:
        return {...state, "features": cached_features}

    # Call Werk24 API
    werk24_response = await werk24_client.extract_features(
        file_url=state.fileUrl,
        extraction_mode="COMPREHENSIVE"
    )

    # Fallback to rule-based if API fails
    if not werk24_response.success:
        features = rule_based_extractor.extract(state.geometryMetrics)
        confidence = 0.7
    else:
        features = werk24_response.features
        confidence = werk24_response.confidence

    # Cache for 24h
    redis.setex(f"features:{state.fileName}", 86400, features)

    return {
        **state,
        "features": features,
        "featureExtractionConfidence": confidence,
        "processingStage": "COST_CALCULATION"
    }

def cost_estimation_node(state: CADProcessingState):
    # Build RAG query for material pricing
    query_embedding = embed_model.embed(
        f"Material cost for {state.userInputs.material} in volume {state.geometryMetrics.volume}cm3"
    )

    # Hybrid search in Pinecone
    rag_results = pinecone_index.query(
        vector=query_embedding,
        filter={"material": state.userInputs.material},
        top_k=5
    )

    # LLM-based cost reasoning
    llm_prompt = f"""
    Calculate manufacturing cost breakdown for:
    - Material: {state.userInputs.material}
    - Volume: {state.geometryMetrics.volume} cm³
    - Features: {len(state.features)} detected
    - Complexity: {state.geometryMetrics.complexityScore}/10

    Use this pricing data: {rag_results}

    Provide itemized breakdown in JSON format.
    Use chain-of-thought reasoning.
    """

    cost_response = llm.invoke(llm_prompt)
    cost_breakdown = parse_json(cost_response)

    return {
        **state,
        "costBreakdown": cost_breakdown,
        "processingStage": "DFM_ANALYSIS"
    }

def dfm_recommendation_node(state: CADProcessingState):
    suggestions = []

    # Check each feature against best practices
    for feature in state.features:
        if feature.type == "HOLE" and feature.depth > 3 * feature.diameter:
            savings = estimate_savings(feature, "REDUCE_DEPTH")
            suggestions.append({
                "feature_id": feature.id,
                "type": "HOLE_DEPTH_OPTIMIZATION",
                "current": f"{feature.depth}mm depth",
                "recommended": f"{3 * feature.diameter}mm depth",
                "savings_usd": savings,
                "effort": "LOW"
            })

    # Rank by ROI (savings / effort)
    ranked_suggestions = sorted(suggestions, key=lambda x: x.savings_usd, reverse=True)

    return {
        **state,
        "dfmSuggestions": ranked_suggestions[:5],  # Top 5
        "processingStage": "SUPPLIER_INTEGRATION"
    }

def supplier_integration_node(state: CADProcessingState):
    # Parallel API calls to suppliers
    quotes = await asyncio.gather(
        xometry_api.get_quote(state),
        fictiv_api.get_quote(state),
        return_exceptions=True
    )

    valid_quotes = [q for q in quotes if not isinstance(q, Exception)]

    return {
        **state,
        "supplierQuotes": valid_quotes,
        "processingStage": "COMPLETE"
    }

# Build the graph
workflow = StateGraph(CADProcessingState)

# Add nodes
workflow.add_node("geometry_analyzer", geometry_analyzer_node)
workflow.add_node("feature_extraction", feature_extraction_node)
workflow.add_node("cost_estimation", cost_estimation_node)
workflow.add_node("dfm_recommendation", dfm_recommendation_node)
workflow.add_node("supplier_integration", supplier_integration_node)

# Define edges (sequential flow)
workflow.set_entry_point("geometry_analyzer")
workflow.add_edge("geometry_analyzer", "feature_extraction")
workflow.add_edge("feature_extraction", "cost_estimation")
workflow.add_edge("cost_estimation", "dfm_recommendation")
workflow.add_edge("dfm_recommendation", "supplier_integration")
workflow.add_edge("supplier_integration", END)

# Add checkpointing for fault tolerance
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)
```

### 2.4 RAG System Architecture

**Pinecone Index Configuration:**
```python
# Initialize Pinecone index
import pinecone

pinecone.init(api_key=os.getenv("PINECONE_API_KEY"))

# Create index with namespaces
index = pinecone.Index("cad-cost-estimation")

# Namespace 1: Material Costs (updated daily)
index.upsert(
    vectors=[
        {
            "id": "material_aluminum_6061",
            "values": embedding_model.embed("Aluminum 6061-T6 pricing"),
            "metadata": {
                "material": "Aluminum 6061-T6",
                "unit_cost_usd_per_kg": 4.50,
                "machinability_rating": 8.5,
                "last_updated": "2026-01-19"
            }
        }
    ],
    namespace="material-costs"
)

# Namespace 2: Machining Standards
index.upsert(
    vectors=[
        {
            "id": "tolerance_iso_2768_mH",
            "values": embedding_model.embed("ISO 2768 mH tolerance cost impact"),
            "metadata": {
                "tolerance_grade": "mH",
                "cost_multiplier": 1.4,
                "inspection_overhead_pct": 15
            }
        }
    ],
    namespace="machining-standards"
)

# Namespace 3: Historical Quotes
index.upsert(
    vectors=[
        {
            "id": "quote_12345",
            "values": embedding_model.embed("Complex housing with 12 tapped holes"),
            "metadata": {
                "actual_cost": 320.00,
                "predicted_cost": 315.50,
                "accuracy_pct": 98.6,
                "features": ["tapped_holes", "pockets", "thin_walls"]
            }
        }
    ],
    namespace="historical-quotes"
)
```

**Hybrid Search Implementation:**
```python
def hybrid_search(query: str, filters: dict, top_k: int = 5):
    # 1. Generate query embedding
    query_vector = embedding_model.embed(query)

    # 2. Semantic search in Pinecone
    semantic_results = index.query(
        vector=query_vector,
        filter=filters,
        top_k=top_k * 2,  # Retrieve more for re-ranking
        namespace="material-costs"
    )

    # 3. Metadata filtering (exact match on material type)
    filtered_results = [
        r for r in semantic_results.matches 
        if r.metadata.get("material") == filters.get("material")
    ]

    # 4. Re-rank with cross-encoder for better relevance
    reranked = cross_encoder.rank(query, filtered_results)

    return reranked[:top_k]
```

### 2.5 Data Flow Sequence

**End-to-End Processing Timeline (<5 seconds):**
```
Time  | Stage                          | Component              | Output
------+--------------------------------+------------------------+------------------
0.0s  | User uploads STEP file         | Frontend               | File object
0.1s  | OpenCascade.js instantiation   | WASM Module            | OC instance
0.3s  | STEP file parsing              | OpenCascade.js         | B-Rep topology
1.8s  | Geometry metrics calculation   | Geometry Analyzer      | Volume, surface area
2.0s  | Feature extraction API call    | Werk24 API             | Feature list
3.5s  | RAG query for material costs   | Pinecone + GPT-4o-mini | Cost breakdown
4.2s  | DfM recommendation generation  | DfM Agent              | Top 5 suggestions
4.5s  | Supplier quote requests        | Xometry/Fictiv APIs    | Quote comparison
4.8s  | PDF report generation          | Report Generator       | Downloadable PDF
5.0s  | Results displayed to user      | Frontend               | Dashboard view
```

## 3. Infrastructure & Deployment

### 3.1 Hosting Architecture (Vercel)

**Deployment Configuration:**
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1", "fra1"],  // US East + EU Frankfurt
  "functions": {
    "app/api/**": {
      "runtime": "edge",
      "maxDuration": 10
    },
    "app/api/process/**": {
      "runtime": "nodejs20.x",
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "crons": [
    {
      "path": "/api/cron/update-material-prices",
      "schedule": "0 2 * * *"  // Daily at 2 AM UTC
    }
  ]
}
```

### 3.2 Environment Variables (Security)
```bash
# .env.production
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pc-...
WERK24_API_KEY=w24-...
XOMETRY_API_KEY=xom-...
FICTIV_API_KEY=fct-...
REDIS_URL=redis://...
POSTGRES_URL=postgresql://...
BLOB_STORAGE_TOKEN=vercel_blob_...

# Encryption keys
CAD_FILE_ENCRYPTION_KEY=...  # AES-256 key for at-rest encryption
JWT_SECRET=...               # For user authentication

# Feature flags
ENABLE_MULTI_THREADING=true
ENABLE_WERK24_FALLBACK=true
ENABLE_SUPPLIER_QUOTES=true
```

### 3.3 Monitoring & Observability

**Metrics to Track:**
- **Performance:**
  - P50/P95/P99 latency by processing stage
  - WASM module instantiation time
  - API call success rates (Werk24, suppliers)
  - Cache hit rate (Redis)

- **Accuracy:**
  - Feature extraction F1 score (weekly evaluation)
  - Cost prediction MAPE (vs invoices)
  - DfM suggestion adoption rate

- **Business:**
  - Daily active users
  - Files processed per day
  - Time saved (vs manual estimation)
  - Revenue impact (cost reduction achieved)

**Alerting Rules:**
```yaml
# datadog-alerts.yaml
alerts:
  - name: "High Latency Warning"
    condition: "avg(processing_time_p95) > 7s over 5m"
    action: "notify_slack"

  - name: "Feature Extraction Accuracy Drop"
    condition: "avg(feature_f1_score) < 0.90 over 1d"
    action: "notify_oncall"

  - name: "Werk24 API Failure Spike"
    condition: "count(werk24_api_errors) > 10 over 10m"
    action: "enable_fallback_mode"
```

## 4. Security Architecture

### 4.1 Data Protection

**At-Rest Encryption:**
- CAD files: AES-256 encryption before storage in Vercel Blob
- Database: PostgreSQL native encryption (TDE)
- Redis: TLS-encrypted connections

**In-Transit Encryption:**
- All API calls: TLS 1.3
- WASM module loading: Subresource Integrity (SRI) hashes
- Supplier APIs: Mutual TLS where available

### 4.2 Access Control

**User Authentication:**
```typescript
// Clerk for auth + RBAC
const userRoles = {
  ENGINEER: ["upload", "view_results"],
  ESTIMATOR: ["upload", "view_results", "edit_costs", "approve"],
  ADMIN: ["*"]
};

// API middleware
export async function authMiddleware(req: Request) {
  const user = await getUser(req);
  const requiredRole = getRequiredRole(req.url);

  if (!hasPermission(user.role, requiredRole)) {
    return new Response("Forbidden", { status: 403 });
  }

  return next();
}
```

### 4.3 ITAR Compliance

**Export Control Workflow:**
```typescript
// CAD upload with ITAR flag
if (userInputs.isITAR) {
  // 1. Restrict processing to US-based infrastructure
  const region = "us-east-1";

  // 2. Enable audit logging
  await logITARAccess({
    userId: user.id,
    fileName: file.name,
    timestamp: new Date(),
    ipAddress: req.ip
  });

  // 3. Prevent foreign API routing
  const allowedAPIs = ["xometry_us", "fictiv_us"];

  // 4. Add watermark to PDFs
  reportGenerator.addWatermark("ITAR CONTROLLED - US PERSONS ONLY");
}
```

## 5. Scalability Considerations

### 5.1 Horizontal Scaling

**Load Distribution:**
- Vercel Edge Functions: Auto-scale to 100+ concurrent users
- LangGraph agents: Stateless design enables parallel execution
- Pinecone: Serverless tier scales automatically with QPS

**Batch Processing Queue:**
```python
# Vercel Queue integration for 100+ parts
from vercel_queue import Queue

batch_queue = Queue("cad-batch-processing")

@batch_queue.worker
async def process_batch_job(job_data):
    cad_files = job_data["files"]
    results = []

    # Process in parallel (10 concurrent)
    async with asyncio.TaskGroup() as tg:
        for file in cad_files[:10]:
            tg.create_task(process_single_file(file))

    return results
```

### 5.2 Cost Optimization

**Tiered Processing:**
- **Quick Mode:** Skip DfM, use cached costs → <3s, 50% cheaper
- **Standard Mode:** Full pipeline → <5s, standard pricing
- **Detailed Mode:** Multiple supplier quotes, custom DfM → <10s, premium

**Caching Strategy:**
- Feature extraction: 24h TTL (high hit rate for repeat uploads)
- Material costs: 1h TTL (balance freshness vs API costs)
- Historical quotes: Permanent storage (for model retraining)

---

## 6. Development Workflow

### 6.1 Local Development Setup

**Warp CLI Aliases:**
```bash
# ~/.warprc
alias cad-dev="cd ~/AgenticAI-CAD-Cost-Calculator && pnpm dev"
alias cad-test="pnpm test --watch"
alias cad-build="pnpm build && vercel deploy --prebuilt"
alias cad-lint="pnpm lint && pnpm type-check"
alias cad-db="psql $POSTGRES_URL"
```

### 6.2 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm run test:accuracy  # 10 CAD test cases

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

---

## Appendix: Technology Decision Matrix

| Requirement | Option A | Option B | Selected | Rationale |
|-------------|----------|----------|----------|-----------|
| CAD Parsing | OpenCascade.js (client) | Werk24 API (server) | Hybrid | Client for STEP, API for 2D drawings |
| Agent Framework | LangGraph | CrewAI | LangGraph | Better checkpointing & streaming |
| Vector DB | Pinecone | Weaviate | Pinecone | Serverless scaling, better docs |
| LLM | GPT-4o-mini | Claude 3 Haiku | GPT-4o-mini | Lower latency (<1s) |
| Frontend | Next.js 15 | Remix | Next.js 15 | Better Vercel integration |
| 3D Rendering | Three.js | Babylon.js | Three.js | Lighter bundle, better ecosystem |

---

**Document Status:** ✅ APPROVED  
**Next Review:** April 2026  
**Maintainer:** Senior AI Architect  
