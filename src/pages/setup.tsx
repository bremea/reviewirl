import { Map, Marker } from 'pigeon-maps';
import * as React from 'react';
import { FaLocationArrow, FaQuestion } from 'react-icons/fa';

import Button from '@/components/buttons/Button';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';

export default function NewGamePage() {
  const [lat, setLat] = React.useState(0);
  const [lng, setLng] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [markers, setMarkers] = React.useState<Array<Array<number>>>([]);
  const [_ableToLocate, setAbleToLocate] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [isSSR, setIsSSR] = React.useState(true);

  React.useEffect(() => {
    setIsSSR(false);
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAbleToLocate(true);
          setLoading(false);
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setZoom(18);
        },
        () => {
          setLoading(false);
          setAbleToLocate(false);
        }
      );
    }
  };

  return (
    <Layout>
      <Seo />

      <main>
        <section className='bg-white'>
          <Map
            height={isSSR ? 0 : window.innerHeight}
            center={[lat, lng]}
            zoom={zoom}
            onBoundsChanged={({ center, zoom }) => {
              setLat(center[0]);
              setLng(center[1]);
              setZoom(zoom);
            }}
            onClick={({ latLng }) => {
              const tMark = markers.slice();
              tMark.push(latLng);
              setMarkers(tMark);
            }}
          >
            {markers.map((latLng, i) => {
              return (
                <Marker
                  key={i}
                  anchor={latLng as [number, number]}
                  width={50}
                />
              );
            })}
          </Map>
          <Button
            className='fixed bottom-0 left-0 m-12 w-auto'
            isLoading={loading}
            disabled={loading}
            onClick={getLocation}
          >
            <FaLocationArrow />
            <p className='ml-2'>Current Location</p>
          </Button>
          <Button className='fixed top-0 left-0 m-12 h-11 w-11'>
            <FaQuestion />
          </Button>
          <Button className='fixed bottom-0 right-0 m-12 w-auto'>
            <p>Create Game</p>
          </Button>
        </section>
      </main>
    </Layout>
  );
}
