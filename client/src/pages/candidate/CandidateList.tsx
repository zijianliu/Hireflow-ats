import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Row, Col, Spin } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { candidateApi, jobApi, authApi } from '../../api';
import {
  Candidate,
  CandidateStage,
  CandidateSource,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_STAGE_COLORS,
  CANDIDATE_SOURCE_LABELS,
  Job,
  User,
} from '../../types';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const CandidateList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobId, setJobId] = useState<string | undefined>();
  const [stage, setStage] = useState<CandidateStage | undefined>();
  const [source, setSource] = useState<CandidateSource | undefined>();
  const [jobList, setJobList] = useState<Job[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const jobIdFromUrl = searchParams.get('jobId');
    if (jobIdFromUrl) {
      setJobId(jobIdFromUrl);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (name) params.name = name;
      if (phone) params.phone = phone;
      if (email) params.email = email;
      if (jobId) params.jobId = jobId;
      if (stage) params.stage = stage;
      if (source) params.source = source;
      const res = await candidateApi.getList(params);
      setData(res.data.data.list);
      setTotal(res.data.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await jobApi.getList({ pageSize: 100 });
      setJobList(res.data.data.list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setJobId(undefined);
    setStage(undefined);
    setSource(undefined);
    setPage(1);
    setTimeout(fetchData, 0);
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Candidate) => (
        <a onClick={() => navigate(`/candidates/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '应聘职位',
      dataIndex: ['job', 'title'],
      key: 'job',
    },
    {
      title: '当前阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: CandidateStage) => (
        <Tag color={CANDIDATE_STAGE_COLORS[stage]}>{CANDIDATE_STAGE_LABELS[stage]}</Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: CandidateSource) => CANDIDATE_SOURCE_LABELS[source],
    },
    {
      title: '负责人',
      dataIndex: ['owner', 'name'],
      key: 'owner',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Candidate) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/candidates/${record.id}`)}
          >
            查看
          </Button>
          {(user?.role === 'HR' || user?.role === 'ADMIN') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/candidates/${record.id}/edit`)}
            >
              编辑
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">候选人管理</h2>
        {(user?.role === 'HR' || user?.role === 'ADMIN') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/candidates/new')}>
            新增候选人
          </Button>
        )}
      </div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="应聘职位"
            value={jobId}
            onChange={setJobId}
            style={{ width: '100%' }}
            allowClear
            options={jobList.map((j) => ({ value: j.id, label: j.title }))}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="当前阶段"
            value={stage}
            onChange={setStage}
            style={{ width: '100%' }}
            allowClear
            options={Object.entries(CANDIDATE_STAGE_LABELS).map(([key, label]) => ({
              value: key,
              label,
            }))}
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="候选人来源"
            value={source}
            onChange={setSource}
            style={{ width: '100%' }}
            allowClear
            options={Object.entries(CANDIDATE_SOURCE_LABELS).map(([key, label]) => ({
              value: key,
              label,
            }))}
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

export default CandidateList;
