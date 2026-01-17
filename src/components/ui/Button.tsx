import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "variant"> {
  variant?: Variant;
  size?: "sm" | "md";
}

const base =
  "inline-flex items-center justify-center rounded-lg font-bold border-3 border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none overflow-visible";

const variants: Record<Variant, string> = {
  primary:
    "bg-nb-pink-500 text-white hover:bg-nb-pink-600 shadow-brutal active:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px]",
  secondary:
    "bg-nb-blue text-black hover:bg-nb-blue/80 shadow-brutal active:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px]",
  danger:
    "bg-nb-orange text-white hover:bg-nb-orange/80 shadow-brutal active:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px]",
  ghost:
    "bg-white text-black hover:bg-gray-100 shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px]",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}) => {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  return (
    <motion.button
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

export default Button;
