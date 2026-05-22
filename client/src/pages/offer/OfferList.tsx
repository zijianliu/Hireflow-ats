import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Row, Col, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { offerApi, jobApi } from '../../api';
import {
  Offer,
  OfferStatus,
  OFFER_STATUS_LABELS,
  OFFER_STATUS_COLORS,
  Job,
} from '../../types';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const OfferList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [candidateName, setCandidateName] = useState('');
  const [jobId, setJobId] = useState<string | undefined>();
  const [status, setStatus] = useState<OfferStatus | undefined>();
  const [jobList, setJobList] = useState<Job[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (jobId) params.jobId = jobId;
      if (status) params.status = status;
      const res = await offerApi.getList(params);
      let list = res.data.data.list;
      if (candidateName) {
        list = list.filter((o: Offer) =>
          o.candidate.name.includes(candidateName)
        );
      }
      setData(list);
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
    setCandidateName('');
    setJobId(undefined);
    setStatus(undefined);
    setPage(1);
    setTimeout(fetchData, 0);
  };

  const handleStatusChange = async (id: string, newStatus: OfferStatus) => {
    try {
      await offerApi.updateStatus(id, newStatus);
      message.success('状态更新成功');
      fetchData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: ['candidate', 'name'],
      key: 'candidate',
    },
    {
      title: '应聘职位',
      dataIndex: ['job', 'title'],
      key: 'job',
    },
    {
      title: '薪资范围',
      dataIndex: 'salaryRange',
      key: 'salaryRange',
    },
    {
      title: '入职日期',
      dataIndex: 'onboardDate',
      key: 'onboardDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OfferStatus) => (
        <Tag color={OFFER_STATUS_COLORS[status]}>
          {OFFER_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
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
      render: (_: any, record: Offer) => (
        <Space size="small">
          {record.status === OfferStatus.PENDING && (
            <>
              <Popconfirm
                title="确定接受该Offer？"
                onConfirm={() => handleStatusChange(record.id, OfferStatus.ACCEPTED)}
              >
                <Button type="link" size="small">接受</Button>
              </Popconfirm>
              <Popconfirm
                title="确定拒绝该Offer？"
                onConfirm={() => handleStatusChange(record.id, OfferStatus.REJECTED)}
              >
                <Button type="link" size="small" danger>拒绝</Button>
              </Popconfirm>
              <Popconfirm
                title="确定撤回该Offer？"
                onConfirm={() => handleStatusChange(record.id, OfferStatus.WITHDRAWN)}
              >
                <Button type="link" size="small">撤回</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Offer管理</h2>
        {(user?.role === 'HR' || user?.role === 'ADMIN') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/offers/new')}>
            创建Offer
          </Button>
        )}
      </div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="候选人姓名"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
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
        <Col span={6}>
          <Select
            placeholder="状态"
            value={status}
            onChange={setStatus}
            style={{ width: '100%' }}
            allowClear
            options={Object.entries(OFFER_STATUS_LABELS).map(([key, label]) => ({
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

export default OfferList;
