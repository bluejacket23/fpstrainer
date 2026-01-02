# Wait for Frame Extraction

Frame extraction is running! It takes time for large videos.

## Timeline

For a **99.6 MB video** (~60 seconds):
- **Video download:** ✅ Done (~2 seconds)
- **Frame extraction:** ⏳ In progress (1-2 minutes)
  - FFmpeg needs to process the entire video
  - Extract 1 frame per second = ~60 frames
  - Each frame needs to be processed
- **Frame upload:** ⏳ After extraction (30-60 seconds)
  - Upload 60 JPG files to S3
- **AI analysis:** ⏳ After frames uploaded (30-60 seconds)
  - Download frames
  - Call OpenAI API
  - Generate report
- **Total:** ~3-4 minutes

## What to Watch For

### In CloudWatch Logs (frame-extractor)

**Refresh the logs every 30 seconds. Look for:**

1. ✅ "Video downloaded" (you saw this)
2. ⏳ "Frames extracted" (should appear in 1-2 minutes)
3. ⏳ "Uploaded X frames" (after extraction)
4. ⏳ "Invoked AI Analysis" (after frames uploaded)

**If you see an error:**
- Check what the error says
- Common: FFmpeg timeout, memory issues, etc.

### In S3

**Check the frames folder:**
- https://console.aws.amazon.com/s3/buckets/amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom?region=us-east-2&prefix=frames/
- Navigate to: `frames/311b85e0-40c1-7092-5f38-01eb6ad4ebed/7de45394-5b89-4ac5-bec9-155a698057bf/`
- **JPG files should start appearing** as frames are extracted

### In DynamoDB

**Check the report status:**
- Should change from `UPLOADING` → `PROCESSING` → `COMPLETED`
- This happens as each step completes

## If It's Taking Too Long

**After 3-4 minutes, if still spinning:**

1. **Check CloudWatch logs** - Is there an error?
2. **Check function timeout** - Is it set to at least 300 seconds (5 minutes)?
3. **Check function memory** - Is it set to at least 2048 MB?
4. **Check S3 frames folder** - Are frames being created?

## Success Indicators

You'll know it's working when:
- ✅ CloudWatch shows "Frames extracted"
- ✅ Frames appear in S3 `frames/` folder
- ✅ CloudWatch shows "Invoked AI Analysis"
- ✅ DynamoDB status changes to `COMPLETED`
- ✅ Frontend shows the report!

**Be patient - it's processing!** ⏳

