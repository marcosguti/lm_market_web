import type { ColumnsType } from 'antd/es/table';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
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

import {
  type AdminBlogArticle,
  createAdminBlogArticle,
  deleteAdminBlogArticle,
  getAdminBlogArticles,
  patchAdminBlogArticle,
} from '../../api/blogArticles';
import RichTextEditor from '../../components/RichTextEditor';
import { getImagesFromHtmlAndNewHtml } from '../../utils/blogArticleHtmlImages';
import { formatDate } from '../../utils/formatDate';

const { Title } = Typography;

const BLOG_IMAGE_PREFIX = 'blog-article-content-image';

const AdminBlogArticles = () => {
  const [data, setData] = useState<AdminBlogArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBlogArticle | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createContent, setCreateContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [createContentEmpty, setCreateContentEmpty] = useState(true);
  const [editContentEmpty, setEditContentEmpty] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminBlogArticles();
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error((res.data as { error?: string })?.error ?? 'Error al cargar el blog');
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
    createForm.setFieldsValue({ active: true, title: '' });
    setCreateContent('');
    setCreateContentEmpty(true);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    if (createContentEmpty) {
      void message.error('El contenido es obligatorio');
      return;
    }

    setSaving(true);
    const { images, newHtml } = await getImagesFromHtmlAndNewHtml(createContent, BLOG_IMAGE_PREFIX);
    const res = await createAdminBlogArticle({
      active: values.active,
      content: newHtml,
      files: images,
      title: values.title.trim(),
    });
    setSaving(false);

    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo crear');
      return;
    }
    void message.success('Artículo creado');
    setCreateOpen(false);
    void load();
  };

  const openEdit = (row: AdminBlogArticle) => {
    setEditing(row);
    editForm.setFieldsValue({
      active: row.active,
      title: row.title,
    });
    setEditContent(row.content);
    setEditContentEmpty(false);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;
    if (editContentEmpty) {
      void message.error('El contenido es obligatorio');
      return;
    }

    setSaving(true);
    const { images, newHtml } = await getImagesFromHtmlAndNewHtml(editContent, BLOG_IMAGE_PREFIX);
    const res = await patchAdminBlogArticle(editing.id, {
      active: values.active,
      content: newHtml,
      files: images,
      title: values.title.trim(),
    });
    setSaving(false);

    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo guardar');
      return;
    }
    void message.success('Artículo actualizado');
    setEditOpen(false);
    setEditing(null);
    void load();
  };

  const onDelete = (row: AdminBlogArticle) => {
    Modal.confirm({
      cancelText: 'Cancelar',
      content: `¿Eliminar "${row.title}"? Las imágenes del contenido también se eliminarán.`,
      okText: 'Eliminar',
      okType: 'danger',
      onOk: async () => {
        const res = await deleteAdminBlogArticle(row.id);
        if (!res.ok) {
          void message.error((res.data as { error?: string })?.error ?? 'No se pudo eliminar');
          return;
        }
        void message.success('Artículo eliminado');
        void load();
      },
      title: 'Eliminar artículo',
    });
  };

  const columns: ColumnsType<AdminBlogArticle> = [
    {
      dataIndex: 'title',
      ellipsis: true,
      key: 'title',
      title: 'Título',
    },
    {
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Activo' : 'Inactivo'}</Tag>
      ),
      title: 'Estado',
      width: 110,
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => formatDate(value),
      title: 'Creado',
      width: 120,
    },
    {
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => openEdit(row)} type="text" />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(row)} type="text" />
          </Tooltip>
        </Space>
      ),
      title: 'Acciones',
      width: 110,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Title level={2} className="!mb-0">
          Blog
        </Title>
        <Button icon={<PlusOutlined />} onClick={openCreate} type="primary">
          Nuevo artículo
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: true }}
      />

      <Modal
        confirmLoading={saving}
        destroyOnHidden
        okText="Crear"
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreate()}
        open={createOpen}
        title="Nuevo artículo"
        width={800}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="Título"
            name="title"
            rules={[{ message: 'El título es obligatorio', required: true }]}
          >
            <Input maxLength={200} placeholder="Título del artículo" />
          </Form.Item>
          <Form.Item label="Activo" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Contenido" required>
            <RichTextEditor
              onChange={(html, isEmpty) => {
                setCreateContent(html);
                setCreateContentEmpty(isEmpty);
              }}
              placeholder="Escribe el contenido del artículo…"
              value={createContent}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        confirmLoading={saving}
        destroyOnHidden
        okText="Guardar"
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onOk={() => void submitEdit()}
        open={editOpen}
        title="Editar artículo"
        width={800}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Título"
            name="title"
            rules={[{ message: 'El título es obligatorio', required: true }]}
          >
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item label="Activo" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Contenido" required>
            <RichTextEditor
              onChange={(html, isEmpty) => {
                setEditContent(html);
                setEditContentEmpty(isEmpty);
              }}
              value={editContent}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBlogArticles;
