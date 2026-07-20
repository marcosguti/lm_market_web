import type { ColumnsType } from 'antd/es/table';

import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  message,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type {
  AdminSyncJobStatus,
  AdminSyncStatusData,
  BcvSyncDetails,
  ProductStoreSyncDetail,
  ProductSyncDetails,
  SyncJobRunStatus,
} from '../../api/adminSyncStatus';

import {
  getAdminSyncStatus,
  isBcvSyncDetails,
  isProductSyncDetails,
} from '../../api/adminSyncStatus';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<SyncJobRunStatus, string> = {
  failed: 'error',
  incomplete: 'warning',
  ok: 'success',
  running: 'processing',
};

const STATUS_LABEL: Record<SyncJobRunStatus, string> = {
  failed: 'Fallida',
  incomplete: 'Incompleta',
  ok: 'OK',
  running: 'En curso',
};

const REASON_LABEL: Record<string, string> = {
  failed: 'Última corrida fallida',
  incomplete: 'Última corrida incompleta',
  never_ran: 'Nunca se ha ejecutado',
  never_succeeded: 'Nunca ha terminado OK',
  stale: 'Última sync OK demasiado antigua',
  stuck_running: 'Lleva demasiado tiempo en curso',
};

const SOURCE_LABEL: Record<string, string> = {
  bcv: 'BCV',
  bdv: 'BDV',
  dolarapi: 'DolarAPI',
  env: 'Env',
  fallback: 'Fallback',
};

function formatDate(value: null | string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRate(rate: number): string {
  return rate.toLocaleString('es-VE', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });
}

function storeRowStatus(row: ProductStoreSyncDetail): {
  color: string;
  label: string;
} {
  if (row.failed) return { color: 'error', label: 'Fallida' };
  if (!row.complete) return { color: 'warning', label: 'Incompleta' };
  return { color: 'success', label: 'OK' };
}

