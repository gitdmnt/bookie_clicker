import React from "react";
import { motion } from "framer-motion";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pink" | "highlight";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  ...rest
}) => {
  const variants = {
    default: "bg-white border-black shadow-brutal",
    pink: "bg-nb-pink-100 border-nb-pink-600 shadow-brutal-pink",
    highlight: "bg-nb-yellow border-black shadow-brutal-md",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border-3 p-5 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Card;
