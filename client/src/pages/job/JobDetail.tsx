import React, { useState, useEffect } from 'react';
import { Descriptions, Tag, Button, Space, Card, Spin, message, Popconfirm, Table } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, EditOutlined, StopOutlined, PlayCircleOutlined, PauseCircleOutlined, UserAddOutlined } from '@ant-design/icons';
import { jobApi } from '../../api';
import { Job, JobStatus, JOB_STATUS_LABELS, JOB_STATUS_COLORS, Candidate, CANDIDATE_STAGE_LABELS, CANDIDATE_STAGE_COLORS } from '../../types';
import dayjs from 'dayjs';
import { candidateApi } from '../../api';

const JobDetail: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJob();
    fetchCandidates();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await jobApi.getById(id!);
      setJob(res.data.data);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await candidateApi.getList({ jobId: id, pageSize: 100 });
      setCandidates(res.data.data.list);
    } catch (err) {
      console.error(err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      await jobApi.close(id!);
      message.success('职位已关闭');
      fetchJob();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const handleReopen = async () => {
    try {
      await jobApi.reopen(id!);
      message.success('职位已重新开放');
      fetchJob();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const handlePause = async () => {
    try {
      await jobApi.pause(id!);
      message.success('职位已暂停');
      fetchJob();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const candidateColumns = [
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
      title: '当前阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => (
        <Tag color={CANDIDATE_STAGE_COLORS[stage as keyof typeof CANDIDATE_STAGE_COLORS]}>
          {CANDIDATE_STAGE_LABELS[stage as keyof typeof CANDIDATE_STAGE_LABELS]}
        </Tag>
      ),
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
  ];

  if (loading || !job) {
    return (
      <div className="loading-container">
        <Spin />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/jobs')}
          />
          <h2 className="page-title">职位详情</h2>
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/jobs/${id}/edit`)}>
            编辑
          </Button>
          <Button icon={<UserAddOutlined />} type="primary" onClick={() => navigate(`/candidates/new?jobId=${id}`)}>
            新增候选人
          </Button>
          {job.status === JobStatus.RECRUITING && (
            <>
              <Button icon={<PauseCircleOutlined />} onClick={handlePause}>
                暂停
              </Button>
              <Popconfirm title="确定关闭该职位？" onConfirm={handleClose}>
                <Button danger icon={<StopOutlined />}>
                  关闭
                </Button>
              </Popconfirm>
            </>
          )}
          {(job.status === JobStatus.PAUSED || job.status === JobStatus.CLOSED) && (
            <Button icon={<PlayCircleOutlined />} type="primary" onClick={handleReopen}>
              {job.status === JobStatus.CLOSED ? '重新开放' : '恢复'}
            </Button>
          )}
        </Space>
      </div>

      <div className="detail-section">
        <Card title="职位信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="职位名称">{job.title}</Descriptions.Item>
            <Descriptions.Item label="所属部门">{job.department}</Descriptions.Item>
            <Descriptions.Item label="工作地点">{job.location}</Descriptions.Item>
            <Descriptions.Item label="招聘人数">{job.headcount}人</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={JOB_STATUS_COLORS[job.status]}>{JOB_STATUS_LABELS[job.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="负责人">{job.owner?.name}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(job.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(job.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="参与人员" span={2}>
              {job.participants?.map((p) => p.name).join('、') || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="职位描述" span={2}>
              {job.description}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      <div className="detail-section">
        <Card title="候选人列表">
          <Table
            rowKey="id"
            loading={candidatesLoading}
            dataSource={candidates}
            columns={candidateColumns}
            pagination={false}
          />
        </Card>
      </div>
    </div>
  );
};

export default JobDetail;
