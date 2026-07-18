import type { ColumnsType } from 'antd/es/table';

import { EditOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type { PaymentMethod } from '../../types/order';

import {
  type AdminPaymentMethodConfig,
  getAdminPaymentMethods,
  patchAdminPaymentMethod,
} from '../../api/adminPaymentMethods';

const { Title } = Typography;
const { TextArea } = Input;

const METHOD_LABELS: Record<PaymentMethod, string> = {
  binance: 'Binance',
  cash: 'Efectivo',
  mobilePayment: 'Pago Móvil',
  zelle: 'Zelle',
};

const AdminPaymentMethods = () => {
  const [data, setData] = useState<AdminPaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPaymentMethodConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminPaymentMethods();
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error(
        (res.data as { error?: string })?.error ?? 'Error al cargar métodos de pago',
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

  const openEdit = (row: AdminPaymentMethodConfig) => {
    setEditing(row);
    editForm.setFieldsValue({
      active: row.active,
      information: row.information ?? '',
      noteEnabled: row.noteEnabled,
      placeholder: row.placeholder ?? '',
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;

    setSaving(true);
    const res = await patchAdminPaymentMethod(editing.method, {
      active: values.active,
      information: values.information?.trim() ? values.information.trim() : null,
      noteEnabled: values.noteEnabled,
      placeholder: values.placeholder?.trim() ? values.placeholder.trim() : null,
    });
    setSaving(false);

    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo guardar');
      return;
    }
    void message.success('Método de pago actualizado');
    setEditOpen(false);
    setEditing(null);
    void load();
  };

  const columns: ColumnsType<AdminPaymentMethodConfig> = [
    {
      dataIndex: 'method',
      key: 'method',
      render: (method: PaymentMethod) => METHOD_LABELS[method] ?? method,
      title: 'Método',
      width: 140,
    },
    {
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Activo' : 'Inactivo'}</Tag>
      ),
      title: 'Estado',
      width: 100,
    },
    {
      dataIndex: 'noteEnabled',
      key: 'noteEnabled',
      render: (enabled: boolean) => (enabled ? 'Sí' : 'No'),
      title: 'Permite nota',
      width: 120,
    },
    {
      dataIndex: 'information',
      ellipsis: true,
      key: 'information',
      render: (v: string | null) => v ?? '—',
      title: 'Información',
    },
    {
      dataIndex: 'placeholder',
      ellipsis: true,
      key: 'placeholder',
      render: (v: string | null) => v ?? '—',
      title: 'Placeholder',
    },
    {
      key: 'actions',
      render: (_, row) => (
        <Tooltip title="Editar">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            aria-label={`Editar ${METHOD_LABELS[row.method]}`}
            onClick={() => openEdit(row)}
          />
        </Tooltip>
      ),
      title: 'Acciones',
      width: 90,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <Space direction="vertical" size={16} className="w-full">
        <Title level={3} className="!mb-0">
          Métodos de pago
        </Title>
        <Table
          rowKey="method"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
        />
      </Space>

      <Modal
        title={editing ? `Editar ${METHOD_LABELS[editing.method]}` : 'Editar método'}
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onOk={() => {
          void submitEdit();
        }}
        confirmLoading={saving}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <Form.Item name="active" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="noteEnabled"
            label="Permite nota del cliente"
            valuePropName="checked"
            extra="Si está activo, el cliente puede agregar una nota de hasta 100 caracteres al pagar."
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="information"
            label="Información"
            extra="Datos de cuenta o instrucciones visibles en checkout (ej. Zelle, Binance, Pago Móvil)."
          >
            <TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item
            name="placeholder"
            label="Placeholder / ayuda del comprobante"
            extra="Texto de ayuda bajo el campo de comprobante. Vacío en pago móvil si no aplica."
          >
            <Input maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};

export default AdminPaymentMethods;
