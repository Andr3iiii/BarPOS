import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  Button,
  Input,
  Select,
  Option,
  IconButton,
  Chip,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  FormControl,
  FormLabel,
  Stack,
  Divider,
  Alert,
  Switch
} from '@mui/joy';
import { Plus, Edit2, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';
import { fetchUsers, createUser, updateUser } from '../services/api';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAdd = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('cashier');
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword('');
    setFullName(u.full_name);
    setRole(u.role);
    setIsActive(u.is_active);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      if (editingUser) {
        await updateUser(editingUser.id, {
          full_name: fullName.trim(),
          role,
          is_active: isActive,
          ...(password && { password })
        });
      } else {
        if (!password) {
          setErrorMsg('Password is required for new users.');
          return;
        }
        await createUser({
          username: username.trim(),
          password,
          full_name: fullName.trim(),
          role
        });
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserActive = async (u: User) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography level="h2" sx={{ color: '#fff', fontWeight: 800 }}>
            User & Role Management
          </Typography>
          <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
            Control staff accounts for POS cashiers and system administrators
          </Typography>
        </Box>
        <Button
          size="md"
          variant="solid"
          onClick={openAdd}
          startDecorator={<UserPlus size={18} />}
          sx={{ bgcolor: '#e05624', color: '#fff', borderRadius: '12px', '&:hover': { bgcolor: '#c8461b' } }}
        >
          Add User Account
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ bgcolor: 'background.surface', borderColor: 'divider', p: 0, overflow: 'hidden' }}>
        <Table hoverRow sx={{ '& th': { bgcolor: 'background.level1', color: 'text.secondary' }, '& td': { color: 'text.primary' } }}>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Account Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Typography level="title-sm" sx={{ color: 'text.primary' }}>
                    {u.full_name}
                  </Typography>
                </td>
                <td>
                  <code>{u.username}</code>
                </td>
                <td>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={u.role === 'admin' ? 'primary' : 'neutral'}
                    startDecorator={u.role === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                  >
                    {u.role.toUpperCase()}
                  </Chip>
                </td>
                <td>
                  <Switch
                    checked={u.is_active}
                    onChange={() => toggleUserActive(u)}
                    color={u.is_active ? 'success' : 'neutral'}
                    endDecorator={
                      <Typography level="body-xs" sx={{ color: u.is_active ? '#10b981' : 'text.tertiary' }}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </Typography>
                    }
                  />
                </td>
                <td>
                  <IconButton size="sm" variant="plain" onClick={() => openEdit(u)} sx={{ color: 'primary.500' }}>
                    <Edit2 size={16} />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Add / Edit Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{ maxWidth: 440, width: '92vw', bgcolor: 'background.surface', borderColor: 'divider', color: 'text.primary' }}
        >
          <DialogTitle sx={{ color: 'text.primary' }}>{editingUser ? 'Edit User' : 'Create User Account'}</DialogTitle>
          <Divider sx={{ my: 1.5, borderColor: 'divider' }} />
          <DialogContent>
            {errorMsg && (
              <Alert color="danger" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}
            <form onSubmit={handleSave}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel sx={{ color: 'text.secondary' }}>Full Name</FormLabel>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                  />
                </FormControl>

                {!editingUser && (
                  <FormControl>
                    <FormLabel sx={{ color: 'text.secondary' }}>Username</FormLabel>
                    <Input
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                    />
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel sx={{ color: 'text.secondary' }}>
                    {editingUser ? 'Reset Password (leave blank to keep current)' : 'Password'}
                  </FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel sx={{ color: 'text.secondary' }}>Role</FormLabel>
                  <Select
                    value={role}
                    onChange={(_, val) => val && setRole(val as any)}
                    sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                  >
                    <Option value="cashier">Cashier (POS & Payments Only)</Option>
                    <Option value="admin">Administrator (Full Access)</Option>
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={() => setIsModalOpen(false)} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    type="submit"
                    loading={submitting}
                    sx={{ flex: 1, bgcolor: 'primary.solidBg', color: '#fff', '&:hover': { bgcolor: 'primary.solidHoverBg' } }}
                  >
                    Save User
                  </Button>
                </Stack>
              </Stack>
            </form>
          </DialogContent>
        </ModalDialog>
      </Modal>
    </Box>
  );
};
