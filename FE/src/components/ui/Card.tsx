// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  description?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, description }) => {
  return (
    <div className="border-b border-gray-200 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`p-4 md:p-6 ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-50 border-t border-gray-200 p-4 md:p-6 rounded-b-lg ${className}`}>
      {children}
    </div>
  );
};