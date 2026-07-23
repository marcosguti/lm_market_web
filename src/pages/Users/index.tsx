import type { ColumnsType } from 'antd/es/table';

import { CheckCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
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
import { getStores, type Store } from '../../api/stores';
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
  admin: 'Administrador',
  client: 'Cliente',
  deliveryDriver: 'Reparto',
  superAdmin: 'Super administrador',
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const isSuper = currentUser?.type === 'superAdmin';

  const [data, setData] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
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
  const createType = Form.useWatch('type', createForm);
  const editType = Form.useWatch('type', editForm);

  const typeOptions = useMemo(() => {
    const base = [
      { label: 'Cliente', value: 'client' as const },
      { label: 'Reparto', value: 'deliveryDriver' as const },
    ];
    if (isSuper) {
      return [...base, { label: 'Administrador', value: 'admin' as const }];
    }
    return base;
  }, [isSuper]);

  const editTypeOptions = useMemo(() => {
    if (isSuper) {
      return [
        { label: 'Cliente', value: 'client' as const },
        { label: 'Reparto', value: 'deliveryDriver' as const },
        { label: 'Administrador', value: 'admin' as const },
      ];
    }
    return typeOptions;
  }, [isSuper, typeOptions]);

  const storeOptions = useMemo(
    () => stores.map((store) => ({ label: store.name, value: store.id })),
    [stores]
  );

  const storeNameById = useMemo(() => {
    const map = new Map(stores.map((store) => [store.id, store.name]));
    return map;
  }, [stores]);

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

  useEffect(() => {
    void getStores().then((loaded) => {
      setStores(loaded);
    });
  }, []);

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ numberIdType: 'V', type: 'client' });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    const needsStore = values.type === 'admin' || values.type === 'deliveryDriver';
    const res = await createAdminUser({
      ...values,
      address: values.address || undefined,
      phone: values.phone || undefined,
      storeId: isSuper && needsStore ? values.storeId : undefined,
    });
    if (!res.ok) {
      void message.error((res.data as { error?: string })?.error ?? 'No se pudo crear');
      return;
    }
    void message.success('Usuario creado correctamente');
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
      storeId: row.storeId ?? undefined,
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
    if (isSuper) {
      const nextType = editing.type === 'superAdmin' ? editing.type : values.type;
      if (nextType === 'admin' || nextType === 'deliveryDriver') {
        payload.storeId = values.storeId;
      } else {
        payload.storeId = null;
      }
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
      content: `¿Marcar el correo de ${row.firstName} ${row.lastName} (${row.email}) como verificado? El usuario podrá iniciar sesión sin ingresar el código.`,
      okText: 'Verificar',
      onOk: async () => {
        const res = await verifyAdminUserEmail(row.id);
        if (!res.ok) {
          void message.error((res.data as { error?: string })?.error ?? 'No se pudo verificar');
          return Promise.reject(new Error('verify failed'));
        }
        void message.success('Correo verificado');
        void load();
      },
      title: 'Verificar correo',
    });
  };

  const columns: ColumnsType<AdminUser> = [
    {
      dataIndex: 'email',
      key: 'email',
      render: (email: string, row) => (
        <div className="flex flex-col items-start gap-1">
          <span>{email}</span>
          <Tag color={row.emailVerified ? 'green' : 'orange'}>
            {row.emailVerified ? 'Verificado' : 'Pendiente'}
          </Tag>
        </div>
      ),
      title: 'Correo electrónico',
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
      key: 'store',
      render: (_, row) =>
        row.type === 'admin' || row.type === 'deliveryDriver'
          ? row.storeId
            ? (storeNameById.get(row.storeId) ?? row.storeId)
            : '—'
          : '—',
      title: 'Sede',
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
            <Tooltip title="Verificar correo">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                aria-label="Verificar correo"
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
            placeholder="Correo, nombre o CI"
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
        cancelText="Cancelar"
        destroyOnClose
        okText="Crear"
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreate()}
        open={createOpen}
        title="Nuevo usuario"
        width={520}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[
              { required: true, message: 'El correo es obligatorio' },
              { type: 'email', message: 'Ingresa un correo válido' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Nombre"
            name="firstName"
            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Apellido"
            name="lastName"
            rules={[{ required: true, message: 'El apellido es obligatorio' }]}
          >
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
              rules={[{ required: true, message: 'La identificación es obligatoria' }]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item
            label="Rol"
            name="type"
            rules={[{ required: true, message: 'Selecciona el rol' }]}
          >
            <Select options={typeOptions} />
          </Form.Item>
          {isSuper && (createType === 'admin' || createType === 'deliveryDriver') ? (
            <Form.Item
              label="Sede"
              name="storeId"
              rules={[{ required: true, message: 'Selecciona la sede' }]}
            >
              <Select options={storeOptions} placeholder="Selecciona sede" />
            </Form.Item>
          ) : null}
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
          <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 0 }}>
            La contraseña se genera automáticamente y se envía por email al usuario.
          </p>
        </Form>
      </Modal>

      <Modal
        cancelText="Cancelar"
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
          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[
              { required: true, message: 'El correo es obligatorio' },
              { type: 'email', message: 'Ingresa un correo válido' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Nombre"
            name="firstName"
            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Apellido"
            name="lastName"
            rules={[{ required: true, message: 'El apellido es obligatorio' }]}
          >
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
              rules={[{ required: true, message: 'La identificación es obligatoria' }]}
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
            <Form.Item
              label="Rol"
              name="type"
              rules={[{ required: true, message: 'Selecciona el rol' }]}
            >
              <Select options={editTypeOptions} />
            </Form.Item>
          )}
          {isSuper && (editType === 'admin' || editType === 'deliveryDriver') ? (
            <Form.Item
              label="Sede"
              name="storeId"
              rules={[{ required: true, message: 'Selecciona la sede' }]}
            >
              <Select options={storeOptions} placeholder="Selecciona sede" />
            </Form.Item>
          ) : null}
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
