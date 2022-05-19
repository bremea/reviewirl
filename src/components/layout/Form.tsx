import * as React from 'react';

const Form = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithRef<'div'>
>(({ className, children, ...rest }) => {
  return (
    <div
      className={`mt-4 w-72 rounded-lg border border-primary-600 p-4 shadow-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Form;
