import { clsx } from 'clsx/lite';
import { SHOULD_PREFETCH_ALL_LINKS } from '@/app/config';
import { ComponentProps, ReactNode, RefObject } from 'react';
import Spinner from './Spinner';
import LinkWithIconLoader from './LinkWithIconLoader';
import Tooltip from './Tooltip';

const WIDTH_CLASS = 'w-[42px]';

export default function SwitcherItem({
  icon,
  title,
  href,
  hrefRef,
  className: classNameProp,
  onClick,
  active,
  isInteractive = true,
  noPadding,
  prefetch = SHOULD_PREFETCH_ALL_LINKS,
  tooltip,
}: {
  icon: ReactNode
  title?: string
  href?: string
  hrefRef?: RefObject<HTMLAnchorElement | null>
  className?: string
  onClick?: () => void
  active?: boolean
  isInteractive?: boolean
  noPadding?: boolean
  prefetch?: boolean
  tooltip?: ComponentProps<typeof Tooltip>
}) {
  const className = clsx(
    'flex items-center justify-center',
    `${WIDTH_CLASS} h-[28px]`,
    isInteractive && 'cursor-pointer',
    isInteractive && 'hover:bg-nntu-blue/30 active:bg-nntu-blue/30 ',
    isInteractive && 'dark:hover:bg-gray-900/75 dark:active:bg-gray-900',
    active
      ? 'text-text-blue bg-nntu-blue/30'
      : 'text-gray-400 dark:text-gray-600',
    active
      ? 'hover:nntu-blue dark:hover:text-white'
      : 'hover:text-text-blue dark:hover:text-gray-400',
    classNameProp,
  );

  const renderIcon = () => noPadding
    ? icon
    : <div className={clsx(
      'w-[28px] h-[24px]',
      'flex items-center justify-center',
    )}>
      {icon}
    </div>;

  const content = href
    ? <LinkWithIconLoader {...{
      href,
      ref: hrefRef,
      title,
      className,
      prefetch,
      icon: renderIcon(),
      loader: <Spinner />,
    }} />
    : <div {...{ title, onClick, className }}>
      {renderIcon()}
    </div>;

  return (
    tooltip
      ? <Tooltip
        {...tooltip}
        classNameTrigger={WIDTH_CLASS}
        delayDuration={500}
      >
        {content}
      </Tooltip>
      : content
  );
};
