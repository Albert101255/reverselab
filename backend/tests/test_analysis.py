from app.detectors.file_detector import FileDetector
from app.analysis.strings import StringExtractor

def test_file_detector_pe():
    # MZ header bytes
    pe_bytes = b'MZ\x90\x00\x03\x00\x00\x00'
    res = FileDetector.detect(pe_bytes, "test.exe")
    assert "PE" in res["format"]
    assert res["platform"] == "Windows"

def test_file_detector_elf():
    # \x7fELF header bytes
    elf_bytes = b'\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x3E\x00'
    res = FileDetector.detect(elf_bytes, "test_elf")
    assert "ELF" in res["format"]
    assert res["platform"] == "Linux / Unix"

def test_string_extractor():
    sample_bytes = b'Hello ReverseLab World!\x00\x00\x00AnotherStringHere'
    strings = StringExtractor.extract_strings(sample_bytes, min_len=4)
    values = [s["value"] for s in strings]
    assert "Hello ReverseLab World!" in values
    assert "AnotherStringHere" in values
