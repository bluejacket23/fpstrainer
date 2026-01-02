# How to Add FFmpeg Layer to frame-extractor Function

Since the FFmpeg layer ARN has permission issues during automated deployment, add it manually via AWS Console:

## Steps:

1. **Go to AWS Lambda Console**
   - Navigate to: https://console.aws.amazon.com/lambda/
   - Make sure you're in the **us-east-2** region

2. **Find the frame-extractor function**
   - Search for: `frame-extractor-lambda` or `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda`
   - Click on the function name

3. **Add the Layer**
   - Scroll down to the "Layers" section
   - Click "Add a layer"

4. **Choose Layer Source**
   - Select "Specify an ARN"
   - Try one of these ARNs:
     - `arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4`
     - Or search for "ffmpeg" in "AWS layers" to find a public one

5. **If ARN doesn't work, use AWS Layers**
   - Click "AWS layers" instead
   - Search for "ffmpeg"
   - Select a compatible layer (Node.js 20, x86_64)

6. **Add the Layer**
   - Click "Add" to attach it to the function

7. **Verify**
   - The layer should now appear in the Layers section
   - The function will have access to FFmpeg at `/opt/bin/ffmpeg` or `/opt/ffmpeg/ffmpeg`

## Alternative: Create Your Own Layer

If public layers don't work, you can create your own:

1. Download FFmpeg static build: https://johnvansickle.com/ffmpeg/
2. Create layer structure:
   ```
   layer/
     bin/
       ffmpeg
       ffprobe
   ```
3. Zip it: `zip -r ffmpeg-layer.zip layer/`
4. Upload via AWS CLI:
   ```bash
   aws lambda publish-layer-version \
     --layer-name ffmpeg-custom \
     --zip-file fileb://ffmpeg-layer.zip \
     --compatible-runtimes nodejs20.x \
     --region us-east-2
   ```
5. Use the returned ARN in the function

## Test After Adding

Once the layer is added, test by uploading a video clip. The frame-extractor function should be able to extract frames using FFmpeg.

