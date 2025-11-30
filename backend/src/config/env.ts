import 'dotenv/config';

type EnvKey = 'NODE_ENV' | 'PORT' | 'MIDNIGHT_RPC' | 'MIDNIGHT_PROOF_SERVER' | 'MASUMI_AGENT_URL' | 'MASUMI_AGENT_KEY' | 'MIDNIGHT_PAYMENT_CONTRACT' | 'MIDNIGHT_CONTRACT_ADDRESS';

const defaults: Record<EnvKey, string> = {
  NODE_ENV: 'development',
  PORT: '4000',
  MIDNIGHT_RPC: 'https://midnight.example.org/rpc',
  MIDNIGHT_PROOF_SERVER: 'http://localhost:6300',
  MASUMI_AGENT_URL: 'http://localhost:8000',
  MASUMI_AGENT_KEY: 'demo-key',
  MIDNIGHT_PAYMENT_CONTRACT: 'midnight1qxy_payment_contract_pending_deployment',
  MIDNIGHT_CONTRACT_ADDRESS: ''
};

export const env = new Proxy(defaults, {
  get(target, prop: string) {
    const key = prop as EnvKey;
    return process.env[key] ?? target[key];
  }
});
