import 'dotenv/config';

type EnvKey = 'PORT' | 'MIDNIGHT_RPC' | 'MASUMI_AGENT_URL' | 'MASUMI_AGENT_KEY';

const defaults: Record<EnvKey, string> = {
  PORT: '4000',
  MIDNIGHT_RPC: 'https://midnight.example.org/rpc',
  MASUMI_AGENT_URL: 'http://localhost:8000',
  MASUMI_AGENT_KEY: 'demo-key'
};

export const env = new Proxy(defaults, {
  get(target, prop: string) {
    const key = prop as EnvKey;
    return process.env[key] ?? target[key];
  }
});
