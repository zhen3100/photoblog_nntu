'use client';

import { clsx } from 'clsx/lite';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppGrid from '../components/AppGrid';
import AppViewSwitcher, { SwitcherSelection } from '@/app/AppViewSwitcher';
import {
  PATH_ROOT,
  isPathAdmin,
  isPathFeed,
  isPathGrid,
  isPathProtected,
  isPathSignIn,
} from '@/app/paths';
import AnimateItems from '../components/AnimateItems';
import {
  GRID_HOMEPAGE_ENABLED,
  NAV_CAPTION,
} from './config';
import { useRef } from 'react';
import useStickyNav from './useStickyNav';

const NAV_HEIGHT_CLASS = NAV_CAPTION
  ? 'min-h-[4rem] sm:min-h-[5rem]'
  : 'min-h-[4rem]';

export default function Nav({
  navTitleOrDomain,
}: {
  navTitleOrDomain: string;
}) {
  const ref = useRef<HTMLElement>(null);

  const pathname = usePathname();
  const showNav = !isPathSignIn(pathname);

  const {
    classNameStickyContainer,
    classNameStickyNav,
  } = useStickyNav(ref);

  const renderLink = (
    text: string,
    linkOrAction: string | (() => void),
  ) =>
    typeof linkOrAction === 'string'
      ? <Link href={linkOrAction}>{text}</Link>
      : <button onClick={linkOrAction}>{text}</button>;

  const switcherSelectionForPath = (): SwitcherSelection | undefined => {
    if (pathname === PATH_ROOT) {
      return GRID_HOMEPAGE_ENABLED ? 'grid' : 'feed';
    } else if (isPathGrid(pathname)) {
      return 'grid';
    } else if (isPathFeed(pathname)) {
      return 'feed';
    } else if (isPathProtected(pathname)) {
      return 'admin';
    }
  };

  return (
    <AppGrid
      className={classNameStickyContainer}
      classNameMain='pointer-events-auto'
      contentMain={
        <AnimateItems
          animateOnFirstLoadOnly
          type={!isPathAdmin(pathname) ? 'bottom' : 'none'}
          distanceOffset={10}
          items={showNav
            ? [<nav
              key="nav"
              ref={ref}
              className={clsx(
                'w-full flex items-center bg-main',
                NAV_HEIGHT_CLASS,
                // Enlarge nav to ensure it fully masks underlying content
                'md:w-[calc(100%+8px)] md:translate-x-[-4px] md:px-[4px]',
                classNameStickyNav,
              )}>
              <AppViewSwitcher
                currentSelection={switcherSelectionForPath()}
              />
              <div className={clsx(
                'grow text-right min-w-0',
                'hidden xs:block',
                'translate-y-[-1px]',
              )}>
<div className="flex items-center justify-between relative w-full py-2 px-4">
  {/* Центральный текст - абсолютное позиционирование */}
  <div className="absolute left-1/2 transform -translate-x-[60%] w-full max-w-[80%] px-4 text-center">
    <a 
      href='/about' 
      className="font-semibold text-xs xs:text-sm sm:text-base text-text-blue hover:text-gray-700 dark:text-white whitespace-nowrap truncate inline-block w-full"
    >
      Фотоархив Леонарда Тимофеевича Крюкова
    </a>
  </div>

  {/* Картинка - теперь справа с отступом */}
  <div className="ml-auto z-10 flex-shrink-0">
    <img 
      src="/favicons/zhdan.png"  
      alt="Логотип Ждановец" 
      className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full block dark:hidden" 
    />
    <img 
      src="/favicons/zhdan.svg"  
      alt="Логотип Ждановец" 
      className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full hidden dark:block" 
    />
  </div>
</div>
                  <div className={clsx(
                    'hidden sm:block truncate overflow-hidden',
                    'leading-tight text-dim',
                  )}>
          
                  </div>
              </div>
            </nav>]
            : []}
        />
      }
      sideHiddenOnMobile
    />
  );
};
