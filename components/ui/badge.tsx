import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex min-h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap transition-[background-color,border-color,box-shadow,color] duration-[140ms] ease-[cubic-bezier(.2,.8,.2,1)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        live: 'bg-accent text-accent-foreground [&:is(a)]:text-accent-foreground',
        planned:
          'border-border bg-muted text-muted-foreground [&:is(a)]:text-muted-foreground',
        topic:
          'border-border bg-card text-foreground [&:is(a)]:text-foreground',
        default:
          'bg-accent text-accent-foreground [&:is(a)]:text-accent-foreground',
        secondary:
          'border-border bg-card text-foreground [&:is(a)]:text-foreground',
        destructive:
          'border-destructive/20 bg-destructive/10 text-destructive [&:is(a)]:text-destructive focus-visible:ring-destructive/40',
        outline:
          'border-border bg-card text-foreground [&:is(a)]:text-foreground',
        ghost:
          'bg-transparent text-muted-foreground [&:is(a)]:text-muted-foreground',
        link: 'bg-transparent text-foreground underline underline-offset-4 [&:is(a)]:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'live',
    },
  },
);

function Badge({
  className,
  variant = 'live',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };
