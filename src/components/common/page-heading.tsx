import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';

const PageHeading = ({
  title,
  className,
  ...props
}: {
  title: string;
  className?: string;
}) => {
  return (
    <h2
      className={twMerge(
        classNames(
          // Visuel E.doto : titre en sérif, comme les dashboards point de retrait / sponsor
          'edoto-serif text-xl font-normal tracking-tight text-[#1F1B16] sm:text-2xl',
          className
        )
      )}
      {...props}
    >
      {title}
    </h2>
  );
};

export default PageHeading;
