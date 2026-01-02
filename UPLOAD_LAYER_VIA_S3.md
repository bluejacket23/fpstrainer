# Upload FFmpeg Layer via S3 (For Files > 50 MB)

Since your ZIP is 56 MB (over the 50 MB direct upload limit), we need to upload it to S3 first, then create the layer from S3.

## Step 1: Upload ZIP to S3

### Option A: AWS Console (Easiest)

1. **Go to S3 Console:**
   - https://console.aws.amazon.com/s3/home?region=us-east-2

2. **Find your storage bucket:**
   - Look for: `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - Or any bucket you have access to (you can create a temp one)

3. **Upload the ZIP:**
   - Click on the bucket
   - Click "Upload"
   - Click "Add files"
   - Navigate to: `C:\Windows\system32\ffmpeg-layer.zip`
   - Click "Upload"
   - Wait for upload to complete

4. **Copy the S3 URI:**
   - After upload, click on the file
   - Copy the "URI" (looks like: `s3://bucket-name/ffmpeg-layer.zip`)

### Option B: AWS CLI (Faster if you have it)

```powershell
aws s3 cp C:\Windows\system32\ffmpeg-layer.zip s3://amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom/ffmpeg-layer.zip --region us-east-2
```

## Step 2: Create Layer from S3

1. **Go to Lambda Layers:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/layers

2. **Click "Create layer"**

3. **Fill in the form:**
   - **Name:** `ffmpeg-custom`
   - **Description:** `FFmpeg binaries for video processing`
   - **Upload method:** Select **"Upload a file from Amazon S3"** (NOT "Upload a .zip file")
   - **S3 link URL:** Paste the S3 URI you copied (e.g., `s3://bucket-name/ffmpeg-layer.zip`)
   - **Compatible runtimes:** Check `Node.js 20.x`
   - **Compatible architectures:** Select `x86_64`

4. **Click "Create"**

5. **Wait for creation** (may take 1-2 minutes)

6. **Copy the Layer ARN** that appears

## Step 3: Add Layer to frame-extractor Function

1. **Go to your function:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Search for: `frame-extractor`
   - Click: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda`

2. **Scroll to "Layers" section**

3. **Click "Add a layer"**

4. **Select:**
   - **Custom layers** (radio button)
   - **Select a layer:** Choose `ffmpeg-custom`
   - **Version:** Select `1` (or the version number shown)

5. **Click "Add"**

6. **Verify:** You should see `ffmpeg-custom` listed in the Layers section

## Step 4: Clean Up (Optional)

After the layer is created, you can delete the ZIP from S3 if you want (the layer is already created, so you don't need the S3 file anymore).

---

**Quick Summary:**
1. Upload `C:\Windows\system32\ffmpeg-layer.zip` to S3
2. Create layer from S3 (select "Upload a file from Amazon S3")
3. Add layer to frame-extractor function
4. Done! ✅

