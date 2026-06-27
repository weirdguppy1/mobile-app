import { useEffect, useRef, useState } from 'react';

import { createPhotoSignedUrl } from '@/features/profile/api';
import { SignedProfilePhoto } from '@/features/profile/types';

/** Resolve a photo's display URI with self-healing. Photos normally arrive pre-signed
 *  (batch fetch), but signed URLs are short-lived, so this re-signs from the storage
 *  path when the URL is missing or the image fails to load (e.g. it expired during a
 *  long session). Capped at a few attempts so it can't loop. Returns the current uri
 *  (or null while unavailable) and an onError handler to wire to the <Image>. */
export function useSignedPhotoUri(photo: SignedProfilePhoto): [string | null, () => void] {
  const [uri, setUri] = useState<string | null>(photo.signedUrl);
  const attempts = useRef(0);

  useEffect(() => {
    setUri(photo.signedUrl);
    attempts.current = 0;
    if (!photo.signedUrl && photo.url) {
      attempts.current += 1;
      createPhotoSignedUrl(photo.url).then(setUri).catch(() => {});
    }
  }, [photo.id, photo.signedUrl, photo.url]);

  const onError = () => {
    if (attempts.current >= 3 || !photo.url) return;
    attempts.current += 1;
    createPhotoSignedUrl(photo.url).then(setUri).catch(() => {});
  };

  return [uri, onError];
}
