import axios from 'axios';
import { env } from '../config/env.js';
import type { ScoreRequest, ScoreComputation } from '../types.js';

export class MasumiClient {
  async delegateScoring(request: ScoreRequest): Promise<Pick<ScoreComputation, 'adjustedScore' | 'rationale'>> {
    try {
      const response = await axios.post(
        `${env.MASUMI_AGENT_URL}/score`,
        { request },
        {
          headers: {
            'x-agent-key': env.MASUMI_AGENT_KEY
          },
          timeout: 3_000
        }
      );

      return response.data;
    } catch (error) {
      // fallback to local scoring; masumi agent might be offline
      return {
        adjustedScore: 0,
        rationale: ['Masumi fallback engaged']
      };
    }
  }
}

export const masumiClient = new MasumiClient();
