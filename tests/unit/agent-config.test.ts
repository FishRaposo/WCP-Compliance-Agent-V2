import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAgentConfig, DEFAULT_AGENT_CONFIG } from '../../src/config/agent-config.js';

describe('getAgentConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns defaults when no env vars set', () => {
    delete process.env.OPENAI_MODEL;
    delete process.env.MAX_STEPS;
    delete process.env.AGENT_TIMEOUT;
    delete process.env.OPENAI_TEMPERATURE;
    delete process.env.OPENAI_MAX_TOKENS;

    const config = getAgentConfig();
    expect(config.model).toBe('gpt-4o-mini');
    expect(config.maxSteps).toBe(3);
    expect(config.timeout).toBe(30000);
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(2000);
  });

  it('reads OPENAI_MODEL from env', () => {
    process.env.OPENAI_MODEL = 'gpt-4o';
    const config = getAgentConfig();
    expect(config.model).toBe('gpt-4o');
  });

  it('reads MAX_STEPS from env', () => {
    process.env.MAX_STEPS = '5';
    const config = getAgentConfig();
    expect(config.maxSteps).toBe(5);
  });

  it('reads AGENT_TIMEOUT from env', () => {
    process.env.AGENT_TIMEOUT = '60000';
    const config = getAgentConfig();
    expect(config.timeout).toBe(60000);
  });

  it('reads OPENAI_TEMPERATURE from env', () => {
    process.env.OPENAI_TEMPERATURE = '0.5';
    const config = getAgentConfig();
    expect(config.temperature).toBe(0.5);
  });

  it('reads OPENAI_MAX_TOKENS from env', () => {
    process.env.OPENAI_MAX_TOKENS = '4000';
    const config = getAgentConfig();
    expect(config.maxTokens).toBe(4000);
  });

  it('returns a complete AgentConfig object', () => {
    const config = getAgentConfig();
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('maxSteps');
    expect(config).toHaveProperty('timeout');
    expect(config).toHaveProperty('temperature');
    expect(config).toHaveProperty('maxTokens');
  });
});

describe('DEFAULT_AGENT_CONFIG', () => {
  it('has correct model default', () => {
    expect(DEFAULT_AGENT_CONFIG.model).toBe('gpt-4o-mini');
  });

  it('has correct maxSteps default', () => {
    expect(DEFAULT_AGENT_CONFIG.maxSteps).toBe(3);
  });

  it('has correct timeout default', () => {
    expect(DEFAULT_AGENT_CONFIG.timeout).toBe(30000);
  });

  it('has correct temperature default', () => {
    expect(DEFAULT_AGENT_CONFIG.temperature).toBe(0.7);
  });

  it('has correct maxTokens default', () => {
    expect(DEFAULT_AGENT_CONFIG.maxTokens).toBe(2000);
  });
});
