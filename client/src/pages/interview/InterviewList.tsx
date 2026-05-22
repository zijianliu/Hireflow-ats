import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, DatePicker, message, Row, Col, Modal, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { interviewApi, jobApi, authApi } from '../../api';
import {
  Interview,
  InterviewRound,
  InterviewMethod,
  InterviewStatus,
  INTERVIEW_ROUND_LABELS,
  INTERVIEW_METHOD_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_COLORS,
  Job,
  User,
} from '../../types';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';
import { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

const InterviewList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Interview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [interviewerId, setInterviewerId] = useState<string | undefined>();
  const [candidateName, setCandidateName] = useState('');
  const [jobId, setJobId] = useState<string | undefined>();
  const [status, setStatus] = useState<InterviewStatus | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [jobList, setJobList] = useState<Job[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (interviewerId) params.interviewerId = interviewerId;
      if (jobId) params.jobId = jobId;
      if (status) params.status = status;
      if (dateRange && dateRange.length === 2) {
        params.startTimeFrom = dateRange[0].toISOString();
        params.startTimeTo = dateRange[1].toISOString();
      }
      const res = await interviewApi.getList(params);
      let list = res.data.data.list;
      if (candidateName) {
        list = list.filter((i: Interview) =>
          i.candidate.name.includes(candidateName)
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
    fetchJobs();
    fetchUsers();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setInterviewerId(undefined);
    setCandidateName('');
    setJobId(undefined);
    setStatus(undefined);
    setDateRange(null);
    setPage(1);
    setTimeout(fetchData, 0);
  };

  const handleCancel = async (id: string) => {
    try {
      await interviewApi.cancel(id);
      message.success('面试已取消');
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
      title: '面试轮次',
      dataIndex: 'round',
      key: 'round',
      render: (round: InterviewRound) => INTERVIEW_ROUND_LABELS[round],
    },
    {
      title: '面试官',
      dataIndex: ['interviewer', 'name'],
      key: 'interviewer',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '面试方式',
      dataIndex: 'method',
      key: 'method',
      render: (method: InterviewMethod) => INTERVIEW_METHOD_LABELS[method],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: InterviewStatus) => (
        <Tag color={INTERVIEW_STATUS_COLORS[status]}>
          {INTERVIEW_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Interview) => (
        <Space size="small">
          {record.status === InterviewStatus.PENDING && user?.role === 'INTERVIEWER' && record.interviewerId === user?.id && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/interviews/${record.id}/evaluate`)}
            >
              提交评价
            </Button>
          )}
          {record.status === InterviewStatus.PENDING && (user?.role === 'HR' || user?.role === 'ADMIN') && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleCancel(record.id)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < dayjs().startOf('day');
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">面试安排</h2>
        {(user?.role === 'HR' || user?.role === 'ADMIN') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/interviews/new')}>
            安排面试
          </Button>
        )}
      </div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="面试官"
            value={interviewerId}
            onChange={setInterviewerId}
            style={{ width: '100%' }}
            allowClear
            options={userList
              .filter((u) => u.role === 'INTERVIEWER' || u.role === 'HR' || u.role === 'ADMIN')
              .map((u) => ({ value: u.id, label: u.name }))}
          />
        </Col>
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
            options={Object.entries(INTERVIEW_STATUS_LABELS).map(([key, label]) => ({
              value: key,
              label,
            }))}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <RangePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            placeholder={['开始时间', '结束时间']}
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: '100%' }}
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

export default InterviewList;
