from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.analysis_service import AnalysisService
from app.models.schemas import AnalysisResult, PatchRequest, SearchRequest, ExecRequest

router = APIRouter(prefix="/api/files", tags=["Files"])

class DecompileRequest(BaseModel):
    file_id: str
    function_name: str = "main"

@router.post("", response_model=AnalysisResult)
async def upload_and_analyze_file(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    contents = await file.read()
    if len(contents) > 700 * 1024 * 1024:  # Max 700MB file limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum upload limit of 700MB")

    result = AnalysisService.process_file(contents, file.filename)
    return result

@router.get("/{file_id}", response_model=AnalysisResult)
async def get_file_analysis(file_id: str):
    result = AnalysisService.get_analysis(file_id)
    if not result:
        raise HTTPException(status_code=404, detail="File analysis job not found")
    return result

@router.post("/decompile")
async def decompile_function_endpoint(req: DecompileRequest):
    res = AnalysisService.decompile_function(req.file_id, req.function_name)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.post("/patch")
async def patch_file_bytes(req: PatchRequest):
    res = AnalysisService.patch_bytes(req.file_id, req.offset, req.hex_bytes)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.post("/search")
async def search_binary_content(req: SearchRequest):
    matches = AnalysisService.search_binary(req.file_id, req.query, req.search_type)
    return {"matches": matches}

@router.post("/exec")
async def execute_python_script(req: ExecRequest):
    output = AnalysisService.execute_script(req.file_id, req.code)
    return {"output": output}

@router.get("/{file_id}/strings")
async def get_strings(file_id: str):
    result = AnalysisService.get_analysis(file_id)
    if not result:
        raise HTTPException(status_code=404, detail="File analysis job not found")
    return {"strings": result["strings"]}

@router.get("/{file_id}/sections")
async def get_sections(file_id: str):
    result = AnalysisService.get_analysis(file_id)
    if not result:
        raise HTTPException(status_code=404, detail="File analysis job not found")
    return {"sections": result["sections"]}

@router.get("/{file_id}/functions")
async def get_functions(file_id: str):
    result = AnalysisService.get_analysis(file_id)
    if not result:
        raise HTTPException(status_code=404, detail="File analysis job not found")
    return {"functions": result["functions"]}

@router.get("/{file_id}/disassembly")
async def get_disassembly(file_id: str):
    result = AnalysisService.get_analysis(file_id)
    if not result:
        raise HTTPException(status_code=404, detail="File analysis job not found")
    return {"disassembly": result["disassembly_preview"]}
