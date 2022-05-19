import * as React from 'react';
import { IoMdCloseCircle } from 'react-icons/io';

type ModalProps = {
  onClose?: () => void;
} & React.ComponentPropsWithRef<'div'>;

const Modal = React.forwardRef<HTMLInputElement, ModalProps>(
  ({ className, onClose, children, ...rest }) => {
    return (
      <div
        className='fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-25'
        onClick={onClose}
      >
        <div
          className={`relative rounded-lg border border-primary-600 bg-white p-8 shadow-lg ${className}`}
          {...rest}
        >
          {onClose ? (
            <IoMdCloseCircle
              className='absolute right-1 top-1 cursor-pointer text-2xl'
              onClick={onClose}
            />
          ) : (
            <></>
          )}
          {children}
        </div>
      </div>
    );
  }
);

export default Modal;
