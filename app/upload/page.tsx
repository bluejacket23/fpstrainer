"use client";

import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";

const client = generateClient<Schema>();

export default function UploadPage() {
  return (
    <Authenticator>
      {({ user }) => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <UploadComponent user={user} />
        </div>
      )}
    </Authenticator>
  );
}

function UploadComponent({ user }: any) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) { 
      alert("File too large. Max 100MB.");
      return;
    }

    setUploading(true);

    try {
      // 1. Init Upload
      const { data: initData, errors } = await client.mutations.initUpload({
        filename: file.name
      });

      if (errors) {
        console.error("Upload init errors:", errors);
        throw new Error(`Failed to initialize upload: ${JSON.stringify(errors)}`);
      }

      if (!initData) {
        throw new Error("Failed to initialize upload: No data returned");
      }

      // Handle potential stringified JSON return
      const result = typeof initData === 'string' ? JSON.parse(initData) : initData;
      const { uploadUrl, reportId } = result;

      // 2. Upload to S3
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          router.push(`/report/${reportId}`);
        } else {
          alert("Upload failed");
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        alert("Upload failed");
        setUploading(false);
      };

      xhr.send(file);

    } catch (error) {
      console.error(error);
      alert("Error uploading file");
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl bg-surface p-8 rounded-2xl border border-white/10 text-center">
      <h1 className="text-3xl font-bold text-white mb-2">Upload Gameplay</h1>
      <p className="text-gray-400 mb-8">Max 60 seconds. MP4 format.</p>

      {!uploading ? (
        <div className="border-2 border-dashed border-white/20 rounded-xl p-12 hover:border-neon/50 transition-colors relative">
          <input 
            type="file" 
            accept="video/mp4" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="mx-auto text-neon mb-4" size={48} />
          <p className="text-white font-bold">Click or Drag to Upload</p>
        </div>
      ) : (
        <div className="py-12">
          <Loader2 className="mx-auto text-neon animate-spin mb-4" size={48} />
          <p className="text-white font-bold mb-2">Uploading... {Math.round(progress)}%</p>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-neon h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-4">Processing will start automatically.</p>
        </div>
      )}
    </div>
  );
}

