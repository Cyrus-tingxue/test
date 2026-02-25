import os
import io
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse

router = APIRouter()

@router.post("/img-to-excel")
async def img_to_excel(file: UploadFile = File(...)):
    try:
        from PIL import Image
        import pandas as pd
        return JSONResponse(status_code=400, content={"detail": "Image to Excel requires OCR/AI integration. Please use PDF to Excel for now."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pdf-to-excel")
async def pdf_to_excel(file: UploadFile = File(...)):
    try:
        import pdfplumber
        import pandas as pd
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
             tmp_pdf.write(await file.read())
             tmp_pdf_path = tmp_pdf.name
        
        excel_path = tmp_pdf_path.replace(".pdf", ".xlsx")
        
        try:
            with pdfplumber.open(tmp_pdf_path) as pdf:
                all_tables = []
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        df = pd.DataFrame(table[1:], columns=table[0])
                        all_tables.append(df)
            
            if not all_tables:
                 raise HTTPException(status_code=400, detail="No tables found in PDF")
                 
            with pd.ExcelWriter(excel_path) as writer:
                for i, df in enumerate(all_tables):
                    df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)
                    
            return FileResponse(
                excel_path, 
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                filename=f"{file.filename.replace('.pdf', '')}.xlsx"
            )
        finally:
            if os.path.exists(tmp_pdf_path):
                os.remove(tmp_pdf_path)
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="pdfplumber/pandas not installed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    try:
        from pdf2docx import Converter
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
             tmp_pdf.write(await file.read())
             tmp_pdf_path = tmp_pdf.name
        
        word_path = tmp_pdf_path.replace(".pdf", ".docx")
        try:
            cv = Converter(tmp_pdf_path)
            cv.convert(word_path, start=0, end=None)
            cv.close()
            return FileResponse(
                word_path, 
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                filename=f"{file.filename.replace('.pdf', '')}.docx"
            )
        finally:
            if os.path.exists(tmp_pdf_path):
                os.remove(tmp_pdf_path)
    except ImportError:
        raise HTTPException(status_code=500, detail="pdf2docx not installed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/img-to-pdf")
async def img_to_pdf(files: list[UploadFile] = File(...)):
    try:
        from PIL import Image
        if not files:
             raise HTTPException(status_code=400, detail="No files uploaded")
             
        images = []
        for file in files:
            content = await file.read()
            img = Image.open(io.BytesIO(content))
            if img.mode == "RGBA":
                img = img.convert("RGB")
            images.append(img)
            
        if not images:
             raise HTTPException(status_code=400, detail="No valid images found")
             
        pdf_bytes = io.BytesIO()
        images[0].save(pdf_bytes, "PDF", resolution=100.0, save_all=True, append_images=images[1:])
        pdf_bytes.seek(0)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
            tmp_pdf.write(pdf_bytes.getvalue())
            tmp_path = tmp_pdf.name
            
        return FileResponse(tmp_path, media_type="application/pdf", filename="merged_images.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/table/analyze")
async def analyze_table(file: UploadFile = File(...)):
    try:
        import pandas as pd
        content = await file.read()
        try:
            if file.filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(content))
            else:
                df = pd.read_excel(io.BytesIO(content))
        except Exception:
             raise HTTPException(status_code=400, detail="Failed to parse file. Please upload a valid CSV or Excel file.")
        
        df = df.where(pd.notnull(df), None)
        columns = df.columns.tolist()
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        preview_data = df.head(100).to_dict(orient="records")
        
        return {
            "filename": file.filename,
            "columns": columns,
            "numeric_columns": numeric_cols,
            "data": preview_data,
            "total_rows": len(df)
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="pandas or openpyxl not installed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
