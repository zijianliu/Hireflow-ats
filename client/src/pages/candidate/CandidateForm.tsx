import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, Card, message, Spin } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { candidateApi, jobApi } from '../../api';
import {
  Candidate,
  CandidateSource,
  CANDIDATE_SOURCE_LABELS,
  Job,
  JobStatus,
} from '../../types';
import { useAuthStore } from '../../store/auth';

const { TextArea } = Input;

const CandidateForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobList, setJobList] = useState<Job[]>([]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchJobs();
    if (isEdit) {
      fetchCandidate();
    } else {
      const jobIdFromUrl = searchParams.get('jobId');
      if (jobIdFromUrl) {
        form.setFieldsValue({ jobId: jobIdFromUrl });
      }
    }
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await jobApi.getList({ pageSize: 100 });
      setJobList(res.data.data.list.filter((j: Job) => j.status !== JobStatus.CLOSED));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCandidate = async () => {
    setLoading(true);
    try {
      const res = await candidateApi.getById(id!);
      const data = res.data.data;
      form.setFieldsValue({
        name: data.name,
        phone: data.phone,
        email: data.email,
        resumeUrl: data.resumeUrl,
        source: data.source,
        jobId: data.jobId,
        remark: data.remark,
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
        await candidateApi.update(id!, values);
        message.success('候选人更新成功');
        navigate(`/candidates/${id}`);
      } else {
        await candidateApi.create({
          ...values,
          ownerId: user?.id,
        });
        message.success('候选人创建成功');
        navigate('/candidates');
      }
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sourceOptions = Object.entries(CANDIDATE_SOURCE_LABELS).map(([key, label]) => ({
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
            onClick={() => navigate('/candidates')}
            style={{ marginRight: 8 }}
          />
          {isEdit ? '编辑候选人' : '新增候选人'}
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
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入正确的邮箱格式' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item
                label="简历链接"
                name="resumeUrl"
              >
                <Input placeholder="请输入简历链接" />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Form.Item
                label="候选人来源"
                name="source"
                rules={[{ required: true, message: '请选择候选人来源' }]}
              >
                <Select
                  placeholder="请选择候选人来源"
                  options={sourceOptions}
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
            <Form.Item
              label="备注"
              name="remark"
            >
              <TextArea rows={4} placeholder="请输入备注" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {isEdit ? '保存' : '创建'}
                </Button>
                <Button onClick={() => navigate('/candidates')}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default CandidateForm;
