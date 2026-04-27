import { motion } from "framer-motion";

interface LandmarkCanvasProps {
  imageUrl: string;
  landmarks: { x: number; y: number }[];
  showLandmarks: boolean;
  imageSize: { width: number; height: number };
}

const LandmarkCanvas = ({ imageUrl, landmarks, showLandmarks, imageSize }: LandmarkCanvasProps) => {
  return (
    <div className="relative rounded-lg overflow-hidden border border-border">
      <img
        src={imageUrl}
        alt="Uploaded face"
        className="w-full h-auto block"
        style={{ maxHeight: "520px", objectFit: "contain" }}
      />
      {showLandmarks && landmarks.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {landmarks.map((point, i) => (
            <motion.circle
              key={i}
              initial={{ opacity: 0, r: 0 }}
              animate={{ opacity: 1, r: Math.max(0.5, imageSize.width * 0.004) }}
              transition={{
                delay: i * 0.002,
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              cx={point.x}
              cy={point.y}
              fill="#22c55e"
              className="drop-shadow-[0_0_3px_rgba(34,197,94,0.6)]"
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export default LandmarkCanvas;
