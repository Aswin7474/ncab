import { motion } from "framer-motion";

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <motion.div
        className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <p className="text-gray-700 text-lg font-medium">Processing your request...</p>
    </div>
  );
}
