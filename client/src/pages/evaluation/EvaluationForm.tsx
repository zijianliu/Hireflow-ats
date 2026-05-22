import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Rate, Button, Space, Card, message, Spin, Descriptions, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { evaluationApi, interviewApi } from '../../api';
import {
  Interview,
  INTERVIEW_ROUND_LABELS,
  INTERVIEW_METHOD_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_COLORS,
} from '../../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const EvaluationForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterview();
  }, [id]);

  const fetchInterview = async () => {
    setLoading(true);
    try {
      const res = await interviewApi.getById(id!);
      setInterview(res.data.data);
      if (res.data.data.evaluation) {
        form.setFieldsValue({
          score: res.data.data.evaluation.score,
          strengths: res.data.data.evaluation.strengths,
          concerns: res.data.data.evaluation.concerns,
          passed: res.data.data.evaluation.passed,
          remark: res.data.data.evaluation.remark,
        });
      }
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await evaluationApi.create({
        interviewId: id,
        ...values,
      });
      message.success('评价提交成功');
      navigate('/interviews');
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !interview) {
    return (
      <div className="loading-container">
        <Spin />
      </div>
    );
  }

  const hasEvaluation = !!interview.evaluation;

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
          面试评价
        </h2>
      </div>
      <Card title="面试信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="候选人">{interview.candidate.name}</Descriptions.Item>
          <Descriptions.Item label="应聘职位">{interview.job.title}</Descriptions.Item>
          <Descriptions.Item label="面试轮次">
            {INTERVIEW_ROUND_LABELS[interview.round as keyof typeof INTERVIEW_ROUND_LABELS]}
          </Descriptions.Item>
          <Descriptions.Item label="面试官">{interview.interviewer.name}</Descriptions.Item>
          <Descriptions.Item label="开始时间">
            {dayjs(interview.startTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="结束时间">
            {dayjs(interview.endTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="面试方式">
            {INTERVIEW_METHOD_LABELS[interview.method as keyof typeof INTERVIEW_METHOD_LABELS]}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={INTERVIEW_STATUS_COLORS[interview.status as keyof typeof INTERVIEW_STATUS_COLORS]}>
              {INTERVIEW_STATUS_LABELS[interview.status as keyof typeof INTERVIEW_STATUS_LABELS]}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
      {hasEvaluation ? (
        <Card title="评价结果">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="评分">
              <Rate disabled value={interview.evaluation!.score} />
            </Descriptions.Item>
            <Descriptions.Item label="是否通过">
              <Tag color={interview.evaluation!.passed ? 'green' : 'red'}>
                {interview.evaluation!.passed ? '通过' : '不通过'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优点" span={2}>
              {interview.evaluation!.strengths}
            </Descriptions.Item>
            <Descriptions.Item label="风险点" span={2}>
              {interview.evaluation!.concerns}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {interview.evaluation!.remark || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="评价时间">
              {dayjs(interview.evaluation!.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card title="提交评价">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="评分"
              name="score"
              rules={[{ required: true, message: '请选择评分' }]}
            >
              <Rate />
            </Form.Item>
            <Form.Item
              label="是否通过"
              name="passed"
              rules={[{ required: true, message: '请选择是否通过' }]}
            >
              <Select
                placeholder="请选择是否通过"
                options={[
                  { value: true, label: '通过' },
                  { value: false, label: '不通过' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="优点"
              name="strengths"
              rules={[{ required: true, message: '请输入优点' }]}
            >
              <TextArea rows={3} placeholder="请输入候选人优点" />
            </Form.Item>
            <Form.Item
              label="风险点"
              name="concerns"
              rules={[{ required: true, message: '请输入风险点' }]}
            >
              <TextArea rows={3} placeholder="请输入候选人风险点" />
            </Form.Item>
            <Form.Item
              label="评价备注"
              name="remark"
            >
              <TextArea rows={3} placeholder="请输入评价备注（选填）" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  提交评价
                </Button>
                <Button onClick={() => navigate('/interviews')}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default EvaluationForm;
