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
          'rounded-2xl border border-gray-200/80 bg-white p-5 shadow-card transition-all duration-200 md:p-6',
          className
        )
      )}
      {...props}
    />
  );
};

export default Card;
