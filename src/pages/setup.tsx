import { useRouter } from 'next/router';
import { Map, Marker } from 'pigeon-maps';
import * as React from 'react';
import { FaLocationArrow, FaQuestion } from 'react-icons/fa';

import Button from '@/components/buttons/Button';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/layout/Modal';
import Seo from '@/components/Seo';

export default function NewGamePage() {
  const [lat, setLat] = React.useState(0);
  const [lng, setLng] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [markers, setMarkers] = React.useState<Array<Array<number>>>([]);
  const [_ableToLocate, setAbleToLocate] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [gameLoading, setGameLoading] = React.useState(false);
  const [isSSR, setIsSSR] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showHelp, setShowHelp] = React.useState(false);
  const router = useRouter();

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
                  onClick={() => {
                    const tMark = markers.slice();
                    tMark.splice(tMark.indexOf(latLng), 1);
                    setMarkers(tMark);
                  }}
                />
              );
            })}
          </Map>
          {showHelp ? (
            <Modal className='max-w-lg' onClose={() => setShowHelp(false)}>
              <p className='mb-2 text-lg'>How to Setup a Game</p>
              <p>
                Click anywhere on the map to create a marker. Click a marker to
                delete it. Markers can be captured during the game by answering
                questions while standing nearby them. Use the &quot;Current
                Location&quot; button to show the map nearby your current
                location. Once you&apos;ve placed all your markers, click the
                &quot;Create Game&quot; button.
              </p>
            </Modal>
          ) : (
            <></>
          )}
          {error === '' ? (
            <></>
          ) : (
            <Modal className='max-w-lg' onClose={() => setError('')}>
              <p className='mb-2 text-lg text-red-500'>Error</p>
              <p>{error}</p>
            </Modal>
          )}
          <Button
            className='fixed bottom-0 left-0 m-12 w-auto'
            isLoading={loading}
            disabled={loading}
            onClick={getLocation}
          >
            <FaLocationArrow />
            <p className='ml-2'>Current Location</p>
          </Button>
          <Button
            className='fixed top-0 left-0 m-12 h-11 w-11'
            onClick={() => setShowHelp(true)}
          >
            <FaQuestion />
          </Button>
          <Button
            className='fixed bottom-0 right-0 m-12 w-auto'
            isLoading={gameLoading}
            disabled={gameLoading}
            onClick={async () => {
              setGameLoading(true);
              const req = await fetch('/api/setup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: window.localStorage.getItem('jwt') as string,
                },
                body: JSON.stringify({ markers: markers }),
              });
              const res = await req.json();
              if (res.err) {
                setGameLoading(false);
                setError(res.msg);
              } else {
                router.push('/game');
              }
            }}
          >
            <p>Create Game</p>
          </Button>
        </section>
      </main>
    </Layout>
  );
}
