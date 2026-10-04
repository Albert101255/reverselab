from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SectionInfo(BaseModel):
    name: str
    virtual_address: str
    raw_offset: str
    raw_size: int
    virtual_size: Optional[int] = None
    permissions: str
    entropy: Optional[float] = None

# Alias
SectionItem = SectionInfo

class StringItem(BaseModel):
    address: str
    type: str          # utf8, utf16
    length: int
    value: str

class ImportItem(BaseModel):
    library: str
    functions: List[str]

class ExportItem(BaseModel):
    name: str
    address: str
    ordinal: Optional[int] = None
    notes: Optional[str] = None

class InstructionItem(BaseModel):
    address: str
    bytes: str
    mnemonic: str
    operands: str
    comment: Optional[str] = None

class FunctionItem(BaseModel):
    name: str
    address: str
    size: int
    calls: List[str] = []
    references: List[str] = []
    instructions: List[InstructionItem] = []

class XrefItem(BaseModel):
    from_addr: str
    to_addr: str
    type: str          # 'CALL', 'DATA_READ', 'DATA_WRITE', 'JUMP'
    target_name: str

class DataTypeField(BaseModel):
    name: str
    type_name: str
    offset: int
    size: int

class DataTypeStruct(BaseModel):
    name: str
    category: str
    size: int
    fields: List[DataTypeField]

class EntropyBlock(BaseModel):
    offset: int
    size: int
    entropy: float
    section_name: str

class DecompiledFile(BaseModel):
    path: str
    type: str          # 'c', 'h', 'java', 'xml'
    content: str

class FileOverview(BaseModel):
    filename: str
    file_size: int
    md5: str = ""
    sha1: str = ""
    sha256: str
    format: str
    platform: str
    architecture: str
    bitness: int
    endianness: str
    entry_point: str
    image_base: str
    compiler: Optional[str] = "Unknown / Standard"
    linker_info: Optional[str] = None
    packer_hint: Optional[str] = None
    num_sections: int
    num_imports: int
    num_exports: int
    num_functions: int
    is_stripped: Optional[bool] = None
    is_packed: Optional[bool] = None
    has_debug_info: Optional[bool] = None
    is_relocatable: Optional[bool] = None
    is_pie: Optional[bool] = None

class AnalysisResult(BaseModel):
    file_id: str
    overview: FileOverview
    headers: Dict[str, Any] = {}
    sections: List[SectionInfo] = []
    strings: List[StringItem] = []
    imports: List[ImportItem] = []
    exports: List[ExportItem] = []
    functions: List[FunctionItem] = []
    xrefs: List[XrefItem] = []
    data_types: List[DataTypeStruct] = []
    entropy_blocks: List[EntropyBlock] = []
    decompiled_files: List[DecompiledFile] = []
    raw_hex_preview: str = ""
    disassembly_preview: List[InstructionItem] = []

class PatchRequest(BaseModel):
    file_id: str
    offset: int
    hex_bytes: str

class SearchRequest(BaseModel):
    file_id: str
    query: str
    search_type: str  # 'text', 'hex', 'scalar'

class ExecRequest(BaseModel):
    file_id: str
    code: str
