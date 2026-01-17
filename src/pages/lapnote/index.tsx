import { Timer } from "./Timer";
import { LapnoteForm } from "./LapnoteForm";
import { LapHistory } from "./LapHistory";
import { useLapnoteTimer } from "@/hooks/useLapnoteTimer";
import { SaveForm } from "./SaveForm";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export const Lapnote = ({ book }: { book: Book | null }) => {
  const lapnoteTimer = useLapnoteTimer();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleLapWithClose = () => {
    lapnoteTimer.timerHandlers.handleLap();
    setIsFormOpen(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow/20 p-6">
      {book ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto flex flex-col gap-6"
        >
          <Timer
            states={lapnoteTimer.timerStates}
            laps={lapnoteTimer.lapStates.laps}
            book={book}
            handlers={lapnoteTimer.timerHandlers}
            onOpenForm={() => setIsFormOpen(true)}
            isFormOpen={isFormOpen}
          />
          <AnimatePresence>
            {isFormOpen && (
              <LapnoteForm
                states={lapnoteTimer.lapStates}
                textareaRef={lapnoteTimer.textareaEl}
                handlers={{
                  ...lapnoteTimer.lapHandlers,
                  handleLap: handleLapWithClose,
                }}
                onClose={() => setIsFormOpen(false)}
                book={book}
              />
            )}
          </AnimatePresence>
          <LapHistory states={lapnoteTimer.lapStates} />
          <SaveForm
            states={lapnoteTimer.saveStates}
            handlers={{
              ...lapnoteTimer.saveHandlers,
              handleReset: lapnoteTimer.timerHandlers.handleReset,
            }}
            book={book}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-8 bg-white rounded-lg border-3 border-black shadow-brutal-lg">
            <p className="text-xl font-black text-black">
              📚 本棚から本を選んで
              <br />
              ラップノートを始めましょう！
            </p>
          </div>
        </motion.div>
      )}
    </main>
  );
};
