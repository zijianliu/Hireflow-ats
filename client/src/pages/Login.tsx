import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { User } from '../types';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.username, values.password);
      const { token, user } = res.data.data;
      setToken(token);
      setUser(user as User);
      message.success('登录成功');
      if (user.role === 'INTERVIEWER') {
        navigate('/interviews');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">HireFlow ATS</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
          招聘管理系统
        </p>
        <Form
          name="login"
          onFinish={onFinish}
          initialValues={{ username: 'admin', password: '123456' }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
          <p>测试账号：</p>
          <p>管理员: admin / 123456</p>
          <p>HR: hr001 / 123456</p>
          <p>面试官: tech001 / 123456</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
