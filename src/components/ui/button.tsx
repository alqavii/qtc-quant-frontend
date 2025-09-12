import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost';
};

export function Button({ className = '', variant = 'default', ...props }: ButtonProps) {
  return <button className={className} {...props} />;
}

