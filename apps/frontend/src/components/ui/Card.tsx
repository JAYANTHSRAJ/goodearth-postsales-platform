import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
}) => {
  return (
    <div
      className={`rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-800 dark:bg-brand-900 transition-all duration-300 hover:shadow-md ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between border-b border-brand-100 pb-4 mb-4 dark:border-brand-800">
          <div className="text-left">
            {title && (
              <h3 className="font-serif text-lg font-semibold text-brand-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
