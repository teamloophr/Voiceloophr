# 🔍 PDF Upload Debug Test

## Current Issue
PDF files are not working while Markdown files work fine.

## Debug Steps

### 1. Check Browser Console
- Open browser developer tools (F12)
- Go to Console tab
- Try uploading a PDF file
- Look for any error messages

### 2. Check Network Tab
- Go to Network tab in dev tools
- Upload a PDF file
- Look for the request to `/api/documents/extract`
- Check the response status and body

### 3. Check Server Logs
- Look at the terminal where `npm run dev` is running
- Look for any error messages when PDF is uploaded

### 4. Test with Different PDFs
- Try a simple, small PDF file
- Try a PDF created from Word/Google Docs
- Try a scanned PDF
- Try a PDF with just text (no images)

### 5. Check File Size
- Ensure PDF is under reasonable size limit
- Try with a PDF under 1MB first

## Expected Behavior
- PDF should upload successfully
- Text should be extracted
- You should see the extracted text in the chat
- File should be marked as "📄 PDF" type

## Current Status
- ✅ Markdown files work
- ❌ PDF files fail
- ✅ Audio/Video transcription fixed (API key issue resolved)

## Next Steps
1. Run the debug steps above
2. Report any error messages found
3. Check if it's a specific PDF issue or all PDFs
4. Verify the pdf-parse library is working correctly
