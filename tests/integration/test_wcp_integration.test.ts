import { describe, it, expect } from "vitest";
import { generateWcpDecision } from "../../src/entrypoints/wcp-entrypoint.js";

describe("wcp entrypoint integration", () => {
  it("generates WCP decision via pipeline orchestrator", async () => {
    const response = await generateWcpDecision({
      content: "Role: Electrician, Hours: 40, Wage: $55.00",
    });

    // Verify the response structure
    expect(response).toBeDefined();
    expect(response.traceId).toBeDefined();
    expect(response.finalStatus).toBeDefined();
    expect(response.deterministic).toBeDefined();
    expect(response.verdict).toBeDefined();
    expect(response.trust).toBeDefined();
    expect(response.humanReview).toBeDefined();
    expect(response.auditTrail).toBeDefined();
  });
});