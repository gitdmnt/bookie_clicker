import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  className = "",
  ...rest
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-bold text-black uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`rounded-lg border-3 border-black px-4 py-2.5 font-medium bg-white focus:outline-none focus:ring-4 focus:ring-nb-pink-300 transition-all shadow-brutal-sm ${className}`}
        {...rest}
      />
    </div>
  );
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = "", ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-bold text-black uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`rounded-lg border-3 border-black px-4 py-2.5 font-medium bg-white focus:outline-none focus:ring-4 focus:ring-nb-pink-300 transition-all shadow-brutal-sm resize-none ${className}`}
          {...rest}
        />
      </div>
    );
  }
);
