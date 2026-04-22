## 2026-04-19 - DoS Protection on Analyze Endpoint
**Vulnerability:** The `/analyze` endpoint accepted unconstrained `content` string lengths in its request payload, leading to potential Denial of Service (DoS) attacks as memory consumption and pipeline processing time scaled linearly with payload size.
**Learning:** External-facing APIs must restrict the maximum size of input payloads explicitly before any complex parsing, extraction, or downstream pipeline steps process the data.
**Prevention:** Implement `maxContentLength` in application configurations and explicitly check the `content.length` at the API layer, returning an immediate `413 Payload Too Large` error for oversized inputs to reject them cheaply.
