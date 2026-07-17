import { Tooltip } from 'antd';

import { formatShortOrderId } from '../../utils/orderId';

/** Displays `#` + first UUID segment; full id in tooltip. */
export function ShortOrderId({ id }: { id: string }) {
  return (
    <Tooltip title={id}>
      <span>{formatShortOrderId(id)}</span>
    </Tooltip>
  );
}
