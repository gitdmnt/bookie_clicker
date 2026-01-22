import { motion } from "framer-motion";

export const StateDot = ({ isRunning }: { isRunning: boolean }) => (
  <motion.span
    className={`inline-flex items-center gap-2 text-sm font-bold ${
      isRunning ? "text-nb-pink-600" : "text-gray-600"
    }`}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    <motion.span
      className={`w-3 h-3 rounded-full ${
        isRunning ? "bg-nb-pink-500" : "bg-gray-400"
      } inline-block border-2 border-black`}
      animate={isRunning ? { scale: [1, 1.2, 1] } : { scale: 1 }}
      transition={{ repeat: isRunning ? Infinity : 0, duration: 1.5 }}
      aria-hidden="true"
    />
    {isRunning ? "Running" : "Paused"}
  </motion.span>
);
