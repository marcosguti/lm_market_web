import type { ColumnsType } from 'antd/es/table';

import { EditOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
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
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
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
import { getStores, type Store } from '../../api/stores';

const { Title } = Typography;

const SORT_OPTIONS = [
  { label: 'Nombre (defecto)', value: '' as const },
  { label: 'Precio menor a mayor', value: 'priceAsc' as const },
  { label: 'Precio mayor a menor', value: 'priceDesc' as const },
];

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_SIZE_KB = 500;

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
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string>('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminProducts(
      page,
      pageSize,
      search || undefined,
      sort,
      activeFilter,
      undefined,
      undefined,
      selectedStoreId || undefined
    );
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error((res.data as { error?: string })?.error ?? 'Error al cargar productos');
      return;
    }
    setData(res.data.data);
    setTotal(res.data.total);
  }, [page, pageSize, search, sort, activeFilter, selectedStoreId]);

  useEffect(() => {
    void (async () => {
      const s = await getStores();
      setStores(s);
      setSelectedStoreId((prev) => {
        if (prev && s.some((store) => store.id === prev)) return prev;
        return '';
      });
    })();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const openCreate = () => {
    createForm.resetFields();
    const defaultStores = stores.map((s) => ({ storeId: s.id, price: 0, stockQuantity: 0 }));
    createForm.setFieldsValue({ active: true, stores: defaultStores });
    setCreateImageFile(null);
    setCreateImagePreview('');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    const res = await createAdminProduct({
      active: values.active,
      brand: values.brand,
      code: values.code,
      department: values.department,
      description: values.description || undefined,
      imageFile: createImageFile ?? undefined,
      name: values.name,
      stores: values.stores ?? [],
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
    const storeEntries = stores.map((s) => {
      const existing = row.productStores.find((ps) => ps.storeId === s.id);
      return {
        storeId: s.id,
        price: existing ? existing.price : 0,
        stockQuantity: existing ? existing.stockQuantity : 0,
      };
    });
    editForm.setFieldsValue({
      brand: row.brand,
      description: row.description ?? '',
      stores: storeEntries,
    });
    setEditImageFile(null);
    setEditImagePreview('');
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;
    const res = await patchAdminProduct(editing.id, {
      brand: values.brand,
      description: values.description ?? '',
      imageFile: editImageFile ?? undefined,
      stores: values.stores ?? [],
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
      title: 'Imagen',
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
      title: 'Existencias',
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
        <Space size={0}>
          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label="Editar producto"
              onClick={() => openEdit(row)}
            />
          </Tooltip>
          {row.active ? (
            <Tooltip title="Desactivar">
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                aria-label="Desactivar producto"
                onClick={() => confirmDeactivate(row)}
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
      title: 'Acciones',
      width: 100,
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
          <Select
            allowClear
            options={[
              { label: 'Todas', value: '' },
              ...stores.map((s) => ({ label: s.name, value: s.id })),
            ]}
            placeholder="Tienda"
            style={{ width: 160 }}
            value={selectedStoreId || undefined}
            onChange={(v) => {
              setSelectedStoreId(v ?? '');
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
        destroyOnHidden
        okText="Crear"
        cancelText="Cancelar"
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreate()}
        open={createOpen}
        title="Nuevo producto"
        width={640}
      >
        <Form form={createForm} layout="vertical">
          <Tabs
            defaultActiveKey="general"
            items={[
              {
                key: 'general',
                label: 'General',
                children: (
                  <>
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
                      <Form.Item
                        label="Departamento"
                        name="department"
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                    <Form.Item label="Descripción" name="description">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label={`Imagen (jpg, png, webp - máx ${MAX_SIZE_KB}KB)`}>
                      <Upload
                        accept={IMAGE_ACCEPT}
                        beforeUpload={(file) => {
                          if (file.size > MAX_SIZE_KB * 1024) {
                            void message.error(`La imagen debe ser menor a ${MAX_SIZE_KB}KB`);
                            return Upload.LIST_IGNORE;
                          }
                          setCreateImageFile(file);
                          setCreateImagePreview(URL.createObjectURL(file));
                          return false;
                        }}
                        maxCount={1}
                        onRemove={() => {
                          setCreateImageFile(null);
                          setCreateImagePreview('');
                        }}
                        fileList={
                          createImagePreview
                            ? [
                                {
                                  uid: '-1',
                                  name: 'imagen',
                                  status: 'done',
                                  url: createImagePreview,
                                },
                              ]
                            : []
                        }
                        listType="picture"
                        showUploadList={{ showPreviewIcon: false }}
                      >
                        <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
                      </Upload>
                      {createImagePreview && (
                        <div className="mt-2">
                          <Image height={80} src={createImagePreview} />
                        </div>
                      )}
                    </Form.Item>
                    <Form.Item label="Activo en catálogo" name="active" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'stores',
                label: 'Precios por tienda',
                children: (
                  <div className="py-2">
                    <p className="mb-4 text-sm text-gray-500">
                      Establece el precio y stock para cada tienda. Deja en 0 si no aplica.
                    </p>
                    <Form.List name="stores">
                      {(fields) =>
                        fields.map((field) => {
                          const storeName = stores[field.name]?.name ?? `Tienda ${field.name + 1}`;
                          return (
                            <div
                              key={field.key}
                              className="mb-4 grid grid-cols-3 items-end gap-3 rounded-lg border border-gray-100 p-3"
                            >
                              <div className="col-span-1 font-medium text-gray-700">
                                {storeName}
                              </div>
                              <Form.Item name={[field.name, 'price']} className="mb-0">
                                <InputNumber
                                  className="w-full"
                                  min={0}
                                  precision={2}
                                  placeholder="Precio (Bs)"
                                />
                              </Form.Item>
                              <Form.Item name={[field.name, 'stockQuantity']} className="mb-0">
                                <InputNumber
                                  className="w-full"
                                  min={0}
                                  precision={0}
                                  placeholder="Existencias"
                                />
                              </Form.Item>
                            </div>
                          );
                        })
                      }
                    </Form.List>
                  </div>
                ),
              },
            ]}
          />
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
        title="Editar producto"
        width={560}
      >
        <p className="mb-4 text-sm text-gray-500">
          {editing ? `${editing.name} · ${editing.code}` : null}
        </p>
        <Form form={editForm} layout="vertical">
          <Tabs
            defaultActiveKey="general"
            items={[
              {
                key: 'general',
                label: 'General',
                children: (
                  <>
                    <Form.Item label="Marca" name="brand" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item label="Descripción" name="description">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item label={`Nueva imagen (jpg, png, webp - máx ${MAX_SIZE_KB}KB)`}>
                      <Upload
                        accept={IMAGE_ACCEPT}
                        beforeUpload={(file) => {
                          if (file.size > MAX_SIZE_KB * 1024) {
                            void message.error(`La imagen debe ser menor a ${MAX_SIZE_KB}KB`);
                            return Upload.LIST_IGNORE;
                          }
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                          return false;
                        }}
                        maxCount={1}
                        onRemove={() => {
                          setEditImageFile(null);
                          setEditImagePreview('');
                        }}
                        fileList={
                          editImagePreview || editing?.imageUrl
                            ? [
                                {
                                  uid: '-1',
                                  name: 'imagen',
                                  status: 'done',
                                  url: editImagePreview || editing?.imageUrl || undefined,
                                },
                              ]
                            : []
                        }
                        listType="picture"
                        showUploadList={{ showPreviewIcon: false }}
                      >
                        <Button icon={<UploadOutlined />}>Cambiar imagen</Button>
                      </Upload>
                      {(editImagePreview || editing?.imageUrl) && (
                        <div className="mt-2">
                          <Image height={80} src={editImagePreview || editing?.imageUrl || ''} />
                          {editImagePreview && (
                            <span className="ml-2 text-xs text-gray-500">Nueva imagen</span>
                          )}
                        </div>
                      )}
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'stores',
                label: 'Precios por tienda',
                children: (
                  <div className="py-2">
                    <p className="mb-4 text-sm text-gray-500">
                      Actualiza el precio y stock para cada tienda.
                    </p>
                    <Form.List name="stores">
                      {(fields) =>
                        fields.map((field) => (
                          <div
                            key={field.key}
                            className="mb-4 grid grid-cols-3 items-end gap-3 rounded-lg border border-gray-100 p-3"
                          >
                            <div className="col-span-1 font-medium text-gray-700">
                              {stores[field.name]?.name ?? `Tienda ${field.name + 1}`}
                            </div>
                            <Form.Item name={[field.name, 'price']} className="mb-0">
                              <InputNumber
                                className="w-full"
                                min={0}
                                precision={2}
                                placeholder="Precio (Bs)"
                              />
                            </Form.Item>
                            <Form.Item name={[field.name, 'stockQuantity']} className="mb-0">
                              <InputNumber
                                className="w-full"
                                min={0}
                                precision={0}
                                placeholder="Existencias"
                              />
                            </Form.Item>
                          </div>
                        ))
                      }
                    </Form.List>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
