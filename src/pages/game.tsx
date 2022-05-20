import Image from 'next/image';
import { Map, Marker, Overlay } from 'pigeon-maps';
import * as React from 'react';

import { Markers, quType } from '@/lib/types';

import Error from '@/components/alerts/Error';
import Button from '@/components/buttons/Button';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/layout/Modal';
import Seo from '@/components/Seo';

export default function NewGamePage() {
  const [lat, setLat] = React.useState(0);
  const [lng, setLng] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [name, setName] = React.useState('');
  const [team, setTeam] = React.useState('');
  const [error, setError] = React.useState('');
  const [players, setPlayers] = React.useState<string[]>([]);
  const [code, setCode] = React.useState(-1);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [markers, setMarkers] = React.useState<Markers>([]);
  const [ableToLocate, setAbleToLocate] = React.useState(true);
  const [btnLoading, setBtnLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isSSR, setIsSSR] = React.useState(true);
  const [wsConn, setWSConn] = React.useState(false);
  const [gameActive, setGameActive] = React.useState(false);
  const [question, setQuestion] = React.useState<quType | undefined>(undefined);
  const [markerId, setMarkerId] = React.useState(-1);
  const [questionId, setQuestionId] = React.useState(-1);

  const websocket = React.useMemo(
    () =>
      isSSR
        ? undefined
        : new WebSocket(
            process.env.NEXT_PUBLIC_MODE === 'prod'
              ? 'wss://autouoc.xyz/ws'
              : 'ws://localhost:2000'
          ),
    [isSSR]
  );

  const decodeHtmlCharCodes = (str: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    const v = txt.value;
    txt.remove();
    return v;
  };

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
              setError('');
            }
            break;
          }
          case 'blue': {
            if (msg.upd === name) setTeam('blue');
            break;
          }
          case 'red': {
            if (msg.upd === name) setTeam('red');
            break;
          }
          case 'mblue': {
            const mcopy = markers.slice();
            if (mcopy[parseInt(msg.upd)])
              mcopy[parseInt(msg.upd)].team = 'blue';
            setMarkers(mcopy);
            break;
          }
          case 'mred': {
            const mcopy = markers.slice();
            if (mcopy[parseInt(msg.upd)]) mcopy[parseInt(msg.upd)].team = 'red';
            setMarkers(mcopy);
            break;
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
        setTeam(res.game.team);
        setGameActive(res.game.status === 'started');
        setError('');
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

      <main className='overflow-hidden'>
        <section className='overflow-hidden bg-primary-600'>
          {loading ? (
            <div className='flex h-screen w-screen flex-col items-center justify-center text-white'>
              <p>If prompted, please allow location.</p>
              <p className='text-xs'>Loading...</p>
            </div>
          ) : ableToLocate ? (
            <>
              {question ? (
                <Modal
                  className='flex flex-col items-center justify-center'
                  onClose={() => setQuestion(undefined)}
                >
                  <Error show={error !== ''} error={error} className='mb-4' />
                  <p className='text-2xl font-bold'>
                    {decodeHtmlCharCodes(question.question)}
                  </p>
                  {question.answers.map((answer, i) => {
                    return (
                      <Button
                        key={i}
                        className='mt-4 w-full rounded-lg border border-black border-opacity-25 p-2 text-center'
                        onClick={async () => {
                          const req = await fetch('/api/verify', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: window.localStorage.getItem(
                                'jwt'
                              ) as string,
                            },
                            body: JSON.stringify({
                              question: question.question,
                              answer: answer.label,
                              markerId: markerId,
                              qId: questionId,
                            }),
                          });
                          const res = await req.json();
                          if (res.err) {
                            setError(res.msg);
                          } else {
                            setQuestion(undefined);
                            if (res.cor) {
                              alert('Correct!');
                            } else {
                              alert('Incorrect');
                            }
                          }
                        }}
                      >
                        {answer.label}
                      </Button>
                    );
                  })}
                </Modal>
              ) : (
                <></>
              )}
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
                {markers.map((marker, i) => {
                  return (
                    <Marker
                      key={i}
                      anchor={marker.location}
                      width={50}
                      color={marker.team === 'none' ? 'black' : marker.team}
                      className='z-20'
                      onClick={async () => {
                        const v =
                          10000 *
                          (marker.location[0] -
                            lat +
                            (marker.location[1] - lng));
                        if (v < 100 && v > -100) {
                          const req = await fetch('/api/question', {
                            headers: {
                              Authorization: window.localStorage.getItem(
                                'jwt'
                              ) as string,
                            },
                          });
                          const res = await req.json();
                          setMarkerId(i);
                          setQuestionId(res.id);
                          setQuestion(res.question);
                        } else {
                          alert("You're too far away!");
                        }
                      }}
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
                <div
                  className={`fixed left-0 top-0 z-30 m-12 flex w-auto rounded-lg p-4 py-3 text-white ${
                    team === 'red'
                      ? 'border-red-500 bg-red-500 hover:bg-red-500'
                      : 'border-blue-500 bg-blue-500 hover:bg-blue-500'
                  }`}
                >
                  Team {team.charAt(0).toUpperCase() + team.slice(1)}
                </div>
              ) : (
                <Modal className='max-w-lg text-center'>
                  <Error show={error !== ''} error={error} className='mb-4' />
                  <p className='mb-4 text-xs'>
                    To play, simply walk to a marker on the map and tap on the
                    marker. You&apos;ll be prompted with a question. Answer it
                    correctly to take control of the marker.
                  </p>
                  <p className='text-base font-bold'>Game Code:</p>
                  <p className='mb-4 text-4xl font-bold'>{code}</p>
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
                          setError(res.msg);
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
