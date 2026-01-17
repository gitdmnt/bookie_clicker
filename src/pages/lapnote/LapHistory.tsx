import { formatElapsed } from "./utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const IconChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className="w-5 h-5"
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LapHistory = ({ states }: { states: { laps: Lap[] } }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (states.laps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className=""
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 p-2 rounded-lg hover:bg-nb-pink-50 transition-colors"
      >
        <label className="text-sm font-bold text-black uppercase tracking-wide cursor-pointer">
          📋 履歴
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-nb-pink-600 bg-nb-pink-100 px-3 py-1 rounded-full border-2 border-black">
            {states.laps.length} laps
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <IconChevronDown />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border-3 border-black bg-white shadow-brutal p-5 max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {states.laps.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className="border-l-4 border-nb-pink-500 bg-nb-pink-50 rounded-r-lg p-3 hover:bg-nb-pink-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="text-xs font-black text-nb-pink-700 uppercase tracking-wide">
                        Lap {index + 1}
                      </span>
                      <div className="text-xs font-bold text-gray-600">
                        {formatElapsed(log.elapsedMs)}
                        {log.refPage && (
                          <span className="ml-2 text-nb-pink-600">
                            · p.{log.refPage}
                          </span>
                        )}
                      </div>
                    </div>
                    {log.note && (
                      <p className="text-sm font-medium text-black mt-1">
                        {log.note}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
