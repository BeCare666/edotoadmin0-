export const UploadIcon = ({
  color = 'currentColor',
  width = '51px',
  height = '40px',
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width} height={height} viewBox="0 0 40.909 30" {...rest}
      fill="none"
      stroke="url(#grad)"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6366F1" />
          <stop offset="1" stop-color="#8B5CF6" />
        </linearGradient>
      </defs>
      <path d="M16 16a4 4 0 0 0 0-8 5 5 0 0 0-9.9 1A4 4 0 0 0 7 16h9z" />
      <path d="M12 12v8" />
      <path d="m8 16 4-4 4 4" />
    </svg>

  );
};
