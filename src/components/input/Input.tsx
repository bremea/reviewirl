import * as React from 'react';

type InputProps = {
  placeholder: string;
} & React.ComponentPropsWithRef<'input'>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, placeholder, ...rest }) => {
    return (
      <input
        placeholder={placeholder}
        className={`w-full rounded-lg border border-primary-600 bg-primary-600 bg-opacity-25 p-2 shadow-lg focus:outline-none focus-visible:ring focus-visible:ring-primary-300 ${className}`}
        {...rest}
      />
    );
  }
);

export default Input;
