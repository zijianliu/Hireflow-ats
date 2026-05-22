import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Card, message, Spin, Row, Col } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { interviewApi, candidateApi, jobApi, authApi } from '../../api';
import {
  Interview,
  InterviewRound,
  INTERVIEW_ROUND_LABELS,
  InterviewMethod,
  INTERVIEW_METHOD_LABELS,
  Candidate,
  Job,
  User,
} from '../../types';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const { TextArea } = Input;

const InterviewForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidateList, setCandidateList] = useState<Candidate[]>([]);
  const [jobList, setJobList] = useState<Job[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
    fetchUsers();
    const candidateId = searchParams.get('candidateId');
    if (candidateId) {
      form.setFieldsValue({ candidateId });
    }
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await candidateApi.getList({ pageSize: 100 });
      setCandidateList(res.data.data.list);
    } catch (err) {
      console.error(err);
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
      setUserList(res.data.data.filter((u: User) => u.role === 'INTERVIEWER' || u.role === 'HR' || u.role === 'ADMIN'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const data = {
        ...values,
        startTime: values.timeRange[0].toISOString(),
        endTime: values.timeRange[1].toISOString(),
      };
      delete data.timeRange;
      await interviewApi.create(data);
      message.success('面试安排成功');
      navigate('/interviews');
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const roundOptions = Object.entries(INTERVIEW_ROUND_LABELS).map(([key, label]) => ({
    value: key,
    label,
  }));

  const methodOptions = Object.entries(INTERVIEW_METHOD_LABELS).map(([key, label]) => ({
    value: key,
    label,
  }));

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/interviews')}
            style={{ marginRight: 8 }}
          />
          安排面试
        </h2>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Form.Item
              label="候选人"
              name="candidateId"
              rules={[{ required: true, message: '请选择候选人' }]}
            >
              <Select
                placeholder="请选择候选人"
                showSearch
                optionFilterProp="label"
                options={candidateList.map((c) => ({
                  value: c.id,
                  label: `${c.name} - ${c.job?.title}`,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="应聘职位"
              name="jobId"
              rules={[{ required: true, message: '请选择应聘职位' }]}
            >
              <Select
                placeholder="请选择应聘职位"
                options={jobList.map((j) => ({ value: j.id, label: j.title }))}
              />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Form.Item
              label="面试轮次"
              name="round"
              rules={[{ required: true, message: '请选择面试轮次' }]}
            >
              <Select
                placeholder="请选择面试轮次"
                options={roundOptions}
              />
            </Form.Item>
            <Form.Item
              label="面试官"
              name="interviewerId"
              rules={[{ required: true, message: '请选择面试官' }]}
            >
              <Select
                placeholder="请选择面试官"
                options={userList.map((u) => ({ value: u.id, label: u.name }))}
              />
            </Form.Item>
          </div>
          <Form.Item
            label="面试时间"
            name="timeRange"
            rules={[{ required: true, message: '请选择面试时间' }]}
          >
            <DatePicker.RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Form.Item
              label="面试方式"
              name="method"
              rules={[{ required: true, message: '请选择面试方式' }]}
            >
              <Select
                placeholder="请选择面试方式"
                options={methodOptions}
              />
            </Form.Item>
            <Form.Item
              label="会议链接或地点"
              name="location"
            >
              <Input placeholder="请输入会议链接或地点" />
            </Form.Item>
          </div>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                创建
              </Button>
              <Button onClick={() => navigate('/interviews')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default InterviewForm;
