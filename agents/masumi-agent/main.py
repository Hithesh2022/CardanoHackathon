from __future__ import annotations

from datetime import datetime
from typing import List

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

APP_KEY = "demo-key"
app = FastAPI(title="Masumi Credit Brain", version="0.1.0")


class Proof(BaseModel):
    id: str
    hash: str
    expiresAt: str


class Aggregates(BaseModel):
    incomeStability: float
    repaymentConsistency: float
    savingsRate: float
    communityTrust: float


class ScoreRequest(BaseModel):
    sessionId: str
    walletAddress: str
    did: str | None = None
    proofs: List[Proof]
    aggregates: Aggregates


class ScoreResponse(BaseModel):
    adjustedScore: float
    rationale: List[str]


def fairness_kernel(values: np.ndarray) -> float:
    weights = np.array([0.42, 0.28, 0.2, 0.1])
    bias_guard = np.maximum(0, 0.65 - values.mean())
    return float((values @ weights + bias_guard * 0.4) * 1000)


@app.post("/score", response_model=ScoreResponse)
async def score(payload: dict, x_agent_key: str = Header(..., alias="x-agent-key")):
    if x_agent_key != APP_KEY:
        raise HTTPException(status_code=401, detail="Invalid agent key")

    request = ScoreRequest(**payload["request"])
    agg = request.aggregates
    vector = np.array([
        agg.incomeStability,
        agg.repaymentConsistency,
        agg.savingsRate,
        agg.communityTrust,
    ])

    score = fairness_kernel(vector)
    rationale = [
        f"Masumi fairness kernel applied at {datetime.utcnow().isoformat()}",
        f"Inputs => {vector.round(3).tolist()}"
    ]

    return ScoreResponse(adjustedScore=score, rationale=rationale)


@app.get("/health")
async def health():
    return {"status": "ok", "ts": datetime.utcnow().isoformat()}
