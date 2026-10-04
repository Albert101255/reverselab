import re

class StringExtractor:
    @staticmethod
    def extract_strings(data: bytes, min_len: int = 4) -> list:
        strings = []
        
        # ASCII extraction
        ascii_pattern = re.compile(b'[\x20-\x7E]{' + str(min_len).encode() + b',}')
        for match in ascii_pattern.finditer(data):
            val = match.group(0).decode('ascii', errors='ignore')
            addr = hex(match.start())
            strings.append({
                "address": addr,
                "type": "ASCII",
                "length": len(val),
                "value": val
            })

        # UTF-16 LE extraction
        utf16_pattern = re.compile(b'(?:[\x20-\x7E]\x00){' + str(min_len).encode() + b',}')
        for match in utf16_pattern.finditer(data):
            try:
                val = match.group(0).decode('utf-16le', errors='ignore')
                addr = hex(match.start())
                strings.append({
                    "address": addr,
                    "type": "UTF-16LE",
                    "length": len(val),
                    "value": val
                })
            except Exception:
                pass

        # Sort strings by address offset
        strings.sort(key=lambda x: int(x["address"], 16))
        return strings[:500]  # Cap top 500 strings for responsive UX
