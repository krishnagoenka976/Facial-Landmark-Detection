import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Cpu, Activity } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DropZone from "@/components/DropZone";
import LandmarkCanvas from "@/components/LandmarkCanvas";
import EmotionSidebar from "@/components/EmotionSidebar";
import MetricsGrid from "@/components/MetricsGrid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Simulated landmark data generator
const generateLandmarks = (w: number, h: number) => {
  const cx = w * 0.5, cy = h * 0.45;
  const points: { x: number; y: number }[] = [];

  // Face outline
  for (let i = 0; i < 17; i++) {
    const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i) / 16;
    points.push({ x: cx + Math.cos(angle) * w * 0.35, y: cy + Math.sin(angle) * h * 0.38 });
  }
  // Left eyebrow
  for (let i = 0; i < 5; i++) {
    points.push({ x: cx - w * 0.2 + i * w * 0.05, y: cy - h * 0.12 - Math.sin(i * 0.8) * h * 0.03 });
  }
  // Right eyebrow
  for (let i = 0; i < 5; i++) {
    points.push({ x: cx + w * 0.05 + i * w * 0.05, y: cy - h * 0.12 - Math.sin(i * 0.8) * h * 0.03 });
  }
  // Left eye
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    points.push({ x: cx - w * 0.1 + Math.cos(angle) * w * 0.04, y: cy - h * 0.05 + Math.sin(angle) * h * 0.02 });
  }
  // Right eye
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    points.push({ x: cx + w * 0.1 + Math.cos(angle) * w * 0.04, y: cy - h * 0.05 + Math.sin(angle) * h * 0.02 });
  }
  // Nose
  for (let i = 0; i < 9; i++) {
    points.push({ x: cx + (i - 4) * w * 0.015, y: cy + h * 0.02 + i * h * 0.015 });
  }
  // Mouth outer
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    points.push({ x: cx + Math.cos(angle) * w * 0.08, y: cy + h * 0.17 + Math.sin(angle) * h * 0.03 });
  }
  // Mouth inner
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    points.push({ x: cx + Math.cos(angle) * w * 0.05, y: cy + h * 0.17 + Math.sin(angle) * h * 0.015 });
  }
  return points;
};

const SAMPLE_EMOTIONS = [
  { label: "Neutral", value: 0.942 },
  { label: "Sad", value: 0.021 },
  { label: "Happy", value: 0.015 },
  { label: "Fear", value: 0.009 },
  { label: "Surprise", value: 0.006 },
  { label: "Angry", value: 0.004 },
  { label: "Disgust", value: 0.003 },
];

const SAMPLE_METRICS = [
  { label: "Accuracy", value: 0.982 },
  { label: "Precision", value: 0.975 },
  { label: "Recall", value: 0.968 },
  { label: "F1-Score", value: 0.971 },
];

const Index = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState({ width: 400, height: 400 });
  const [landmarks, setLandmarks] = useState<{ x: number; y: number }[]>([]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string>("Neutral");
  const [emotions, setEmotions] = useState(SAMPLE_EMOTIONS);
  const [statusText, setStatusText] = useState("System Ready");

  const handleImageUpload = useCallback((file: File, dataUrl: string) => {
    setImageUrl(dataUrl);
    setImageFile(file);
    setHasResults(false);
    setLandmarks([]);
    setStatusText("Image Loaded");

    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = dataUrl;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setStatusText("Processing...");

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("https://krishnagoenka976-facial-emotion-api.hf.space/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Prediction failed");

      const data = await res.json();

      // Extract emotion scores from top-level keys
      const emotionKeys = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"];
      const mapped = emotionKeys
        .filter((key) => typeof data[key] === "number")
        .map((key) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: data[key] as number,
        }));
      mapped.sort((a, b) => b.value - a.value);

      if (mapped.length > 0) {
        setEmotions(mapped);
        setDetectedEmotion(mapped[0].label);
      } else {
        setDetectedEmotion(data.emotion || data.label || "Unknown");
      }

      // Use backend landmarks if available, otherwise generate simulated ones
      if (data.landmarks && Array.isArray(data.landmarks)) {
        const mapped = data.landmarks.map((pt: number[] | { x: number; y: number }) =>
          Array.isArray(pt) ? { x: pt[0], y: pt[1] } : pt
        );
        setLandmarks(mapped);
      } else {
        setLandmarks(generateLandmarks(imageSize.width, imageSize.height));
      }
      setHasResults(true);
      setStatusText("Analysis Complete");
    } catch (err) {
      console.error(err);
      setStatusText("Error – check backend");
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, imageSize]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Inference Engine v2.4</h1>
            <p className="text-[11px] text-muted-foreground font-mono">Facial Landmark & Emotion Detection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="label-technical">{statusText}</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-6 max-w-[1400px] mx-auto">
        {/* Main Stage */}
        <div className="space-y-4">
          {!imageUrl ? (
            <DropZone onImageUpload={handleImageUpload} />
          ) : (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setImageUrl(null);
                    setImageFile(null);
                    setHasResults(false);
                    setLandmarks([]);
                    setStatusText("System Ready");
                  }}
                  className="label-technical hover:text-foreground transition-colors cursor-pointer press-effect"
                >
                  ← New Image
                </button>
                {!hasResults && !isProcessing && (
                  <Button
                    onClick={handleAnalyze}
                    size="sm"
                    className="press-effect gap-1.5 text-xs h-8"
                  >
                    <Cpu className="h-3.5 w-3.5" /> Analyze
                  </Button>
                )}
                {hasResults && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="landmark-toggle"
                      checked={showLandmarks}
                      onCheckedChange={setShowLandmarks}
                    />
                    <Label htmlFor="landmark-toggle" className="text-xs text-muted-foreground cursor-pointer">
                      Show Landmarks
                    </Label>
                  </div>
                )}
              </div>

              {/* Processing indicator */}
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={65} className="h-1" />
                  <p className="label-technical">Processing inference...</p>
                </div>
              )}

              {/* Canvas */}
              <AnimatePresence mode="wait">
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <LandmarkCanvas
                    imageUrl={imageUrl}
                    landmarks={landmarks}
                    showLandmarks={showLandmarks}
                    imageSize={imageSize}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Landmark count */}
              {hasResults && (
                <div className="flex gap-4">
                  <span className="label-technical">
                    Landmarks: <span className="text-foreground font-semibold">{landmarks.length}</span>
                  </span>
                  <span className="label-technical">
                    Resolution: <span className="text-foreground font-semibold">{imageSize.width}×{imageSize.height}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {isProcessing ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-2 w-20" />
                  <Skeleton className="h-1 w-full" />
                </div>
              ))}
            </div>
          ) : hasResults ? (
            <>
              <EmotionSidebar
                emotions={emotions}
                detectedLabel={detectedEmotion}
              />
              <MetricsGrid metrics={SAMPLE_METRICS} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-5 flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="label-technical">No results</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload an image to begin analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
