'use client';

import { clsx } from 'clsx/lite';
import AppGrid from '@/components/AppGrid';
import AdminPhotosTable from '@/admin/AdminPhotosTable';
import AdminPhotosTableInfinite from '@/admin/AdminPhotosTableInfinite';
import PathLoaderButton from '@/components/primitives/PathLoaderButton';
import { PATH_ADMIN_PHOTOS_UPDATES } from '@/app/paths';
import { Photo } from '@/photo';
import { StorageListResponse } from '@/platforms/storage';
import AdminUploadsTable from './AdminUploadsTable';
import { Timezone } from '@/utility/timezone';
import { useAppState } from '@/state/AppState';
import PhotoUploadWithStatus from '@/photo/PhotoUploadWithStatus';
import { pluralize } from '@/utility/string';
import IconBroom from '@/components/icons/IconBroom';
import ResponsiveText from '@/components/primitives/ResponsiveText';
import { useAppText } from '@/i18n/state/client';

export default function AdminPhotosClient({
  photos,
  photosCount,
  blobPhotoUrls,
  shouldResize,
  hasAiTextGeneration,
  onLastUpload,
  infiniteScrollInitial,
  infiniteScrollMultiple,
  timezone,
}: {
  photos: Photo[]
  photosCount: number
  blobPhotoUrls: StorageListResponse
  shouldResize: boolean
  hasAiTextGeneration: boolean
  onLastUpload: () => Promise<void>
  infiniteScrollInitial: number
  infiniteScrollMultiple: number
  timezone: Timezone
}) {
  const { uploadState: { isUploading } } = useAppState();

  const appText = useAppText();

  return (
    <AppGrid
      contentMain={
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="grow min-w-0">
              <PhotoUploadWithStatus
                inputId="admin-photos"
                shouldResize={shouldResize}
                onLastUpload={onLastUpload}
              />
            </div>

          </div>
          {blobPhotoUrls.length > 0 &&
            <div className={clsx(
              'border-b pb-6',
              'border-gray-200 dark:border-gray-700',
              'space-y-4',
            )}>
              <div className="font-bold">
                Photo Blobs ({blobPhotoUrls.length})
              </div>
              <AdminUploadsTable urlAddStatuses={blobPhotoUrls} />
            </div>}
          {/* Use custom spacing to address gap/space-y compatibility quirks */}
          <div className="space-y-[6px] sm:space-y-[10px]">
            <AdminPhotosTable
              photos={photos}
              hasAiTextGeneration={hasAiTextGeneration}
              timezone={timezone}
            />
            {photosCount > photos.length &&
              <AdminPhotosTableInfinite
                initialOffset={infiniteScrollInitial}
                itemsPerPage={infiniteScrollMultiple}
                hasAiTextGeneration={hasAiTextGeneration}
                timezone={timezone}
              />}
          </div>
        </div>}
    />
  );
}
