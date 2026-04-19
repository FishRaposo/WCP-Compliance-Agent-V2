/**
 * Mastra Instance Registration
 *
 * @deprecated This Mastra-based architecture is legacy and is being superseded by the three-layer pipeline
 * in src/pipeline/. New code should use the pipeline orchestrator (src/pipeline/orchestrator.ts) instead.
 *
 * Registers all agents, tools, and workflows with Mastra framework.
 * This is the entry point for the Mastra-based architecture.
 *
 * @file src/mastra/index.ts
 * @see AGENTS.md - Mastra registration patterns
 * @see docs/phase-0-out-of-scope.md - Migration plan
 */

// External dependencies
import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { mkdirSync } from "fs";
import { dirname } from "path";

// Internal dependencies
import { wcpAgent } from "./agents/wcp-agent.js";
import { getDatabaseConfig } from "../config/db-config.js";
import { getAppConfig } from "../config/app-config.js";

/**
 * Get database configuration for storage
 */
const dbConfig = getDatabaseConfig();

/**
 * Get application configuration for observability
 */
const appConfig = getAppConfig();

/**
 * Determine if we're in development mode
 */
const isDev = appConfig.environment === 'development' || appConfig.environment === 'test';

/**
 * Get log level from environment with validation
 * Returns a valid log level that PinoLogger accepts, defaults to 'info'
 */
function getLogLevel() {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  return validLevels.includes(level || '') ? level : 'info';
}

/**
 * Ensure database directory exists
 * LibSQLStore requires the directory to exist before creating the database file
 */
function ensureDatabaseDirectory(dbUrl: string): void {
  // Extract directory from file:// URL or path
  const match = dbUrl.match(/^file:(.+)$/);
  if (match) {
    const dbPath = match[1];
    const dir = dirname(dbPath);
    try {
      mkdirSync(dir, { recursive: true });
    } catch (error: unknown) {
      // Only ignore if directory already exists, log other errors
      if (error && typeof error === "object" && "code" in error && error.code !== 'EEXIST') {
        console.error(`Failed to create database directory: ${dir}`, error);
      }
    }
  }
}

// Ensure database directory exists before creating storage
ensureDatabaseDirectory(dbConfig.url);

/**
 * Mastra Instance
 * 
 * Main Mastra instance for the WCP AI Agent Prototype.
 * Configured with:
 * - Agents: wcpAgent for WCP compliance validation
 * - Logger: PinoLogger for structured, searchable logs
 * - Storage: LibSQLStore for persistent audit trail
 * - Observability: Enabled in production for AI tracing
 */

// Ensure database directory exists before creating storage
ensureDatabaseDirectory(dbConfig.url);

/**
 * Mastra Instance
 * 
 * Main Mastra instance for the WCP AI Agent Prototype.
 * Configured with:
 * - Agents: wcpAgent for WCP compliance validation
 * - Logger: PinoLogger for structured, searchable logs
 * - Storage: LibSQLStore for persistent audit trail
 * - Observability: Enabled in production for AI tracing
 */
export const mastra = new Mastra({
  agents: { wcpAgent },
  
  // Structured logging with Pino
  logger: new PinoLogger({
    level: getLogLevel() as any, // Validated above, safe to cast
  }),
  
  // Persistent storage with SQLite
  storage: new LibSQLStore({
    url: dbConfig.url,
  }),
});
