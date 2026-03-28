import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import {
  viewDocument,
  viewDocumentParams,
  viewDocumentToolName,
} from "./document-viewer.ts";
import {
  showRagSources,
  showRagSourcesParams,
  showRagSourcesToolName,
} from "./rag-sources.ts";
import {
  showPatientTimeline,
  showPatientTimelineParams,
  showPatientTimelineToolName,
} from "./patient-timeline.ts";
import {
  showLabCharts,
  showLabChartsParams,
  showLabChartsToolName,
} from "./lab-charts.ts";
import {
  buildSmartForm,
  buildSmartFormParams,
  buildSmartFormToolName,
} from "./smart-form.ts";

const FASTAPI_BASE = process.env.FASTAPI_URL ?? "http://localhost:8001";
const PORT = parseInt(process.env.PORT ?? "9000", 10);

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
const server = new McpServer({
  name: "mednemo-mcp-apps",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// Tool 1: view_document
// ---------------------------------------------------------------------------
server.tool(
  viewDocumentToolName,
  "Display a patient document (PDF/image) with zoom, pan, and page navigation.",
  {
    session_id: viewDocumentParams.shape.session_id,
    document_id: viewDocumentParams.shape.document_id,
  },
  async ({ session_id, document_id }) => {
    try {
      const result = await viewDocument({ session_id, document_id });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: (err as Error).message,
              session_id,
              document_id,
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool 2: show_rag_sources
// ---------------------------------------------------------------------------
server.tool(
  showRagSourcesToolName,
  "Show RAG retrieval source chunks with relevance scores and highlighted passages.",
  {
    session_id: showRagSourcesParams.shape.session_id,
    query: showRagSourcesParams.shape.query,
  },
  async ({ session_id, query }) => {
    try {
      const result = await showRagSources({ session_id, query });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: (err as Error).message,
              session_id,
              query,
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool 3: show_lab_charts
// ---------------------------------------------------------------------------
server.tool(
  showLabChartsToolName,
  "Display lab results as line charts with normal-range bands.",
  {
    session_id: showLabChartsParams.shape.session_id,
    lab_type: showLabChartsParams.shape.lab_type,
  },
  async ({ session_id, lab_type }) => {
    try {
      const result = await showLabCharts({ session_id, lab_type });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: (err as Error).message,
              session_id,
              lab_type: lab_type ?? null,
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool 4: show_patient_timeline
// ---------------------------------------------------------------------------
server.tool(
  showPatientTimelineToolName,
  "Show a color-coded chronological timeline of patient events.",
  {
    session_id: showPatientTimelineParams.shape.session_id,
  },
  async ({ session_id }) => {
    try {
      const result = await showPatientTimeline({ session_id });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: (err as Error).message,
              session_id,
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool 5: build_smart_form
// ---------------------------------------------------------------------------
server.tool(
  buildSmartFormToolName,
  "Generate an auto-populated referral or prescription form.",
  {
    session_id: buildSmartFormParams.shape.session_id,
    form_type: buildSmartFormParams.shape.form_type,
    patient_id: buildSmartFormParams.shape.patient_id,
  },
  async ({ session_id, form_type, patient_id }) => {
    try {
      const result = await buildSmartForm({ session_id, form_type, patient_id });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: (err as Error).message,
              session_id,
              form_type,
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Express + SSE Transport
// ---------------------------------------------------------------------------
const app = express();

// Serve built UI apps as static files
app.use("/apps", express.static("dist/apps"));

// Proxy health-check to FastAPI
app.get("/health", async (_req, res) => {
  try {
    const resp = await fetch(`${FASTAPI_BASE}/health`);
    const data = await resp.json();
    res.json({ mcp: "ok", fastapi: data });
  } catch {
    res.json({ mcp: "ok", fastapi: "unreachable" });
  }
});

// SSE endpoint for MCP clients
const transports: Record<string, SSEServerTransport> = {};

app.get("/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (!transport) {
    res.status(400).json({ error: "Unknown session" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  console.log(`🏥 MedNemo MCP Server running on http://localhost:${PORT}`);
  console.log(`   Proxying to FastAPI at ${FASTAPI_BASE}`);
  console.log(`   SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`   5 tools registered: view_document, show_rag_sources, show_lab_charts, show_patient_timeline, build_smart_form`);
});
