import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  ScheduleOutlined,
  GiftOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ROLE_LABELS } from '../types';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '统计看板',
      roles: ['HR', 'ADMIN'],
    },
    {
      key: '/jobs',
      icon: <TeamOutlined />,
      label: '职位管理',
      roles: ['HR', 'ADMIN'],
    },
    {
      key: '/candidates',
      icon: <UserOutlined />,
      label: '候选人管理',
      roles: ['HR', 'ADMIN'],
    },
    {
      key: '/interviews',
      icon: <ScheduleOutlined />,
      label: '面试安排',
      roles: ['HR', 'ADMIN', 'INTERVIEWER'],
    },
    {
      key: '/offers',
      icon: <GiftOutlined />,
      label: 'Offer管理',
      roles: ['HR', 'ADMIN'],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 600 }}>
          HireFlow ATS
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={userMenu}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
              <span style={{ color: '#999', fontSize: 12 }}>
                ({user?.role ? ROLE_LABELS[user.role] : ''})
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, background: '#fff', padding: 24, minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
