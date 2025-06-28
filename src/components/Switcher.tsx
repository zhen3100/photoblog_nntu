import { ReactNode } from 'react';
import { clsx } from 'clsx/lite';

export default function Switcher({
  children,
  type = 'regular',
}: {
  children: ReactNode
  type?: 'regular' | 'borderless'
}) {
  return (
    <div className={clsx(
      'flex divide-x overflow-hidden',
       'divide-gray-300 dark:divide-gray-600',
      'rounded-md',
      type === 'regular'
        ? 'border border-gray-300 dark:border-gray-600'
        : 'border-transparent',
      type === 'regular' && 'shadow-xs',
    )}>
      {children}
    </div>
  );
};
