const DEFAULT_CHECK_STROKE_WIDTH = 1.6;

type CheckIconProps = {
  className?: string;
  strokeWidth?: number;
};

export function CheckIcon({
  className,
  strokeWidth = DEFAULT_CHECK_STROKE_WIDTH,
}: CheckIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3 8.5l3 3 7-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
