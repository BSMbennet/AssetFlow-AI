from fastapi import APIRouter
from .document import router as document_router
from .valuation import router as valuation_router
from .risk import router as risk_router
from .compliance import router as compliance_router
from .contract import router as contract_router
from .workflows import router as workflows_router

router = APIRouter()
router.include_router(document_router, prefix="/document", tags=["Document Analysis"])
router.include_router(valuation_router, prefix="/valuation", tags=["Valuation"])
router.include_router(risk_router, prefix="/risk", tags=["Risk Assessment"])
router.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])
router.include_router(contract_router, prefix="/contract", tags=["Contract Analysis"])
router.include_router(workflows_router, prefix="/workflows", tags=["Workflows"])
