import type { ColumnsType } from 'antd/es/table';

import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
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
import { useCallback, useEffect, useState } from 'react';

import {
  type AdminBanner,
  createAdminBanner,
  deleteAdminBanner,
  getAdminBanners,
  patchAdminBanner,
} from '../../api/banners';
import {
  BANNER_IMAGE_MAX_RATIO,
  BANNER_IMAGE_MIN_HEIGHT,
  BANNER_IMAGE_MIN_RATIO,
  BANNER_IMAGE_MIN_WIDTH,
  validateBannerImage,
} from '../../utils/bannerImageValidation';

const { Title } = Typography;

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_SIZE_KB = 1024 * 2;
const BANNER_IMAGE_LABEL = `Imagen horizontal (${BANNER_IMAGE_MIN_RATIO}:1 a ${BANNER_IMAGE_MAX_RATIO}:1), mínimo ${BANNER_IMAGE_MIN_WIDTH}x${BANNER_IMAGE_MIN_HEIGHT}px, máx ${MAX_SIZE_KB}KB (jpg, png, webp)`;

const handleBannerImageUpload = async (
  file: File,
  onValid: (file: File, previewUrl: string) => void
): Promise<typeof Upload.LIST_IGNORE | false> => {
  if (file.size > MAX_SIZE_KB * 1024) {
    void message.error(`La imagen debe ser menor a ${MAX_SIZE_KB}KB`);
    return Upload.LIST_IGNORE;
  }

  try {
    await validateBannerImage(file);
    onValid(file, URL.createObjectURL(file));
    return false;
  } catch (error) {
    void message.error(error instanceof Error ? error.message : 'Imagen inválida');
    return Upload.LIST_IGNORE;
  }
};

const AdminBanners = () => {
  const [data, setData] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string>('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminBanners();
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error((res.data as { error?: string })?.error ?? 'Error al cargar banners');
      return;
    }
    setData(res.data.data);
  }, []);

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
    const res = await createAdminBanner({
      active: values.active,
      description: values.description?.trim() ? values.description.trim() : null,
      imageFile: createImageFile,
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo crear');
      return;
    }
    void message.success('Banner creado');
    setCreateOpen(false);
    void load();
  };

  const openEdit = (row: AdminBanner) => {
    setEditing(row);
    editForm.setFieldsValue({
      active: row.active,
      description: row.description ?? '',
    });
    setEditImageFile(null);
    setEditImagePreview('');
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;
    const res = await patchAdminBanner(editing.id, {
      active: values.active,
      description: values.description?.trim() ? values.description.trim() : null,
      imageFile: editImageFile || undefined,
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo guardar');
      return;
    }
    void message.success('Banner actualizado');
    setEditOpen(false);
    setEditing(null);
    void load();
  };

  const confirmDelete = (row: AdminBanner) => {
    Modal.confirm({
      cancelText: 'Cancelar',
      content: '¿Eliminar este banner? Dejará de mostrarse en el carrusel de la home.',
      okText: 'Eliminar',
      okType: 'danger',
      onOk: async () => {
        const res = await deleteAdminBanner(row.id);
        if (!res.ok) {
          void message.error((res.data as { error?: string })?.error ?? 'No se pudo eliminar');
          return Promise.reject(new Error('delete failed'));
        }
        void message.success('Banner eliminado');
        void load();
      },
      title: 'Eliminar banner',
    });
  };

  const columns: ColumnsType<AdminBanner> = [
    {
      key: 'thumb',
      render: (_, row) =>
        row.imageUrl ? (
          <Image alt="" height={48} src={row.imageUrl} width={96} style={{ objectFit: 'cover' }} />
        ) : (
          <span className="text-gray-400">—</span>
        ),
      title: 'Imagen',
      width: 112,
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
        <Tag color={a ? 'green' : 'default'}>{a ? 'Activo' : 'Inactivo'}</Tag>
      ),
      title: 'Estado',
      width: 100,
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
      width: 140,
    },
  ];

  const renderImageUpload = (
    preview: string,
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void,
    buttonLabel: string
  ) => (
    <>
      <Upload
        accept={IMAGE_ACCEPT}
        beforeUpload={(file) =>
          handleBannerImageUpload(file, (validFile, previewUrl) => {
            setFile(validFile);
            setPreview(previewUrl);
          })
        }
        maxCount={1}
        onRemove={() => {
          setFile(null);
          setPreview('');
        }}
        fileList={
          preview
            ? [
                {
                  name: 'imagen',
                  status: 'done',
                  uid: '-1',
                  url: preview,
                },
              ]
            : []
        }
        listType="picture"
        showUploadList={{ showPreviewIcon: false }}
      >
        <Button icon={<UploadOutlined />}>{buttonLabel}</Button>
      </Upload>
      {preview && (
        <div className="mt-2 w-full overflow-hidden rounded-lg">
          <div className="relative aspect-[16/9] w-full">
            <img
              alt="Vista previa del banner"
              className="block h-full w-full object-cover object-center"
              src={preview}
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Title className="!mb-0" level={2}>
          Banners
        </Title>
        <Button type="primary" onClick={openCreate}>
          Nuevo banner
        </Button>
      </div>

      <Table columns={columns} dataSource={data} loading={loading} pagination={false} rowKey="id" />

      <Modal
        cancelText="Cancelar"
        destroyOnHidden
        okText="Crear"
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreate()}
        open={createOpen}
        title="Nuevo banner"
        width={560}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label={BANNER_IMAGE_LABEL}>
            {renderImageUpload(
              createImagePreview,
              setCreateImageFile,
              setCreateImagePreview,
              'Seleccionar imagen'
            )}
          </Form.Item>
          <Form.Item
            label="Descripción (opcional, máx 300 caracteres)"
            name="description"
            rules={[{ max: 300, message: 'Máximo 300 caracteres' }]}
          >
            <Input.TextArea maxLength={300} rows={2} showCount />
          </Form.Item>
          <Form.Item label="Activo" name="active" valuePropName="checked">
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
        title="Editar banner"
        width={560}
      >
        {editing?.imageUrl && (
          <div className="mb-4">
            <span className="text-sm text-gray-500">Imagen actual:</span>
            <div className="mt-1 w-full overflow-hidden rounded-lg">
              <div className="relative aspect-[16/9] w-full">
                <img
                  alt="Imagen actual del banner"
                  className="block h-full w-full object-cover object-center"
                  src={editing.imageUrl}
                />
              </div>
            </div>
          </div>
        )}
        <Form form={editForm} layout="vertical">
          <Form.Item label={BANNER_IMAGE_LABEL}>
            {renderImageUpload(
              editImagePreview,
              setEditImageFile,
              setEditImagePreview,
              'Cambiar imagen'
            )}
          </Form.Item>
          <Form.Item
            label="Descripción (opcional, máx 300 caracteres)"
            name="description"
            rules={[{ max: 300, message: 'Máximo 300 caracteres' }]}
          >
            <Input.TextArea maxLength={300} rows={2} showCount />
          </Form.Item>
          <Form.Item label="Activo" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBanners;
