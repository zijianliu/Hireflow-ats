import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Card, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { jobApi, authApi } from '../../api';
import { Job, User, JobStatus } from '../../types';
import { useAuthStore } from '../../store/auth';

const { TextArea } = Input;

const JobForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);
  const [jobData, setJobData] = useState<Job | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = !!id;

  useEffect(() => {
    fetchUsers();
    if (isEdit) {
      fetchJob();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await authApi.getUserList();
      setUserList(res.data.data.filter((u: User) => u.role === 'HR' || u.role === 'ADMIN'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await jobApi.getById(id!);
      setJobData(res.data.data);
      form.setFieldsValue({
        title: res.data.data.title,
        department: res.data.data.department,
        location: res.data.data.location,
        headcount: res.data.data.headcount,
        description: res.data.data.description,
        ownerId: res.data.data.ownerId,
        participantIds: res.data.data.participants?.map((p: User) => p.id),
      });
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await jobApi.update(id!, values);
        message.success('职位更新成功');
      } else {
        await jobApi.create({
          ...values,
          ownerId: values.ownerId || user?.id,
        });
        message.success('职位创建成功');
      }
      navigate('/jobs');
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const hrUsers = userList.filter((u) => u.role === 'HR' || u.role === 'ADMIN');
  const interviewerUsers = userList.filter((u) => u.role === 'INTERVIEWER' || u.role === 'ADMIN');

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/jobs')}
            style={{ marginRight: 8 }}
          />
          {isEdit ? '编辑职位' : '新增职位'}
        </h2>
      </div>
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              headcount: 1,
              ownerId: user?.id,
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Form.Item
                  label="职位名称"
                  name="title"
                  rules={[{ required: true, message: '请输入职位名称' }]}
                >
                  <Input placeholder="请输入职位名称" />
                </Form.Item>
                <Form.Item
                  label="所属部门"
                  name="department"
                  rules={[{ required: true, message: '请输入所属部门' }]}
                >
                  <Input placeholder="请输入所属部门" />
                </Form.Item>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Form.Item
                  label="工作地点"
                  name="location"
                  rules={[{ required: true, message: '请输入工作地点' }]}
                >
                  <Input placeholder="请输入工作地点" />
                </Form.Item>
                <Form.Item
                  label="招聘人数"
                  name="headcount"
                  rules={[
                    { required: true, message: '请输入招聘人数' },
                    { type: 'number', min: 1, message: '招聘人数必须大于0' },
                  ]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入招聘人数" />
                </Form.Item>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Form.Item
                  label="职位负责人"
                  name="ownerId"
                  rules={[{ required: true, message: '请选择职位负责人' }]}
                >
                  <Select
                    placeholder="请选择职位负责人"
                    options={hrUsers.map((u) => ({ value: u.id, label: u.name }))}
                  />
                </Form.Item>
                <Form.Item
                  label="参与人员"
                  name="participantIds"
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择参与人员"
                    options={interviewerUsers.map((u) => ({ value: u.id, label: u.name }))}
                  />
                </Form.Item>
              </div>
              <Form.Item
                label="职位描述"
                name="description"
                rules={[{ required: true, message: '请输入职位描述' }]}
              >
                <TextArea rows={6} placeholder="请输入职位描述" />
              </Form.Item>
            </Space>
            <Form.Item style={{ marginTop: 24 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {isEdit ? '保存' : '创建'}
                </Button>
                <Button onClick={() => navigate('/jobs')}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default JobForm;
