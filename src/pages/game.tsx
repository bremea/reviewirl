import { Map, Marker } from 'pigeon-maps';
import * as React from 'react';

import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';

export default function NewGamePage() {
  const [lat, setLat] = React.useState(0);
  const [lng, setLng] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [markers, setMarkers] = React.useState<Array<Array<number>>>([]);
  const [_ableToLocate, setAbleToLocate] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
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

  React.useEffect(getLocation, []);

  return (
    <Layout>
      <Seo />

      <main>
        <section className='bg-primary'>
          {loading ? (
            <></>
          ) : (
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
          )}
        </section>
      </main>
    </Layout>
  );
}
