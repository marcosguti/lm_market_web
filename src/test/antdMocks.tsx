import type { DrawerProps, DropdownProps, ModalFuncProps, ModalProps, SelectProps, TableProps } from 'antd';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

/** Lightweight Drawer stub — avoids jsdom scroll-lock hangs. */
export function mockDrawer({ children, footer, open, title }: DrawerProps) {
  return open ? (
    <div data-testid="antd-drawer">
      <div>{title}</div>
      <div>{footer}</div>
      <div>{children}</div>
    </div>
  ) : null;
}

function createModalInstanceMock() {
  return { destroy: vi.fn(), update: vi.fn() };
}

function createModalMethodMock() {
  return vi.fn((config: ModalFuncProps) => {
    config.onOk?.();
    return createModalInstanceMock();
  });
}

/** Lightweight Modal stub — renders dialog semantics without portals. */
function ModalComponent({ children, footer, open, title }: ModalProps) {
  return open ? (
    <div role="dialog">
      <div>{title}</div>
      <div>{children}</div>
      <div>{footer}</div>
    </div>
  ) : null;
}

export const mockModal = Object.assign(ModalComponent, {
  confirm: createModalMethodMock(),
  destroyAll: vi.fn(),
  error: createModalMethodMock(),
  info: createModalMethodMock(),
  success: createModalMethodMock(),
  useModal: () => [
    { confirm: createModalMethodMock(), info: createModalMethodMock() },
    <div key="modal-holder" />,
  ],
  warning: createModalMethodMock(),
});

/** Simple table — no virtualization or ResizeObserver loops. */
export function mockTable<T extends object>({ columns, dataSource, rowKey }: TableProps<T>) {
  const resolveKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') return String(rowKey(record, index));
    if (typeof rowKey === 'string') return String((record as Record<string, unknown>)[rowKey] ?? index);
    return String(index);
  };

  return (
    <table data-testid="antd-table">
      <thead>
        <tr>
          {columns?.map((column) => (
            <th key={String(column.key ?? column.dataIndex ?? column.title)}>{column.title as ReactNode}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource?.map((record, index) => (
          <tr key={resolveKey(record, index)}>
            {columns?.map((column) => {
              const dataIndex = column.dataIndex;
              let cell: ReactNode = null;
              if (column.render) {
                const value =
                  dataIndex !== undefined && dataIndex !== null
                    ? (record as Record<string, unknown>)[String(dataIndex)]
                    : undefined;
                cell = column.render(value, record, index);
              } else if (dataIndex !== undefined && dataIndex !== null) {
                cell = String((record as Record<string, unknown>)[String(dataIndex)] ?? '');
              }
              return (
                <td key={String(column.key ?? column.dataIndex ?? column.title)}>{cell}</td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function mockUpload({ children }: { children?: ReactNode }) {
  return (
    <div data-testid="antd-upload">
      {children}
      <input type="file" />
    </div>
  );
}

export function mockDatePicker(props: Record<string, unknown>) {
  return <input type="text" data-testid="antd-datepicker" {...props} />;
}

export function mockImage({ src, alt }: { alt?: string; src?: string }) {
  return <img src={src} alt={alt} />;
}

/** Renders dropdown menu items inline (no portal / scroll lock). */
export function mockDropdown({ children, menu }: DropdownProps) {
  return (
    <div data-testid="antd-dropdown">
      {children}
      <div data-testid="antd-dropdown-menu">
        {menu?.items?.map((item) => {
          if (!item || typeof item !== 'object' || !('key' in item)) return null;
          return (
            <div key={String(item.key)} data-dropdown-key={String(item.key)}>
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Wraps Select and optionally captures role `options` for RBAC assertions. */
export function createSelectCapture(
  ActualSelect: (props: SelectProps) => ReactNode,
  captureRef: { latest: NonNullable<SelectProps['options']> },
  matchValue = 'client',
) {
  return function SelectWithCapture({ options, ...props }: SelectProps) {
    if (options?.some((option) => option?.value === matchValue)) {
      captureRef.latest = options ?? [];
    }
    return <ActualSelect options={options} {...props} />;
  };
}

function mockMessage(actualMessage: typeof import('antd')['message']) {
  return {
    ...actualMessage,
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  };
}

/** Shared antd test mock — used by global setup and per-file overrides. */
export async function buildAntdTestMock(importOriginal: () => Promise<typeof import('antd')>) {
  const actual = await importOriginal();
  return {
    ...actual,
    DatePicker: mockDatePicker,
    Drawer: mockDrawer,
    Image: mockImage,
    Modal: mockModal,
    Table: mockTable,
    Upload: mockUpload,
    message: mockMessage(actual.message),
  };
}

/** @deprecated Use buildAntdTestMock */
export async function withAntdDrawerMock(importOriginal: () => Promise<typeof import('antd')>) {
  return buildAntdTestMock(importOriginal);
}
