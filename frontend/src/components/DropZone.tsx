import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onImageUpload: (file: File, dataUrl: string) => void;
}

const DropZone = ({ onImageUpload }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        flex flex-col items-center justify-center gap-4
        min-h-[320px] rounded-xl border border-dashed cursor-pointer
        transition-colors duration-200
        ${isDragging
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-surface-nested/20 hover:border-muted-foreground/30"
        }
      `}
      whileTap={{ scale: 0.99 }}
    >
      <div className="rounded-full border border-border p-4">
        <Upload className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drop image or click to upload
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Waiting for input
        </p>
      </div>
    </motion.div>
  );
};

export default DropZone;
