export interface HeaderField {
  field: string;
  offset: string;
  hex_value: string;
  decoded_value: string;
  description: string;
}

export interface SectionItem {
  name: string;
  virtual_address: string;
  raw_offset: string;
  raw_size: number;
  virtual_size?: number;
  permissions: string;
  entropy?: number;
}

// Legacy alias
export type SectionInfo = SectionItem;

export interface StringItem {
  address: string;
  type: string;
  length: number;
  value: string;
}

export interface ImportItem {
  library: string;
  functions: string[];
}

export interface ExportItem {
  name: string;
  address: string;
  ordinal?: number;
  notes?: string;
}

export interface InstructionItem {
  address: string;
  bytes: string;
  mnemonic: string;
  operands: string;
  comment?: string;
}

export interface FunctionItem {
  name: string;
  address: string;
  size: number;
  calls: string[];
  references: string[];
  instructions: InstructionItem[];
}

export interface XrefItem {
  from_addr: string;
  to_addr: string;
  type: 'CALL' | 'DATA_READ' | 'DATA_WRITE' | 'JUMP';
  target_name: string;
}

export interface DataTypeField {
  name: string;
  type_name: string;
  offset: number;
  size: number;
}

export interface DataTypeStruct {
  name: string;
  category: string;
  size: number;
  fields: DataTypeField[];
}

export interface EntropyBlock {
  offset: number;
  size: number;
  entropy: number;
  section_name: string;
}

export interface DecompiledFile {
  path: string;
  type: string;
  content: string;
}

export interface SearchMatch {
  offset: string;
  match: string;
  type: string;
}

export interface FileOverview {
  filename: string;
  file_size: number;
  md5: string;
  sha1: string;
  sha256: string;
  format: string;
  platform: string;
  architecture: string;
  bitness: number;
  endianness: string;
  entry_point: string;
  image_base: string;
  compiler?: string;
  linker_info?: string;
  packer_hint?: string;
  num_sections: number;
  num_imports: number;
  num_exports: number;
  num_functions: number;
  is_stripped?: boolean;
  is_packed?: boolean;
  has_debug_info?: boolean;
  is_relocatable?: boolean;
  is_pie?: boolean;
}

export interface AnalysisResult {
  file_id: string;
  overview: FileOverview;
  headers: Record<string, string | number | boolean | null | undefined>;
  sections: SectionItem[];
  strings: StringItem[];
  imports: ImportItem[];
  exports: ExportItem[];
  functions: FunctionItem[];
  xrefs?: XrefItem[];
  data_types?: DataTypeStruct[];
  entropy_blocks?: EntropyBlock[];
  decompiled_files?: DecompiledFile[];
  raw_hex_preview: string;
  disassembly_preview: InstructionItem[];
}
