import * as React from 'react';

type ErrorProps = {
  show: boolean;
  error: string;
} & React.ComponentPropsWithRef<'div'>;

const Error = React.forwardRef<HTMLInputElement, ErrorProps>(
  ({ className, show, error, ...rest }) => {
    return (
      <div
        className={`w-full rounded-lg bg-red-400 p-2 shadow-lg ${
          show ? '' : 'hidden'
        } ${className}`}
        {...rest}
      >
        <div className='flex'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mr-2 h-6 w-6 flex-shrink-0 stroke-current'
            fill='none'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }
);

export default Error;
