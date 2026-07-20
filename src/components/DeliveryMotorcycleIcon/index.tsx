import { DELIVERY_MOTORCYCLE_SRC } from './marker';

export interface DeliveryMotorcycleIconProps {
  'aria-label'?: string;
  className?: string;
  /** Outer circle diameter in px. Default 28. */
  size?: number;
  onClick?: () => void;
}

/** Circular primary-border badge with delivery_motorcycle.png. */
export function DeliveryMotorcycleIcon({
  'aria-label': ariaLabel = 'Repartidor',
  className = '',
  onClick,
  size = 28,
}: DeliveryMotorcycleIconProps) {
  const iconSize = Math.round(size * 0.67);
  const clickable = Boolean(onClick);

  return (
    <span
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={ariaLabel}
      data-testid="delivery-motorcycle-icon"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white shadow-sm ${
        clickable ? 'cursor-pointer' : ''
      } ${className}`.trim()}
      style={{ height: size, width: size }}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <img
        src={DELIVERY_MOTORCYCLE_SRC}
        alt=""
        aria-hidden="true"
        width={iconSize}
        height={iconSize}
        className="block object-contain"
      />
    </span>
  );
}
