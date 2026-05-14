import type { ColumnsType } from 'antd/es/table';

import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

import {
  type AdminProduct,
  type AdminProductActiveFilter,
  createAdminProduct,
  deactivateAdminProduct,
  getAdminProducts,
  patchAdminProduct,
} from '../../api/adminProducts';

const { Title } = Typography;

const SORT_OPTIONS = [
  { label: 'Nombre (defecto)', value: '' as const },
  { label: 'Precio menor a mayor', value: 'priceAsc' as const },
  { label: 'Precio mayor a menor', value: 'priceDesc' as const },
];

const urlValidator = {
  validator: async (_: unknown, value: unknown) => {
    const s = typeof value === 'string' ? value.trim() : '';
    if (!s) return Promise.resolve();
    try {
      const u = new URL(s);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return Promise.reject(new Error('URL no válida'));
      }
    } catch {
      return Promise.reject(new Error('URL no válida'));
    }
    return Promise.resolve();
  },
};

const AdminProducts = () => {
  const [data, setData] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<'' | 'priceAsc' | 'priceDesc'>('');
  const [activeFilter, setActiveFilter] = useState<AdminProductActiveFilter>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminProducts(page, pageSize, search || undefined, sort, activeFilter);
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error((res.data as { error?: string })?.error ?? 'Error al cargar productos');
      return;
    }
    setData(res.data.data);
    setTotal(res.data.total);
  }, [page, pageSize, search, sort, activeFilter]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      active: true,
      adminMovements: 0,
      initialBalance: 0,
      salesToday: 0,
      totalStock: 0,
    });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    const res = await createAdminProduct({
      active: values.active,
      adminMovements: values.adminMovements ?? undefined,
      brand: values.brand,
      code: values.code,
      cost: values.cost,
      department: values.department,
      description: values.description || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
      initialBalance: values.initialBalance ?? undefined,
      inventoryValueBs: values.inventoryValueBs ?? undefined,
      marginPct: values.marginPct ?? undefined,
      name: values.name,
      price: values.price,
      salesToday: values.salesToday ?? undefined,
      totalStock: values.totalStock ?? undefined,
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo crear');
      return;
    }
    void message.success('Producto creado');
    setCreateOpen(false);
    void load();
  };

  const openEdit = (row: AdminProduct) => {
    setEditing(row);
    editForm.setFieldsValue({
      brand: row.brand,
      description: row.description ?? '',
      imageUrl: row.imageUrl ?? '',
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;
    const res = await patchAdminProduct(editing.id, {
      brand: values.brand,
      description: values.description ?? '',
      imageUrl: values.imageUrl?.trim() ?? '',
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo guardar');
      return;
    }
    void message.success('Producto actualizado');
    setEditOpen(false);
    setEditing(null);
    void load();
  };

  const confirmDeactivate = (row: AdminProduct) => {
    Modal.confirm({
      cancelText: 'Cancelar',
      content: `¿Desactivar ${row.name} (${row.code})? Dejará de mostrarse en el catálogo público.`,
      okText: 'Desactivar',
      okType: 'danger',
      onOk: async () => {
        const res = await deactivateAdminProduct(row.id);
        if (!res.ok) {
          void message.error((res.data as { error?: string })?.error ?? 'No se pudo desactivar');
          return Promise.reject(new Error('deactivate failed'));
        }
        void message.success('Producto desactivado');
        void load();
      },
      title: 'Desactivar producto',
    });
  };

  const columns: ColumnsType<AdminProduct> = [
    {
      key: 'thumb',
      render: (_, row) =>
        row.imageUrl ? (
          <Image alt="" height={40} src={row.imageUrl} width={40} style={{ objectFit: 'cover' }} />
        ) : (
          <span className="text-gray-400">—</span>
        ),
      title: 'Img',
      width: 72,
    },
    { dataIndex: 'code', key: 'code', title: 'Código' },
    { dataIndex: 'name', ellipsis: true, key: 'name', title: 'Nombre' },
    { dataIndex: 'brand', key: 'brand', title: 'Marca' },
    {
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => v.toLocaleString('es-VE', { maximumFractionDigits: 2 }),
      title: 'Precio',
    },
    {
      dataIndex: 'totalStock',
      key: 'totalStock',
      render: (v: number | null) => (v == null ? '—' : v),
      title: 'Stock',
    },
    {
      dataIndex: 'active',
      key: 'active',
      render: (a: boolean) => (
        <Tag color={a ? 'green' : 'default'}>{a ? 'Activo' : 'Inactivo'}</Tag>
      ),
      title: 'Estado',
    },
    {
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Button size="small" type="link" onClick={() => openEdit(row)}>
            Editar
          </Button>
          {row.active ? (
            <Button danger size="small" type="link" onClick={() => confirmDeactivate(row)}>
              Desactivar
            </Button>
          ) : null}
        </Space>
      ),
      title: 'Acciones',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Title className="!mb-0" level={2}>
          Productos
        </Title>
        <Space wrap>
          <Select
            options={[
              { label: 'Todos', value: 'all' },
              { label: 'Activos', value: 'true' },
              { label: 'Inactivos', value: 'false' },
            ]}
            style={{ width: 140 }}
            value={activeFilter}
            onChange={(v) => {
              setActiveFilter(v);
              setPage(1);
            }}
          />
          <Select
            options={SORT_OPTIONS}
            style={{ width: 200 }}
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
          />
          <Input.Search
            allowClear
            enterButton="Buscar"
            placeholder="Nombre, código, marca…"
            style={{ maxWidth: 320 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <Button type="primary" onClick={openCreate}>
            Nuevo producto
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          pageSize,
          showSizeChanger: true,
          total,
        }}
        rowKey="id"
      />

      <Modal
        destroyOnClose
        okText="Crear"
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreate()}
        open={createOpen}
        title="Nuevo producto"
        width={640}
      >
        <Form form={createForm} layout="vertical">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item label="Código interno" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Marca" name="brand" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Departamento" name="department" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Precio" name="price" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} precision={2} step={0.01} />
            </Form.Item>
            <Form.Item label="Costo" name="cost" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} precision={2} step={0.01} />
            </Form.Item>
            <Form.Item label="Stock total" name="totalStock">
              <InputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
            <Form.Item label="Saldo inicial" name="initialBalance">
              <InputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
            <Form.Item label="Ventas hoy" name="salesToday">
              <InputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
            <Form.Item label="Movimientos admin" name="adminMovements">
              <InputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
            <Form.Item label="Margen %" name="marginPct">
              <InputNumber className="w-full" min={0} precision={2} step={0.01} />
            </Form.Item>
            <Form.Item label="Valor inventario Bs" name="inventoryValueBs">
              <InputNumber className="w-full" min={0} precision={2} step={0.01} />
            </Form.Item>
          </div>
          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="URL de imagen" name="imageUrl" rules={[urlValidator]}>
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item label="Activo en catálogo" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        destroyOnClose
        okText="Guardar"
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onOk={() => void submitEdit()}
        open={editOpen}
        title="Editar producto (solo imagen, marca y descripción)"
        width={520}
      >
        <p className="mb-4 text-sm text-gray-500">
          {editing ? `${editing.name} · ${editing.code}` : null}
        </p>
        <Form form={editForm} layout="vertical">
          <Form.Item label="Marca" name="brand" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="URL de imagen" name="imageUrl" rules={[urlValidator]}>
            <Input placeholder="https://…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
