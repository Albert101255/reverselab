import requests
import sys

BASE_URL = "http://localhost:8000"

def test_api():
    print("=== ReverseLab Backend API QA Test ===")
    
    # 1. Test Root / OpenAPI
    res = requests.get(f"{BASE_URL}/docs")
    assert res.status_code == 200, f"Docs endpoint failed: {res.status_code}"
    print("✓ GET /docs - OK")

    # 2. Test File Upload (Sample ELF / PE header bytes)
    sample_binary = b"\x7FELF\x02\x01\x01\x00" + b"\x00" * 500 + b"Hello ReverseLab Malware" + b"\x00" * 100
    files = {'file': ('test_sample.elf', sample_binary, 'application/octet-stream')}
    res = requests.post(f"{BASE_URL}/api/files", files=files)
    assert res.status_code == 200, f"Upload failed: {res.status_code} - {res.text}"
    data = res.json()
    file_id = data["file_id"]
    print(f"✓ POST /api/files - OK (file_id: {file_id})")

    # 3. Test Get File Analysis
    res = requests.get(f"{BASE_URL}/api/files/{file_id}")
    assert res.status_code == 200, f"Get analysis failed: {res.status_code}"
    print("✓ GET /api/files/{file_id} - OK")

    # 4. Test Decompile Endpoint
    res = requests.post(f"{BASE_URL}/api/files/decompile", json={"file_id": file_id, "function_name": "main"})
    assert res.status_code == 200, f"Decompile failed: {res.status_code} - {res.text}"
    decomp = res.json()
    assert "pseudocode" in decomp, "Missing pseudocode in decomp response"
    print("✓ POST /api/files/decompile - OK")

    # 5. Test Search Endpoint
    res = requests.post(f"{BASE_URL}/api/files/search", json={"file_id": file_id, "query": "Hello", "search_type": "text"})
    assert res.status_code == 200, f"Search failed: {res.status_code}"
    matches = res.json().get("matches", [])
    assert len(matches) > 0, "Expected search matches for 'Hello'"
    print(f"✓ POST /api/files/search - OK (found {len(matches)} matches)")

    # 6. Test Hex Patch Endpoint
    res = requests.post(f"{BASE_URL}/api/files/patch", json={"file_id": file_id, "offset": 0, "hex_bytes": "90909090"})
    assert res.status_code == 200, f"Patch failed: {res.status_code}"
    print("✓ POST /api/files/patch - OK")

    # 7. Test Python Script Exec Endpoint
    code = "print(f'Functions count: {len(get_functions())}')\nprint(f'Strings count: {len(get_strings())}')"
    res = requests.post(f"{BASE_URL}/api/files/exec", json={"file_id": file_id, "code": code})
    assert res.status_code == 200, f"Script exec failed: {res.status_code}"
    output = res.json().get("output", "")
    assert "Functions count" in output, f"Unexpected script output: {output}"
    print(f"✓ POST /api/files/exec - OK (output: {output.strip()})")

    # 8. Test Sub-resource GET endpoints
    for ep in ["strings", "sections", "functions", "disassembly"]:
        res = requests.get(f"{BASE_URL}/api/files/{file_id}/{ep}")
        assert res.status_code == 200, f"GET /{ep} failed: {res.status_code}"
        print(f"✓ GET /api/files/{{file_id}}/{ep} - OK")

    print("\n🎉 ALL BACKEND QA TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        test_api()
    except Exception as e:
        print(f"❌ QA TEST FAILED: {e}")
        sys.exit(1)
