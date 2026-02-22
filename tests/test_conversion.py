
import os
import sys
import unittest
import tempfile
from fastapi.testclient import TestClient
from PIL import Image
from reportlab.pdfgen import canvas

# Adjust path to import api_server
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api_server import app

client = TestClient(app)

class TestConversionEndpoints(unittest.TestCase):
    def setUp(self):
        # Create a dummy PDF
        self.pdf_fd, self.pdf_path = tempfile.mkstemp(suffix=".pdf")
        c = canvas.Canvas(self.pdf_path)
        c.drawString(100, 750, "Hello World from PDF")
        c.save()
        
        # Create a dummy Image
        self.img_fd, self.img_path = tempfile.mkstemp(suffix=".png")
        img = Image.new('RGB', (100, 100), color = 'red')
        img.save(self.img_path)

    def tearDown(self):
        os.close(self.pdf_fd)
        os.close(self.img_fd)
        os.remove(self.pdf_path)
        os.remove(self.img_path)

    def test_pdf_to_word(self):
        with open(self.pdf_path, "rb") as f:
            response = client.post("/api/convert/pdf-to-word", files={"file": ("test.pdf", f, "application/pdf")})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.headers["content-type"] in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"])

    def test_img_to_pdf(self):
        with open(self.img_path, "rb") as f:
            # Note: The endpoint expects a list of files, but TestClient handles this
            response = client.post("/api/convert/img-to-pdf", files=[("files", ("test.png", f, "image/png"))])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")

    def test_pdf_to_excel(self):
        # This might fail if pdfplumber isn't installed or PDF has no tables, but let's check status
        with open(self.pdf_path, "rb") as f:
            response = client.post("/api/convert/pdf-to-excel", files={"file": ("test.pdf", f, "application/pdf")})
        
        # It might be 400 because no tables found, but that means the endpoint is reachable
        if response.status_code == 400:
            self.assertIn("No tables found", response.json()["detail"])
        else:
            if response.status_code != 200:
                print(f"DEBUG: {response.json()}")
            self.assertEqual(response.status_code, 200)

    def test_img_to_excel(self):
        with open(self.img_path, "rb") as f:
             response = client.post("/api/convert/img-to-excel", files={"file": ("test.png", f, "image/png")})
        # Currently returns 400 as implemented
        self.assertEqual(response.status_code, 400)
        self.assertIn("Image to Excel requires OCR/AI", response.json()["detail"])


if __name__ == '__main__':
    with open("test_log.txt", "w", encoding="utf-8") as f:
        runner = unittest.TextTestRunner(stream=f, verbosity=2)
        unittest.main(testRunner=runner, exit=False)

