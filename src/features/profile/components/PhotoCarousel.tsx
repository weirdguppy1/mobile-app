import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { useSignedPhotoUri } from '@/features/profile/hooks/use-signed-photo-uri';
import { SignedProfilePhoto } from '@/features/profile/types';

/** Full-bleed, horizontally-paged carousel of all of a user's photos with page dots.
 *  Each page is one screen wide at a 4:5 aspect ratio. Self-healing signed URLs. Render
 *  edge-to-edge (no horizontal padding from the parent) so paging math stays exact. */
export function PhotoCarousel({ photos }: { photos: SignedProfilePhoto[] }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  if (photos.length === 0) return null;

  return (
    <View className="gap-3">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {photos.map((photo) => (
          <CarouselPhoto key={photo.id} photo={photo} width={width} />
        ))}
      </ScrollView>
      {photos.length > 1 ? (
        <View className="flex-row justify-center gap-1.5">
          {photos.map((photo, i) => (
            <View
              key={photo.id}
              className={`h-1.5 rounded-full ${i === index ? 'w-5 bg-ink' : 'w-1.5 bg-silver'}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CarouselPhoto({ photo, width }: { photo: SignedProfilePhoto; width: number }) {
  const [uri, onError] = useSignedPhotoUri(photo);

  return (
    <View style={{ width, aspectRatio: 4 / 5 }} className="bg-wash">
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" onError={onError} />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Text className="prose-caption text-graphite">Unavailable</Text>
        </View>
      )}
    </View>
  );
}
