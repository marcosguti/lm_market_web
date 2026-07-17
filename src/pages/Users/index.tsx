import type { ColumnsType } from 'antd/es/table';

import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type AdminUser,
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  patchAdminUser,
  verifyAdminUserEmail,
} from '../../api/adminUsers';
import PhoneInput from '../../components/PhoneInput';
import { NUMBER_ID_TYPE_OPTIONS } from '../../constants/numberIdType';
import { useAuth } from '../../context/AuthContext';
import { isValidPhone } from '../../utils/phone';

const { Title } = Typography;

const typeColor: Record<string, string> = {
  admin: 'blue',
  client: 'default',
  deliveryDriver: 'purple',
  superAdmin: 'red',
};

const typeLabel: Record<string, string> = {
  admin: 'Admin',
  client: 'Cliente',
  deliveryDriver: 'Reparto',
  superAdmin: 'Super admin',
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const isSuper = currentUser?.type === 'superAdmin';

  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const typeOptions = useMemo(() => {
    const base = [
      { label: 'Cliente', value: 'client' as const },
      { label: 'Reparto', value: 'deliveryDriver' as const },
    ];
    if (isSuper) {
      return [...base, { label: 'Admin', value: 'admin' as const }];
    }
    return base;
  }, [isSuper]);

  const editTypeOptions = useMemo(() => {
    if (isSuper) {
      return [
        { label: 'Cliente', value: 'client' as const },
        { label: 'Reparto', value: 'deliveryDriver' as const },
        { label: 'Admin', value: 'admin' as const },
      ];
    }
    return typeOptions;
  }, [isSuper, typeOptions]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminUsers(page, pageSize, search || undefined);
    setLoading(false);
    if (!res.ok || !res.data?.data) {
      void message.error((res.data as { error?: string })?.error ?? 'Error al cargar usuarios');
      return;
    }
    setData(res.data.data);
    setTotal(res.data.total);
  }, [page, pageSize, search]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ numberIdType: 'V', type: 'client' });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    const res = await createAdminUser({
      ...values,
      address: values.address || undefined,
      phone: values.phone || undefined,
      password: values.password || undefined,
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo crear');
      return;
    }
    void message.success('Usuario creado');
    if (res.data?.temporaryPassword) {
      Modal.info({
        content: (
          <p>
            Clave temporal: <strong>{res.data.temporaryPassword}</strong>
          </p>
        ),
        title: 'Contraseña temporal',
      });
    }
    setCreateOpen(false);
    void load();
  };

  const openEdit = (row: AdminUser) => {
    setEditing(row);
    const base = {
      address: row.address ?? '',
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      numberId: row.numberId,
      numberIdType: row.numberIdType,
      phone: row.phone ?? '',
    };
    editForm.setFieldsValue(row.type === 'superAdmin' ? base : { ...base, type: row.type });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;
    const payload: Parameters<typeof patchAdminUser>[1] = {
      address: values.address,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      numberId: values.numberId,
      numberIdType: values.numberIdType,
      phone: values.phone,
    };
    if (editing.type !== 'superAdmin') {
      payload.type = values.type;
    }
    const res = await patchAdminUser(editing.id, payload);
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo guardar');
      return;
    }
    void message.success('Usuario actualizado');
    setEditOpen(false);
    setEditing(null);
    void load();
  };

  const confirmDelete = (row: AdminUser) => {
    Modal.confirm({
      cancelText: 'Cancelar',
      content: `¿Eliminar a ${row.firstName} ${row.lastName} (${row.email})? Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      onOk: async () => {
        const res = await deleteAdminUser(row.id);
        if (!res.ok) {
          void message.error((res.data as { error?: string })?.error ?? 'No se pudo eliminar');
          return Promise.reject(new Error('delete failed'));
        }
        void message.success('Usuario eliminado');
        void load();
      },
      title: 'Eliminar usuario',
    });
  };

  const confirmVerifyEmail = (row: AdminUser) => {
    Modal.confirm({
      cancelText: 'Cancelar',
      content: `¿Marcar el email de ${row.firstName} ${row.lastName} (${row.email}) como verificado? El usuario podrá iniciar sesión sin ingresar el código.`,
      okText: 'Verificar',
      onOk: async () => {
        const res = await verifyAdminUserEmail(row.id);
        if (!res.ok) {
          void message.error((res.data as { error?: string })?.error ?? 'No se pudo verificar');
          return Promise.reject(new Error('verify failed'));
        }
        void message.success('Email verificado');
        void load();
      },
      title: 'Verificar email',
    });
  };

  const columns: ColumnsType<AdminUser> = [
    {
      dataIndex: 'email',
      key: 'email',
      render: (email: string, row) => (
        <div className="flex flex-col gap-1">
          <span>{email}</span>
          <Tag color={row.emailVerified ? 'green' : 'orange'}>
            {row.emailVerified ? 'Verificado' : 'Pendiente'}
          </Tag>
        </div>
      ),
      title: 'Email',
    },
    {
      key: 'name',
      render: (_, row) => `${row.firstName} ${row.lastName}`,
      title: 'Nombre',
    },
    {
      dataIndex: 'numberId',
      key: 'numberId',
      render: (_: string, row) => `${row.numberIdType}-${row.numberId}`,
      title: 'CI / ID',
    },
    {
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag color={typeColor[t] ?? 'default'}>{typeLabel[t] ?? t}</Tag>,
      title: 'Rol',
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
              aria-label="Editar usuario"
              onClick={() => openEdit(row)}
            />
          </Tooltip>
          {!row.emailVerified ? (
            <Tooltip title="Verificar email">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                aria-label="Verificar email"
                onClick={() => confirmVerifyEmail(row)}
              />
            </Tooltip>
          ) : null}
          {currentUser?.id !== row.id ? (
            <Tooltip title="Eliminar">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label="Eliminar usuario"
                onClick={() => confirmDelete(row)}
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
      title: 'Acciones',
      width: 120,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Title className="!mb-0" level={2}>
          Usuarios
        </Title>
        <Space wrap>
          <Input.Search
            allowClear
            enterButton="Buscar"
            placeholder="Email, nombre o CI"
            style={{ maxWidth: 320 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <Button type="primary" onClick={openCreate}>
            Nuevo usuario
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
        title="Nuevo usuario"
        width={520}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Nombre" name="firstName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Apellido" name="lastName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="flex items-end gap-3">
            <Form.Item
              className="mb-0 w-[90px] shrink-0"
              label="Tipo ID"
              name="numberIdType"
              rules={[{ required: true, message: 'Selecciona el tipo' }]}
            >
              <Select options={[...NUMBER_ID_TYPE_OPTIONS]} placeholder="Tipo" />
            </Form.Item>
            <Form.Item
              className="mb-0 flex-1"
              label="CI / ID"
              name="numberId"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item label="Rol" name="type" rules={[{ required: true }]}>
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item
            label="Teléfono"
            name="phone"
            rules={[
              {
                validator: async (_, value?: string) => {
                  if (!value) return;
                  if (!isValidPhone(value)) {
                    throw new Error('Ingresa un teléfono válido');
                  }
                },
              },
            ]}
          >
            <PhoneInput />
          </Form.Item>
          <Form.Item label="Dirección" name="address">
            <Input />
          </Form.Item>
          <Form.Item
            extra="Si lo dejas vacío se usará #123456"
            label="Contraseña (opcional)"
            name="password"
            rules={[
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                message: 'Debe incluir mayúsculas, minúsculas y números (mínimo 8 caracteres)',
              },
            ]}
          >
            <Input.Password />
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
        title="Editar usuario"
        width={520}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Nombre" name="firstName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Apellido" name="lastName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="flex items-end gap-3">
            <Form.Item
              className="mb-0 w-[90px] shrink-0"
              label="Tipo ID"
              name="numberIdType"
              rules={[{ required: true, message: 'Selecciona el tipo' }]}
            >
              <Select options={[...NUMBER_ID_TYPE_OPTIONS]} placeholder="Tipo" />
            </Form.Item>
            <Form.Item
              className="mb-0 flex-1"
              label="CI / ID"
              name="numberId"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </div>
          {editing?.type === 'superAdmin' ? (
            <Form.Item label="Rol">
              <Tag color={typeColor.superAdmin}>{typeLabel.superAdmin}</Tag>
              <span className="ml-2 text-xs text-gray-500">El rol no puede modificarse</span>
            </Form.Item>
          ) : (
            <Form.Item label="Rol" name="type" rules={[{ required: true }]}>
              <Select options={editTypeOptions} />
            </Form.Item>
          )}
          <Form.Item
            label="Teléfono"
            name="phone"
            rules={[
              {
                validator: async (_, value?: string) => {
                  if (!value) return;
                  if (!isValidPhone(value)) {
                    throw new Error('Ingresa un teléfono válido');
                  }
                },
              },
            ]}
          >
            <PhoneInput />
          </Form.Item>
          <Form.Item label="Dirección" name="address">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
