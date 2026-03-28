from functools import lru_cache

from src.rag.pipeline_manager import PipelineManager


@lru_cache(maxsize=1)
def get_pipeline() -> PipelineManager:
    return PipelineManager()
