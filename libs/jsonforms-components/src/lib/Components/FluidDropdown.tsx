import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { GoabDropdown, GoabDropdownProps } from '@abgov/react-components-ds1';

// Inline-size containment stops the dropdown's pixel width from counting towards its container's
// minimum width, so the container can still shrink and the observer below sees the new width.
const DropdownWidthWrapper = styled.div`
  contain: inline-size;
`;

/**
 * goa-dropdown turns a percentage width into a pixel width that it measures only when its options
 * mount or its menu opens, never when its container resizes. When the layout changes width after
 * mount (list-with-details stacking its panes, a window resize, a phone rotating) the dropdown keeps
 * its old width until it is clicked. This measures the wrapper instead and passes the dropdown a
 * whole-pixel width (goa-dropdown rejects fractional values) that follows the container.
 */
export const useFluidDropdownWidth = (width?: string) => {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<string>();
  const percent = width ? /^(\d+(?:\.\d+)?)%$/.exec(width)?.[1] : undefined;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!percent || !el || typeof ResizeObserver === 'undefined') {
      setMeasured(undefined);
      return;
    }

    const update = (containerWidth: number) => {
      const px = Math.floor((containerWidth * Number(percent)) / 100);
      setMeasured(px > 0 ? `${px}px` : undefined);
    };

    update(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [percent]);

  return { ref, width: measured ?? width };
};

/** GoabDropdown whose percentage width keeps following its container. */
export const FluidDropdown = ({ width, ...props }: GoabDropdownProps): JSX.Element => {
  const fluid = useFluidDropdownWidth(width);

  return (
    <DropdownWidthWrapper ref={fluid.ref}>
      <GoabDropdown {...props} width={fluid.width} />
    </DropdownWidthWrapper>
  );
};
