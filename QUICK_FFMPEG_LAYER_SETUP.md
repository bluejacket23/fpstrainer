# Quick FFmpeg Layer Setup Guide

## The Problem
The public FFmpeg layer ARN isn't accessible from your AWS account. We'll create our own layer.

## Solution: Create Your Own Layer (10 minutes)

### Step 1: Download FFmpeg Binary

**Easiest Method - Direct Download:**
1. Go to: https://johnvansickle.com/ffmpeg/builds/
2. Download: **ffmpeg-release-amd64-static.tar.xz** (latest version)
3. Extract it (you may need 7-Zip or WinRAR)

**Or use PowerShell:**
```powershell
# Create working directory
mkdir C:\ffmpeg-layer-setup
cd C:\ffmpeg-layer-setup

# Download (update URL with latest version)
Invoke-WebRequest -Uri "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -OutFile "ffmpeg.tar.xz"
```

### Step 2: Extract and Prepare

**After extracting the tar.xz:**
- You'll find a folder like `ffmpeg-6.x.x-amd64-static`
- Inside that folder, there's a `bin` folder with `ffmpeg` and `ffprobe`
- Copy those two files (`ffmpeg` and `ffprobe`) to a new folder

**Create the layer structure:**
```powershell
# Create layer structure
mkdir C:\ffmpeg-layer
mkdir C:\ffmpeg-layer\bin

# Copy ffmpeg and ffprobe from extracted folder to C:\ffmpeg-layer\bin\
# (Do this manually via File Explorer, or use Copy-Item)
```

**Final structure should be:**
```
C:\ffmpeg-layer\
  bin\
    ffmpeg      (the binary file)
    ffprobe     (the binary file)
```

### Step 3: Create ZIP File

**Option A: PowerShell (Windows 10+)**
```powershell
cd C:\ffmpeg-layer
Compress-Archive -Path bin -DestinationPath C:\ffmpeg-layer.zip
```

**Option B: Manual**
1. Navigate to `C:\ffmpeg-layer` in File Explorer
2. Select the `bin` folder
3. Right-click → "Send to" → "Compressed (zipped) folder"
4. Rename the zip to `ffmpeg-layer.zip`
5. Move it to `C:\` (or wherever is convenient)

**Important:** When you extract the ZIP, it should create a `bin` folder with `ffmpeg` and `ffprobe` inside.

### Step 4: Upload to AWS Lambda

**Via AWS Console (Recommended):**

1. **Go to Lambda Layers:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/layers

2. **Click "Create layer"**

3. **Fill in the form:**
   - **Name:** `ffmpeg-custom`
   - **Description:** `FFmpeg for video processing`
   - **Upload a .zip file:** Click "Upload" → Select `C:\ffmpeg-layer.zip`
   - **Compatible runtimes:** Check `Node.js 20.x`
   - **Compatible architectures:** Select `x86_64`

4. **Click "Create"**

5. **Copy the Layer ARN** (looks like: `arn:aws:lambda:us-east-2:954976304902:layer:ffmpeg-custom:1`)

### Step 5: Add Layer to Your Function

1. **Go to your function:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Search for: `frame-extractor`
   - Click: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda`

2. **Scroll to "Layers" section**

3. **Click "Add a layer"**

4. **Select:**
   - **Custom layers** (radio button)
   - **Select a layer:** Choose `ffmpeg-custom`
   - **Version:** Select `1` (or latest)

5. **Click "Add"**

6. **Verify:** The layer should now appear in the Layers section

### Step 6: Verify It Works

Your handler code already checks for `/opt/bin/ffmpeg` automatically (line 60-62 in handler.ts), so it should work immediately!

**Test it:**
1. Upload a video through your frontend
2. Check CloudWatch logs for `frame-extractor-lambda`
3. Look for "Frames extracted" message (means FFmpeg worked!)

---

## Alternative: Use AWS CLI (If You Have It)

If you have AWS CLI configured, you can do Steps 4-5 via command line:

```powershell
# Step 4: Create layer
aws lambda publish-layer-version `
  --layer-name ffmpeg-custom `
  --zip-file fileb://C:\ffmpeg-layer.zip `
  --compatible-runtimes nodejs20.x `
  --compatible-architectures x86_64 `
  --region us-east-2

# This will output a LayerVersionArn - copy it

# Step 5: Add to function
aws lambda update-function-configuration `
  --function-name amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda `
  --layers arn:aws:lambda:us-east-2:954976304902:layer:ffmpeg-custom:1 `
  --region us-east-2
```

---

## Troubleshooting

### "FFmpeg not found" error in logs
- Verify layer is attached (Step 5)
- Check layer structure is correct (`bin/ffmpeg` inside ZIP)
- Verify compatible runtime (Node.js 20.x) and architecture (x86_64)

### ZIP file too large
- FFmpeg binary is ~50-100MB, which is fine
- Lambda layers can be up to 250MB (unzipped)

### Can't extract tar.xz on Windows
- Install 7-Zip: https://www.7-zip.org/
- Or use WSL (Windows Subsystem for Linux) if you have it

### Still having issues?
- Check CloudWatch logs for exact error messages
- Verify the layer ARN is correct
- Make sure you're in the same region (us-east-2)

---

## Success!

Once the layer is added, your video processing pipeline will:
1. ✅ Upload video to S3
2. ✅ Trigger frame-extractor function
3. ✅ Extract frames using FFmpeg (from your layer)
4. ✅ Upload frames to S3
5. ✅ Trigger AI analysis
6. ✅ Generate report

Good luck! 🚀

