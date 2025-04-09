import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      expand
      position="top-center"
      closeButton
      richColors={false}
      toastOptions={{
        style: {
          background: 'none',
          border: 'none',
          fontSize: '1.1rem',
          padding: '16px 24px',
        },
        classNames: {
          toast: [
            'group',
            'rounded-xl',
            'shadow-lg',
            'bg-gradient-to-r',
            'text-white',
          ].join(' '),
          title: 'text-white font-medium text-base',
          description: 'text-white font-normal',
          actionButton: 'bg-white text-black',
          cancelButton: 'bg-white/25 text-white',
          closeButton: 'text-white/50 hover:text-white',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
