from fastapi import APIRouter, Depends

from api.dependencies import get_pipeline
from src.rag.pipeline_manager import PipelineManager

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check(pipeline: PipelineManager = Depends(get_pipeline)):
    ready = pipeline.is_ready()
    return {"status": "ok" if ready else "unavailable", "weaviate": ready}
