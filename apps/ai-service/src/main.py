from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
from typing import Dict, Any
import os

from .config import settings
from .api import router
from .core.agents import (
    DocumentAnalysisAgent,
    ValuationAgent,
    RiskAssessmentAgent,
    ComplianceAgent,
    ContractAnalysisAgent,
    DueDiligenceAgent,
)
from .core.workflows import (
    AssetTokenizationWorkflow,
    ComplianceWorkflow,
    TradingWorkflow,
)
from .services import (
    DocumentService,
    EmbeddingService,
    LLMService,
    CacheService,
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("🚀 Starting AssetFlow AI Service...")
    
    # Initialize services
    app.state.cache_service = CacheService()
    await app.state.cache_service.initialize()
    
    app.state.llm_service = LLMService()
    await app.state.llm_service.initialize()
    
    app.state.embedding_service = EmbeddingService()
    await app.state.embedding_service.initialize()
    
    app.state.document_service = DocumentService()
    await app.state.document_service.initialize()
    
    # Initialize AI agents
    app.state.document_agent = DocumentAnalysisAgent(
        llm_service=app.state.llm_service,
        embedding_service=app.state.embedding_service,
    )
    await app.state.document_agent.initialize()
    
    app.state.valuation_agent = ValuationAgent(
        llm_service=app.state.llm_service,
        cache_service=app.state.cache_service,
    )
    await app.state.valuation_agent.initialize()
    
    app.state.risk_agent = RiskAssessmentAgent(
        llm_service=app.state.llm_service,
    )
    await app.state.risk_agent.initialize()
    
    app.state.compliance_agent = ComplianceAgent(
        llm_service=app.state.llm_service,
        document_service=app.state.document_service,
    )
    await app.state.compliance_agent.initialize()
    
    app.state.contract_agent = ContractAnalysisAgent(
        llm_service=app.state.llm_service,
    )
    await app.state.contract_agent.initialize()
    
    app.state.due_diligence_agent = DueDiligenceAgent(
        llm_service=app.state.llm_service,
        document_service=app.state.document_service,
    )
    await app.state.due_diligence_agent.initialize()
    
    # Initialize workflows
    app.state.tokenization_workflow = AssetTokenizationWorkflow(
        valuation_agent=app.state.valuation_agent,
        compliance_agent=app.state.compliance_agent,
        risk_agent=app.state.risk_agent,
    )
    
    app.state.compliance_workflow = ComplianceWorkflow(
        compliance_agent=app.state.compliance_agent,
        document_agent=app.state.document_agent,
    )
    
    app.state.trading_workflow = TradingWorkflow(
        risk_agent=app.state.risk_agent,
        valuation_agent=app.state.valuation_agent,
    )
    
    logger.info("✅ AI agents and workflows initialized successfully")
    
    yield
    
    # Cleanup
    await app.state.document_agent.cleanup()
    await app.state.valuation_agent.cleanup()
    await app.state.risk_agent.cleanup()
    await app.state.compliance_agent.cleanup()
    await app.state.contract_agent.cleanup()
    await app.state.due_diligence_agent.cleanup()
    await app.state.cache_service.cleanup()
    await app.state.llm_service.cleanup()
    await app.state.embedding_service.cleanup()
    await app.state.document_service.cleanup()
    
    logger.info("🔄 AI Service shutdown complete")

app = FastAPI(
    title="AssetFlow AI - AI Service",
    version="1.0.0",
    description="Enterprise AI Service for RWA Tokenization",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# Include Routers
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "service": "AssetFlow AI Service",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "api": "/api/v1",
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0",
        "agents": {
            "document": "ready",
            "valuation": "ready",
            "risk": "ready",
            "compliance": "ready",
            "contract": "ready",
            "due_diligence": "ready",
        },
        "workflows": {
            "tokenization": "ready",
            "compliance": "ready",
            "trading": "ready",
        },
        "timestamp": str(datetime.now()),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
