import cn from 'classnames';
import { twMerge } from 'tailwind-merge';

type Props = {
  className?: string;
  [key: string]: unknown;
};
const Card: React.FC<Props> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        cn(
          // Nouveau visuel E.doto : carte ivoire aux coins arrondis, ombre douce
          'rounded-3xl border border-[#EDE6DC] bg-white/90 p-5 shadow-[0_1px_2px_rgba(60,40,20,0.04),0_12px_32px_-18px_rgba(60,40,20,0.18)] transition-all duration-200 md:p-6',
          className
        )
      )}
      {...props}
    />
  );
};

export default Card;
