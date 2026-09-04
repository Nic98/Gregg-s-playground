import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { cn } from '@/lib/utils';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  'aria-label': ariaLabel,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn(
        'data-horizontal:w-full data-vertical:h-full data-disabled:cursor-not-allowed',
        className,
      )}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      aria-label={ariaLabel}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex min-h-11 w-full touch-none items-center select-none data-disabled:cursor-not-allowed data-vertical:h-full data-vertical:min-h-40 data-vertical:min-w-11 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted-foreground select-none data-disabled:bg-border data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-disabled:bg-muted-foreground data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            aria-label={
              _values.length === 1 || !ariaLabel
                ? ariaLabel
                : `${ariaLabel} ${index + 1}`
            }
            className="relative block size-5 shrink-0 rounded-full border-2 border-foreground bg-card shadow-[0_1px_2px_rgba(17,20,15,0.12)] transition-[background-color,border-color,box-shadow] duration-[140ms] ease-[cubic-bezier(.2,.8,.2,1)] after:absolute after:-inset-3 after:content-[''] select-none data-disabled:border-border data-disabled:bg-muted data-disabled:shadow-none disabled:border-border disabled:bg-muted disabled:shadow-none"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
