import { useRouter } from 'next/router';
import * as React from 'react';

import Error from '@/components/alerts/Error';
import Button from '@/components/buttons/Button';
import Input from '@/components/input/Input';
import Form from '@/components/layout/Form';
import Layout from '@/components/layout/Layout';
import UnderlineLink from '@/components/links/UnderlineLink';
import Seo from '@/components/Seo';

export default function HomePage() {
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const router = useRouter();

  return (
    <Layout>
      <Seo />

      <main>
        <section className='bg-white'>
          <div className='layout flex min-h-screen flex-col items-center justify-center text-center'>
            <h1 className='font-black text-primary-600'>review_irl</h1>

            <Form>
              <div className='flex flex-col items-center'>
                <Error show={error !== ''} error={error} className='mb-4' />
                <Input
                  placeholder='Game Code'
                  type='number'
                  className='rounded-l-lg'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Input
                  placeholder='Your Name'
                  type='text'
                  className='mt-2 rounded-l-lg'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Button
                  className={`mt-2 rounded-r-lg ${submitted ? 'disabled' : ''}`}
                  isLoading={submitted}
                  disabled={submitted}
                  onClick={async () => {
                    setSubmitted(true);
                    const req = await fetch('/api/join', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ game: code, name: name }),
                    });
                    const res = await req.json();
                    if (res.err) {
                      setSubmitted(false);
                      setError(res.msg);
                    } else {
                      window.localStorage.setItem('jwt', res.jwt);
                      router.push('/game');
                    }
                  }}
                >
                  Join
                </Button>
                <UnderlineLink href='/new' className='mt-4 text-sm font-normal'>
                  or Make a Game
                </UnderlineLink>
              </div>
            </Form>

            <footer className='absolute bottom-2 text-gray-700'>
              ?? {new Date().getFullYear()}{' '}
              <UnderlineLink href='https://twitter.com/brett_8975'>
                Brett Meadows
              </UnderlineLink>
            </footer>
          </div>
        </section>
      </main>
    </Layout>
  );
}
