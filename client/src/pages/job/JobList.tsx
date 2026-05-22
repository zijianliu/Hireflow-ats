import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, Popconfirm, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { jobApi } from '../../api';
import { Job, JobStatus, JOB_STATUS_LABELS, JOB_STATUS_COLORS, User } from '../../types';
import { useAuthStore } from '../../store/auth';
import { authApi } from '../../api';

const JobList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<JobStatus | undefined>();
  const [userList, setUserList] = useState<User[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (title) params.title = title;
      if (department) params.department = department;
      if (location) params.location = location;
      if (status) params.status = status;
      const res = await jobApi.getList(params);
      setData(res.data.data.list);
      setTotal(res.data.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authApi.getUserList();
      setUserList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setTitle('');
    setDepartment('');
    setLocation('');
    setStatus(undefined);
    setPage(1);
    setTimeout(fetchData, 0);
  };

  const handleClose = async (id: string) => {
    try {
      await jobApi.close(id);
      message.success('职位已关闭');
      fetchData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await jobApi.reopen(id);
      message.success('职位已重新开放');
      fetchData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await jobApi.pause(id);
      message.success('职位已暂停');
      fetchData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: '职位名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Job) => (
        <a onClick={() => navigate(`/jobs/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '工作地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '招聘人数',
      dataIndex: 'headcount',
      key: 'headcount',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: JobStatus) => (
        <Tag color={JOB_STATUS_COLORS[status]}>{JOB_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: ['owner', 'name'],
      key: 'owner',
    },
    {
      title: '候选人数',
      dataIndex: ['_count', 'candidates'],
      key: 'candidateCount',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Job) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/jobs/${record.id}/edit`)}
          >
            编辑
          </Button>
          {record.status === JobStatus.RECRUITING && (
            <>
              <Button
                type="link"
                size="small"
                danger
                icon={<PauseCircleOutlined />}
                onClick={() => handlePause(record.id)}
              >
                暂停
              </Button>
              <Popconfirm title="确定关闭该职位？" onConfirm={() => handleClose(record.id)}>
                <Button type="link" size="small" danger icon={<StopOutlined />}>
                  关闭
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === JobStatus.PAUSED && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleReopen(record.id)}
            >
              恢复
            </Button>
          )}
          {record.status === JobStatus.CLOSED && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleReopen(record.id)}
            >
              重新开放
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">职位管理</h2>
        {(user?.role === 'HR' || user?.role === 'ADMIN') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/jobs/new')}>
            新增职位
          </Button>
        )}
      </div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="职位名称"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="部门"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="工作地点"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="状态"
            value={status}
            onChange={setStatus}
            style={{ width: '100%' }}
            allowClear
            options={[
              { value: JobStatus.RECRUITING, label: '招聘中' },
              { value: JobStatus.PAUSED, label: '已暂停' },
              { value: JobStatus.CLOSED, label: '已关闭' },
            ]}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={handleReset}>
            重置
          </Button>
        </Col>
      </Row>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
};

export default JobList;
