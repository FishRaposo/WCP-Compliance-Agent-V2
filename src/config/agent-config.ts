/**
 * Agent Configuration
 * 
 * Configuration for the WCP AI Agent including model settings,
 * execution parameters, and LLM configuration.
 * 
 * @file src/config/agent-config.ts
 * @see AGENTS.md for coding patterns
 * @see CONTEXT.md for architecture decisions
 */

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  /** OpenAI model to use */
  model: string;
  /** Maximum steps for agent execution */
  maxSteps: number;
  /** Timeout for agent operations (ms) */
  timeout: number;
  /** Temperature for LLM generation */
  temperature: number;
  /** Maximum tokens for LLM response */
  maxTokens: number;
}

/**
 * Get agent configuration from environment
 * @returns Agent configuration
 */
export function getAgentConfig(): AgentConfig {
  return {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxSteps: parseInt(process.env.MAX_STEPS || '3', 10),
    timeout: parseInt(process.env.AGENT_TIMEOUT || '30000', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
  };
}

/**
 * Default agent configuration
 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: 'gpt-4o-mini',
  maxSteps: 3,
  timeout: 30000,
  temperature: 0.7,
  maxTokens: 2000,
};