function ProductSyncDetailsPanel({ details }: { details: ProductSyncDetails }) {
  const totalUpserted = details.stores.reduce((sum, s) => sum + s.upserted, 0);

  const columns: ColumnsType<ProductStoreSyncDetail> = [
    {
      dataIndex: 'storeName',
      key: 'storeName',
      render: (name: string, row) =>
        row.error ? (
          <Tooltip title={row.error}>
            <span>{name}</span>
          </Tooltip>
        ) : (
          name
        ),
      title: 'Tienda',
    },
    {
      align: 'right',
      dataIndex: 'branch',
      key: 'branch',
      title: 'Sucursal',
      width: 88,
    },
    {
      key: 'status',
      render: (_: unknown, row) => {
        const { color, label } = storeRowStatus(row);
        return <Tag color={color}>{label}</Tag>;
      },
      title: 'Estado',
      width: 110,
    },
    {
      align: 'right',
      dataIndex: 'upserted',
      key: 'upserted',
      render: (n: number) => n.toLocaleString('es-VE'),
      title: 'Actualizados',
      width: 110,
    },
    {
      align: 'right',
      dataIndex: 'pageErrors',
      key: 'pageErrors',
      title: 'Err. pág.',
      width: 88,
    },
    {
      align: 'right',
      dataIndex: 'rowErrors',
      key: 'rowErrors',
      title: 'Err. fila',
      width: 88,
    },
    {
      align: 'right',
      dataIndex: 'deactivated',
      key: 'deactivated',
      title: 'Desactivados',
      width: 110,
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="Tiendas" value={details.storesTotal} />
        </Col>
        <Col span={6}>
          <Statistic title="Fallidas" value={details.storeFailures} />
        </Col>
        <Col span={6}>
          <Statistic title="Incompletas" value={details.incompleteStoreCount} />
        </Col>
        <Col span={6}>
          <Statistic title="Actualizados" value={totalUpserted} />
        </Col>
      </Row>
      <Table<ProductStoreSyncDetail>
        columns={columns}
        dataSource={details.stores}
        pagination={false}
        rowKey={(row) => `${row.storeName}-${row.branch}`}
        size="small"
        scroll={{ x: true }}
      />
    </div>
  );
}

function BcvSyncDetailsPanel({ details }: { details: BcvSyncDetails }) {
  const sourceLabel = SOURCE_LABEL[details.source] ?? details.source;

  return (
    <div style={{ marginTop: 16 }}>
      <Statistic
        title="Tasa actual"
        value={details.rate}
        formatter={() => formatRate(details.rate)}
      />
      <Space style={{ marginTop: 12 }} wrap>
        <Tag color="blue">{sourceLabel}</Tag>
        <Text type="secondary">Consultada: {formatDate(details.fetchedAt)}</Text>
      </Space>
    </div>
  );
}

function SyncJobCard({
  job,
  title,
  variant,
}: {
  job: AdminSyncJobStatus;
  title: string;
  variant: 'bcv' | 'products';
}) {
  const status = job.status;
  const productDetails = variant === 'products' && isProductSyncDetails(job.details) ? job.details : null;
  const bcvDetails = variant === 'bcv' && isBcvSyncDetails(job.details) ? job.details : null;
  const hasUnrecognizedDetails =
    job.details !== null &&
    job.details !== undefined &&
    ((variant === 'products' && !productDetails) || (variant === 'bcv' && !bcvDetails));

  return (
    <Card
      title={
        <Space wrap>
          <span>{title}</span>
          {status ? (
            <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
          ) : (
            <Tag>Sin datos</Tag>
          )}
          <Tag color={job.healthy ? 'success' : 'error'}>
            {job.healthy ? 'Saludable' : 'No saludable'}
          </Tag>
        </Space>
      }
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Última sync OK">{formatDate(job.lastSucceededAt)}</Descriptions.Item>
        <Descriptions.Item label="Último inicio">{formatDate(job.lastStartedAt)}</Descriptions.Item>
        <Descriptions.Item label="Último fin">{formatDate(job.lastFinishedAt)}</Descriptions.Item>
        <Descriptions.Item label="Motivo salud">
          {job.reason ? (REASON_LABEL[job.reason] ?? job.reason) : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Último error">{job.lastError ?? '—'}</Descriptions.Item>
      </Descriptions>
      {productDetails ? <ProductSyncDetailsPanel details={productDetails} /> : null}
      {bcvDetails ? <BcvSyncDetailsPanel details={bcvDetails} /> : null}
      {hasUnrecognizedDetails ? (
        <Empty
          description="Sin detalle estructurado disponible"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 16 }}
        />
      ) : null}
    </Card>
  );
}

const EMPTY_JOB: AdminSyncJobStatus = {
  details: null,
  healthy: false,
  job: null,
  lastAlertedAt: null,
  lastError: null,
  lastFinishedAt: null,
  lastStartedAt: null,
  lastSucceededAt: null,
  reason: 'never_ran',
  status: null,
  updatedAt: null,
};

const AdminSyncStatus = () => {
  const [data, setData] = useState<AdminSyncStatusData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminSyncStatus();
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error(
        (res.data as { error?: string })?.error ?? 'Error al cargar estado de sincronización',
      );
      return;
    }
    setData(res.data.data);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Space className="mb-6 w-full justify-between" wrap>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            Sincronización
          </Title>
          <Text type="secondary">
            Estado de sync de catálogo y tasa USD/VES (solo super admin).
          </Text>
        </div>
        <Space>
          {data ? (
            <Tag color={data.ok ? 'success' : 'error'} style={{ fontSize: 14, padding: '4px 10px' }}>
              {data.ok ? 'Todo OK' : 'Hay problemas'}
            </Tag>
          ) : null}
          <Button loading={loading} onClick={() => void load()}>
            Actualizar
          </Button>
        </Space>
      </Space>

      <Row gutter={[16, 16]}>
        <Col lg={14} xs={24}>
          <SyncJobCard job={data?.products ?? EMPTY_JOB} title="Catálogo de productos" variant="products" />
        </Col>
        <Col lg={10} xs={24}>
          <SyncJobCard job={data?.bcv ?? EMPTY_JOB} title="Tasa USD → VES" variant="bcv" />
        </Col>
      </Row>
    </div>
  );
};

export default AdminSyncStatus;
