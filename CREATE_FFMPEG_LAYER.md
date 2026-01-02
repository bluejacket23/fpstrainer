# Create Your Own FFmpeg Lambda Layer

Since the public FFmpeg layer ARN isn't accessible, we'll create our own. This takes about 10 minutes.

## Step 1: Download FFmpeg Static Build

**Option A: Download via Browser (Easiest)**
1. Go to: https://johnvansickle.com/ffmpeg/
2. Download the **static build** for **Amazon Linux 2** (x86_64)
3. Look for: `ffmpeg-release-amd64-static.tar.xz` or similar
4. Extract the archive (you'll get `ffmpeg` and `ffprobe` binaries)

**Option B: Download via PowerShell**
```powershell
# Create a temp directory
mkdir ffmpeg-download
cd ffmpeg-download

# Download FFmpeg (this is a direct link - may need to update)
Invoke-WebRequest -Uri "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -OutFile "ffmpeg.tar.xz"

# Extract (you may need 7-Zip or WinRAR)
# Or use WSL if you have it: tar -xf ffmpeg.tar.xz
```

## Step 2: Create Layer Structure

**On Windows, create this structure:**

```powershell
# Create layer directory
mkdir ffmpeg-layer
mkdir ffmpeg-layer\bin

# Copy FFmpeg binaries to bin folder
# After extracting the tar.xz, you'll find ffmpeg and ffprobe in a subfolder
# Copy them to ffmpeg-layer\bin\
```

**The structure should look like:**
```
ffmpeg-layer/
  bin/
    ffmpeg
    ffprobe
```

**Important:** The binaries must be:
- Linux x86_64 compatible (for Lambda)
- Executable (chmod +x equivalent)
- Named exactly `ffmpeg` and `ffprobe`

## Step 3: Package the Layer

**Option A: Using PowerShell (if you have 7-Zip)**
```powershell
cd ffmpeg-layer
# Compress the contents (not the folder itself)
Compress-Archive -Path bin -DestinationPath ..\ffmpeg-layer.zip
```

**Option B: Using WSL (if you have Windows Subsystem for Linux)**
```bash
# In WSL
cd /mnt/c/path/to/ffmpeg-layer
zip -r ../ffmpeg-layer.zip .
```

**Option C: Manual ZIP**
1. Navigate to `ffmpeg-layer` folder
2. Select the `bin` folder
3. Right-click → Send to → Compressed (zipped) folder
4. Rename to `ffmpeg-layer.zip`
5. **Important:** The ZIP should contain `bin/ffmpeg` and `bin/ffprobe` when extracted

## Step 4: Upload Layer to AWS Lambda

**Via AWS Console:**
1. Go to: https://console.aws.amazon.com/lambda/home?region=us-east-2#/layers
2. Click **"Create layer"**
3. Fill in:
   - **Name:** `ffmpeg-custom`
   - **Description:** `FFmpeg binaries for video processing`
   - **Upload a .zip file:** Click "Upload" and select `ffmpeg-layer.zip`
   - **Compatible runtimes:** Select `Node.js 20.x` (or whatever your function uses)
   - **Compatible architectures:** `x86_64`
4. Click **"Create"**
5. **Copy the Layer ARN** that's displayed (you'll need it in Step 5)

**Via AWS CLI (if you have it):**
```powershell
aws lambda publish-layer-version `
  --layer-name ffmpeg-custom `
  --zip-file fileb://ffmpeg-layer.zip `
  --compatible-runtimes nodejs20.x `
  --compatible-architectures x86_64 `
  --region us-east-2
```

This will return a Layer ARN like: `arn:aws:lambda:us-east-2:954976304902:layer:ffmpeg-custom:1`

## Step 5: Add Layer to frame-extractor Function

**Via AWS Console:**
1. Go to: https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
2. Find and click: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda`
3. Scroll to **"Layers"** section
4. Click **"Add a layer"**
5. Choose **"Custom layers"**
6. Select your layer: `ffmpeg-custom`
7. Select the version (usually `1`)
8. Click **"Add"**

**Via AWS CLI:**
```powershell
aws lambda update-function-configuration `
  --function-name amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda `
  --layers arn:aws:lambda:us-east-2:954976304902:layer:ffmpeg-custom:1 `
  --region us-east-2
```

## Step 6: Update Handler Code (if needed)

Check if your handler needs to set the FFmpeg path. Let's verify:
