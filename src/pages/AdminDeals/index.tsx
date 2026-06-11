import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';

import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';

import {
  type AdminDeal,
  createAdminDeal,
  deleteAdminDeal,
  getAdminDeals,
  patchAdminDeal,
} from '../../api/deals';

const { Title } = Typography;

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_SIZE_KB = 1024;

const disableBeforeToday = (current: Dayjs) =>
  !!current && current.startOf('day').isBefore(dayjs().startOf('day'));

const startDateRules = [
  { required: true, message: 'La fecha de inicio es obligatoria' },
  ({ getFieldValue }: { getFieldValue: (name: string) => Dayjs | undefined }) => ({
    validator(_: unknown, value: Dayjs | undefined) {
      if (!value) return Promise.resolve();
      if (disableBeforeToday(value)) {
        return Promise.reject(new Error('La fecha de inicio no puede ser anterior a hoy'));
      }
      const end = getFieldValue('endDate');
      if (end && value.startOf('day').isAfter(end.startOf('day'))) {
        return Promise.reject(
          new Error('La fecha de inicio debe ser anterior o igual a la de fin')
        );
      }
      return Promise.resolve();
    },
  }),
];

const endDateRules = (getStartDate: () => Dayjs | undefined) => [
  { required: true, message: 'La fecha de fin es obligatoria' },
  () => ({
    validator(_: unknown, value: Dayjs | undefined) {
      if (!value) return Promise.resolve();
      if (disableBeforeToday(value)) {
        return Promise.reject(new Error('La fecha de fin no puede ser anterior a hoy'));
      }
      const start = getStartDate();
      if (start && value.startOf('day').isBefore(start.startOf('day'))) {
        return Promise.reject(
          new Error('La fecha de fin debe ser igual o posterior a la de inicio')
        );
      }
      return Promise.resolve();
    },
  }),
];

const disableEndDate =
  (startDate: Dayjs | undefined) =>
  (current: Dayjs): boolean => {
    if (!current) return false;
    if (disableBeforeToday(current)) return true;
    if (startDate && current.startOf('day').isBefore(startDate.startOf('day'))) return true;
    return false;
  };

const AdminDeals = () => {
  const [data, setData] = useState<AdminDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDeal | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const createStartDate = Form.useWatch('startDate', createForm);
  const editStartDate = Form.useWatch('startDate', editForm);

  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string>('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminDeals(page, pageSize);
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error((res.data as { error?: string })?.error ?? 'Error al cargar ofertas');
      return;
    }
    setData(res.data.data);
    setTotal(res.data.total);
  }, [page, pageSize]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ active: true });
    setCreateImageFile(null);
    setCreateImagePreview('');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    if (!createImageFile) {
      void message.error('La imagen es obligatoria');
      return;
    }
    const res = await createAdminDeal({
      description: values.description || undefined,
      endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      imageFile: createImageFile,
      startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo crear');
      return;
    }
    void message.success('Oferta creada');
    setCreateOpen(false);
    void load();
  };

  const openEdit = (row: AdminDeal) => {
    setEditing(row);
    editForm.setFieldsValue({
      active: row.active,
      description: row.description ?? '',
      endDate: dayjs(row.endDate),
      startDate: dayjs(row.startDate),
    });
    setEditImageFile(null);
    setEditImagePreview('');
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;
    const res = await patchAdminDeal(editing.id, {
      active: values.active,
      description: values.description || '',
      endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      imageFile: editImageFile || undefined,
      startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo guardar');
      return;
    }
    void message.success('Oferta actualizada');
    setEditOpen(false);
    setEditing(null);
    void load();
  };

  const confirmDelete = (row: AdminDeal) => {
    Modal.confirm({
      cancelText: 'Cancelar',
      content: `¿Eliminar esta oferta? La imagen dejará de mostrarse en el carousel.`,
      okText: 'Eliminar',
      okType: 'danger',
      onOk: async () => {
        const res = await deleteAdminDeal(row.id);
        if (!res.ok) {
          void message.error((res.data as { error?: string })?.error ?? 'No se pudo eliminar');
          return Promise.reject(new Error('delete failed'));
        }
        void message.success('Oferta eliminada');
        void load();
      },
      title: 'Eliminar oferta',
    });
  };

  const columns: ColumnsType<AdminDeal> = [
    {
      key: 'thumb',
      render: (_, row) =>
        row.imageUrl ? (
          <Image alt="" height={48} src={row.imageUrl} width={80} style={{ objectFit: 'cover' }} />
        ) : (
          <span className="text-gray-400">—</span>
        ),
      title: 'Imagen',
      width: 96,
    },
    {
      key: 'dates',
      render: (_, row) => (
        <span className="text-sm">
          {dayjs(row.startDate).format('DD/MM/YY')} → {dayjs(row.endDate).format('DD/MM/YY')}
        </span>
      ),
      title: 'Vigencia',
    },
    {
      dataIndex: 'description',
      ellipsis: true,
      key: 'description',
      render: (v: string | null) => v ?? '—',
      title: 'Descripción',
    },
    {
      dataIndex: 'active',
      key: 'active',
      render: (a: boolean) => (
        <Tag color={a ? 'green' : 'default'}>{a ? 'Activa' : 'Inactiva'}</Tag>
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
          <Button danger icon size="small" type="link" onClick={() => confirmDelete(row)}>
            <DeleteOutlined />
          </Button>
        </Space>
      ),
      title: 'Acciones',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Title className="!mb-0" level={2}>
          Ofertas
        </Title>
        <Button type="primary" onClick={openCreate}>
          Nueva oferta
        </Button>
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
        title="Nueva oferta"
        width={560}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label={`Imagen del banner (jpg, png, webp - máx ${MAX_SIZE_KB}KB)`}>
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
                <Image
                  height={120}
                  src={createImagePreview}
                  style={{ objectFit: 'cover' }}
                  width="100%"
                />
              </div>
            )}
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              dependencies={['endDate']}
              label="Fecha de inicio"
              name="startDate"
              rules={startDateRules}
            >
              <DatePicker
                className="w-full"
                disabledDate={disableBeforeToday}
                format="DD/MM/YYYY"
                onChange={() => {
                  void createForm.validateFields(['endDate']);
                }}
              />
            </Form.Item>
            <Form.Item
              dependencies={['startDate']}
              label="Fecha de fin"
              name="endDate"
              rules={endDateRules(() => createStartDate as Dayjs | undefined)}
            >
              <DatePicker
                className="w-full"
                disabledDate={disableEndDate(createStartDate as Dayjs | undefined)}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </div>
          <Form.Item label="Descripción (opcional, máx 300 caracteres)" name="description">
            <Input.TextArea maxLength={300} rows={2} showCount />
          </Form.Item>
          <Form.Item label="Activa" name="active" valuePropName="checked">
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
        title="Editar oferta"
        width={560}
      >
        {editing?.imageUrl && (
          <div className="mb-4">
            <span className="text-sm text-gray-500">Imagen actual:</span>
            <Image
              className="mt-1"
              height={80}
              src={editing.imageUrl}
              style={{ objectFit: 'cover' }}
              width="100%"
            />
          </div>
        )}
        <Form form={editForm} layout="vertical">
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
                editImagePreview
                  ? [
                      {
                        uid: '-1',
                        name: 'imagen',
                        status: 'done',
                        url: editImagePreview,
                      },
                    ]
                  : []
              }
              listType="picture"
              showUploadList={{ showPreviewIcon: false }}
            >
              <Button icon={<UploadOutlined />}>Cambiar imagen</Button>
            </Upload>
            {editImagePreview && (
              <div className="mt-2">
                <Image
                  height={80}
                  src={editImagePreview}
                  style={{ objectFit: 'cover' }}
                  width="100%"
                />
              </div>
            )}
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              dependencies={['endDate']}
              label="Fecha de inicio"
              name="startDate"
              rules={startDateRules}
            >
              <DatePicker
                className="w-full"
                disabledDate={disableBeforeToday}
                format="DD/MM/YYYY"
                onChange={() => {
                  void editForm.validateFields(['endDate']);
                }}
              />
            </Form.Item>
            <Form.Item
              dependencies={['startDate']}
              label="Fecha de fin"
              name="endDate"
              rules={endDateRules(() => editStartDate as Dayjs | undefined)}
            >
              <DatePicker
                className="w-full"
                disabledDate={disableEndDate(editStartDate as Dayjs | undefined)}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </div>
          <Form.Item label="Descripción (opcional, máx 300 caracteres)" name="description">
            <Input.TextArea maxLength={300} rows={2} showCount />
          </Form.Item>
          <Form.Item label="Activa" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDeals;
