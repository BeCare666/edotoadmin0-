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
          // Refonte 16/10/2026 : carte blanche, filet fin, aucune ombre
          'rounded-2xl border border-[#E9E5DF] bg-white p-5 transition-colors duration-200 md:p-6',
          className
        )
      )}
      {...props}
    />
  );
};

export default Card;
