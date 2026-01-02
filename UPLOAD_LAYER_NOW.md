# Upload Your FFmpeg Layer - Next Steps

Your ZIP file is ready at: `C:\Windows\system32\ffmpeg-layer.zip`

## Step 1: Upload to AWS Lambda Layers

1. **Go to Lambda Layers Console:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/layers

2. **Click "Create layer"**

3. **Fill in the form:**
   - **Name:** `ffmpeg-custom`
   - **Description:** `FFmpeg binaries for video processing`
   - **Upload a .zip file:** 
     - Click "Upload"
     - Navigate to: `C:\Windows\system32\`
     - Select: `ffmpeg-layer.zip`
   - **Compatible runtimes:** Check `Node.js 20.x`
   - **Compatible architectures:** Select `x86_64`

4. **Click "Create"**

5. **Wait for upload** (may take 1-2 minutes for ~56 MB)

6. **Copy the Layer ARN** that appears (looks like: `arn:aws:lambda:us-east-2:954976304902:layer:ffmpeg-custom:1`)

## Step 2: Add Layer to frame-extractor Function

1. **Go to your function:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Search for: `frame-extractor`
   - Click: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda`

2. **Scroll down to "Layers" section**

3. **Click "Add a layer"**

4. **Select:**
   - **Custom layers** (radio button)
   - **Select a layer:** Choose `ffmpeg-custom`
   - **Version:** Select `1` (or the version number shown)

5. **Click "Add"**

6. **Verify:** You should see `ffmpeg-custom` listed in the Layers section

## Step 3: Verify It Works

After adding the layer, test by uploading a video. The handler code will automatically find FFmpeg at `/opt/bin/ffmpeg`.

Check CloudWatch logs for "Frames extracted" message to confirm it's working!

---

**Your ZIP file location:** `C:\Windows\system32\ffmpeg-layer.zip` ✅

