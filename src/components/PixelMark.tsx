import type { ComponentPropsWithoutRef } from 'react';

interface PixelMarkProps extends ComponentPropsWithoutRef<'span'> {
  label?: string;
}

/**
 * Gregg's nine-pixel brand mark. The offset final pixel represents the small
 * change that makes a result visible in every playground experiment.
 */
export function PixelMark({ className, label, ...props }: PixelMarkProps) {
  const classes = ['pixel-mark', className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span
          className={
            index === 8
              ? 'pixel-mark__cell pixel-mark__cell--offset'
              : 'pixel-mark__cell'
          }
          key={index}
        />
      ))}
    </span>
  );
}
