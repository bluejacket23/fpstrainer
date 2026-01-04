"use client";

import { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ChevronDown, Gamepad2 } from "lucide-react";

const client = generateClient<Schema>();

// Game options for the selector
const GAME_OPTIONS = [
  { value: 'auto', label: 'Auto-Detect', description: 'AI will identify the game' },
  { value: 'valorant', label: 'Valorant', description: 'Tactical 5v5' },
  { value: 'cs2', label: 'CS2 / CS:GO', description: 'Counter-Strike' },
  { value: 'apex', label: 'Apex Legends', description: 'Battle Royale' },
  { value: 'cod', label: 'Call of Duty', description: 'Warzone / MP' },
  { value: 'overwatch', label: 'Overwatch 2', description: 'Hero Shooter' },
  { value: 'battlefield', label: 'Battlefield', description: 'Large-scale FPS' },
  { value: 'other', label: 'Other FPS', description: 'Generic analysis' },
];

export default function UploadPage() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (authStatus === 'unauthenticated') {
      router.push('/login?redirect=/upload');
    }
  }, [authStatus, router]);

  // Show loading while checking auth
  if (authStatus === 'configuring' || authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neon mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <UploadComponent user={user} />
    </div>
  );
}

function UploadComponent({ user }: any) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedGame, setSelectedGame] = useState('auto');
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (100MB max)
    if (file.size > 100 * 1024 * 1024) { 
      alert("File too large. Maximum file size is 100MB.");
      return;
    }

    // File type validation
    if (!file.type.startsWith('video/')) {
      alert("Invalid file type. Please upload a video file (MP4 format recommended).");
      return;
    }

    // Video length validation - create video element to check duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const checkDuration = (): Promise<number> => {
      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve(video.duration);
        };
        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          reject(new Error('Could not load video metadata'));
        };
        video.src = URL.createObjectURL(file);
      });
    };

    try {
      const duration = await checkDuration();
      
      // Check if video is longer than 60 seconds
      if (duration > 60) {
        alert(`Video is too long. Maximum duration is 60 seconds. Your video is ${Math.round(duration)} seconds.`);
        return;
      }

      // Check if video is too short (less than 5 seconds)
      if (duration < 5) {
        alert("Video is too short. Minimum duration is 5 seconds.");
        return;
      }
    } catch (error) {
      console.error('Error checking video duration:', error);
      // Continue with upload if we can't check duration, but warn user
      if (!confirm("Could not verify video length. Please ensure your video is 60 seconds or less. Continue anyway?")) {
        return;
      }
    }

    setUploading(true);

    try {
      // 1. Init Upload
      const { data: initData, errors } = await client.mutations.initUpload({
        filename: file.name,
        gameType: selectedGame,
      });

      if (errors) {
        console.error("Upload init errors:", errors);
        const errorMessage = errors[0]?.message || JSON.stringify(errors);
        
        // Check if it's a clip limit error
        if (errorMessage.includes('clips remaining') || errorMessage.includes('No clips remaining')) {
          alert('You have no clips remaining for this month. Please upgrade your plan to continue.');
          setUploading(false);
          return;
        }
        
        throw new Error(`Failed to initialize upload: ${errorMessage}`);
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

    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || 'Error uploading file';
      
      // Check if it's a clip limit error
      if (errorMessage.includes('clips remaining') || errorMessage.includes('No clips remaining')) {
        alert('You have no clips remaining for this month. Please upgrade your plan to continue.');
      } else {
        alert(errorMessage);
      }
      
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl bg-surface p-8 rounded-2xl border border-white/10 text-center">
      <h1 className="text-3xl font-bold text-white mb-2">Upload Gameplay</h1>
      <p className="text-gray-400 mb-6">Max 60 seconds. MP4 format.</p>

      {/* Game Selector */}
      <div className="mb-6">
        <label className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-2">
          <Gamepad2 size={16} />
          Select Game (Optional)
        </label>
        <div className="relative">
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            disabled={uploading}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white 
                       appearance-none cursor-pointer hover:border-neon/50 transition-colors
                       focus:outline-none focus:border-neon disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {GAME_OPTIONS.map((game) => (
              <option key={game.value} value={game.value} className="bg-gray-900">
                {game.label} — {game.description}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Helps AI provide game-specific coaching tips
        </p>
      </div>

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
        </div>
      )}
    </div>
  );
}

