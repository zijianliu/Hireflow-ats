import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Space, Card, message, Spin, Select } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { offerApi, candidateApi, jobApi } from '../../api';
import {
  Candidate,
  CandidateStage,
  Job,
} from '../../types';

const { TextArea } = Input;

const OfferForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidateList, setCandidateList] = useState<Candidate[]>([]);
  const [jobList, setJobList] = useState<Job[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');
    if (candidateId) {
      form.setFieldsValue({ candidateId });
    }
    if (jobId) {
      form.setFieldsValue({ jobId });
    }
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await candidateApi.getList({ pageSize: 100 });
      setCandidateList(
        res.data.data.list.filter((c: Candidate) => c.stage === CandidateStage.OFFER)
      );
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

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const data = {
        ...values,
        onboardDate: values.onboardDate.toISOString(),
      };
      await offerApi.create(data);
      message.success('Offer创建成功');
      navigate('/offers');
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/offers')}
            style={{ marginRight: 8 }}
          />
          创建Offer
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
              extra="仅显示处于Offer阶段的候选人"
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
              label="薪资范围"
              name="salaryRange"
              rules={[{ required: true, message: '请输入薪资范围' }]}
            >
              <Input placeholder="例如：15K-20K" />
            </Form.Item>
            <Form.Item
              label="入职日期"
              name="onboardDate"
              rules={[{ required: true, message: '请选择入职日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
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
                创建
              </Button>
              <Button onClick={() => navigate('/offers')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default OfferForm;
