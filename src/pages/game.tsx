import Image from 'next/image';
import { Map, Marker, Overlay } from 'pigeon-maps';
import * as React from 'react';

import Button from '@/components/buttons/Button';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/layout/Modal';
import Seo from '@/components/Seo';

export default function NewGamePage() {
  const [lat, setLat] = React.useState(0);
  const [lng, setLng] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [name, setName] = React.useState('');
  const [players, setPlayers] = React.useState<string[]>([]);
  const [code, setCode] = React.useState(-1);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [markers, setMarkers] = React.useState<Array<Array<number>>>([]);
  const [ableToLocate, setAbleToLocate] = React.useState(true);
  const [btnLoading, setBtnLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isSSR, setIsSSR] = React.useState(true);
  const [wsConn, setWSConn] = React.useState(false);
  const [gameActive, setGameActive] = React.useState(false);

  const websocket = React.useMemo(
    () => (isSSR ? undefined : new WebSocket('ws://autouoc.xyz/ws')),
    [isSSR]
  );

  if (websocket)
    websocket.onmessage = (m: MessageEvent<string>) => {
      const msg: { upd?: string; typ?: string; err: boolean; msg: string } =
        JSON.parse(m.data);
      if (msg.upd && msg.typ) {
        switch (msg.typ) {
          case 'player': {
            const pcopy = players.slice();
            pcopy.push(msg.upd);
            setPlayers(pcopy);
            break;
          }
          case 'status': {
            if (msg.upd === 'start') {
              setGameActive(true);
            }
          }
        }
      } else if (!msg.err) {
        setWSConn(true);
      }
    };

  React.useEffect(() => {
    setIsSSR(false);
  }, []);

  React.useEffect(() => {
    const loadGame = async () => {
      const req = await fetch('/api/game', {
        headers: {
          Authorization: window.localStorage.getItem('jwt') as string,
        },
      });
      const res = await req.json();
      if (!res.err) {
        setName(res.game.name);
        setCode(res.game.code);
        setMarkers(res.game.markers);
        setPlayers(res.game.players);
        setGameActive(res.game.status === 'started');
        setIsAdmin(res.game.admin === res.game.name);
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
          navigator.geolocation.watchPosition((position) => {
            setLat(position.coords.latitude);
            setLng(position.coords.longitude);
          });
        } else {
          setLoading(false);
          setAbleToLocate(false);
        }
      }
    };
    if (code === -1) {
      loadGame();
    } else {
      if (wsConn && websocket) {
        if (websocket.readyState === 1) {
          websocket.send(JSON.stringify({ game: code }));
        } else {
          websocket.onopen = () =>
            websocket.send(JSON.stringify({ game: code }));
        }
      }
    }
  }, [code, websocket, wsConn]);

  return (
    <Layout>
      <Seo />

      <main>
        <section className='bg-primary-600'>
          {loading ? (
            <div className='flex h-screen w-screen flex-col items-center justify-center text-white'>
              <p>If prompted, please allow location.</p>
              <p className='text-xs'>Loading...</p>
            </div>
          ) : ableToLocate ? (
            <>
              <Map
                height={isSSR ? 0 : window.innerHeight}
                center={[lat, lng]}
                mouseEvents={false}
                touchEvents={false}
                zoom={zoom}
                onBoundsChanged={({ center, zoom }) => {
                  setLat(center[0]);
                  setLng(center[1]);
                  setZoom(zoom);
                }}
              >
                {markers.map((latLng, i) => {
                  return (
                    <Marker
                      key={i}
                      anchor={latLng as [number, number]}
                      width={50}
                      className='z-20'
                    />
                  );
                })}
                <Overlay anchor={[lat, lng]} offset={[25, 25]}>
                  <Image
                    src='/me.png'
                    width={50}
                    height={50}
                    alt='Your Location'
                  />
                </Overlay>
              </Map>
              {gameActive ? (
                <></>
              ) : (
                <Modal className='max-w-lg text-center'>
                  <p className='mb-2 text-4xl font-bold'>{code}</p>
                  <div className='flex flex-wrap justify-center'>
                    {players.map((player, i) => {
                      return (
                        <p
                          key={i}
                          className={`m-1 rounded-full shadow-lg ${
                            player === name
                              ? 'bg-primary-600 text-white'
                              : 'bg-black bg-opacity-25'
                          } p-1 px-2`}
                        >
                          {player}
                        </p>
                      );
                    })}
                  </div>
                  {isAdmin ? (
                    <Button
                      className='mt-4'
                      onClick={async () => {
                        setBtnLoading(true);
                        const req = await fetch('/api/start', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: window.localStorage.getItem(
                              'jwt'
                            ) as string,
                          },
                        });
                        const res = await req.json();
                        if (res.err) {
                          setBtnLoading(false);
                        }
                      }}
                      isLoading={btnLoading}
                      disabled={btnLoading}
                    >
                      Start Game
                    </Button>
                  ) : (
                    <p className='mt-4 text-xs'>Waiting for game start...</p>
                  )}
                </Modal>
              )}
            </>
          ) : (
            <div className='flex h-screen w-screen flex-col items-center justify-center text-white'>
              <p>We can&apos;t locate you. Please allow location.</p>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}
