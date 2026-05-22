import React, { useState, useEffect } from 'react';
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Card,
  Spin,
  message,
  Timeline,
  Modal,
  Form,
  Select,
  Input,
  Tabs,
  Table,
  Rate,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SwapOutlined,
  CalendarOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { candidateApi, interviewApi, evaluationApi, offerApi } from '../../api';
import {
  Candidate,
  CandidateStage,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_STAGE_COLORS,
  CANDIDATE_SOURCE_LABELS,
  Interview,
  InterviewRound,
  INTERVIEW_ROUND_LABELS,
  INTERVIEW_METHOD_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_COLORS,
  InterviewStatus,
  Offer,
  OFFER_STATUS_LABELS,
  OFFER_STATUS_COLORS,
  TimelineEvent,
  ACTION_TYPE_LABELS,
  ActionType,
} from '../../types';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

const STAGE_TRANSITIONS: Record<string, string[]> = {
  SCREENING: ['HR_INTERVIEW', 'REJECTED'],
  HR_INTERVIEW: ['TECH_INTERVIEW', 'REJECTED'],
  TECH_INTERVIEW: ['FINAL_INTERVIEW', 'REJECTED'],
  FINAL_INTERVIEW: ['OFFER', 'REJECTED'],
  OFFER: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};

const CandidateDetail: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [stageForm] = Form.useForm();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candidateRes, interviewRes, evaluationRes, offerRes] = await Promise.all([
        candidateApi.getById(id!),
        interviewApi.getList({ candidateId: id, pageSize: 100 }),
        evaluationApi.getByCandidateId(id!),
        offerApi.getList({ candidateId: id, pageSize: 100 }),
      ]);
      setCandidate(candidateRes.data.data);
      setInterviews(interviewRes.data.data.list);
      setEvaluations(evaluationRes.data.data);
      setOffers(offerRes.data.data.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async () => {
    try {
      const values = await stageForm.validateFields();
      await candidateApi.changeStage(id!, values.newStage, values.description);
      message.success('阶段变更成功');
      setStageModalVisible(false);
      stageForm.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    try {
      await interviewApi.cancel(interviewId);
      message.success('面试已取消');
      fetchData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const interviewColumns = [
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
      render: (method: string) => INTERVIEW_METHOD_LABELS[method as keyof typeof INTERVIEW_METHOD_LABELS],
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
        <Space>
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
              onClick={() => handleCancelInterview(record.id)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const offerColumns = [
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
      render: (status: string) => (
        <Tag color={OFFER_STATUS_COLORS[status as keyof typeof OFFER_STATUS_COLORS]}>
          {OFFER_STATUS_LABELS[status as keyof typeof OFFER_STATUS_LABELS]}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  if (loading || !candidate) {
    return (
      <div className="loading-container">
        <Spin />
      </div>
    );
  }

  const availableStages = STAGE_TRANSITIONS[candidate.stage] || [];

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/candidates')}
          />
          <h2 className="page-title">候选人详情</h2>
        </Space>
        <Space>
          {(user?.role === 'HR' || user?.role === 'ADMIN') && (
            <>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/candidates/${id}/edit`)}>
                编辑
              </Button>
              {availableStages.length > 0 && (
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  onClick={() => setStageModalVisible(true)}
                >
                  阶段流转
                </Button>
              )}
              <Button
                icon={<CalendarOutlined />}
                onClick={() => navigate(`/interviews/new?candidateId=${id}`)}
              >
                安排面试
              </Button>
              {candidate.stage === CandidateStage.OFFER && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate(`/offers/new?candidateId=${id}&jobId=${candidate.jobId}`)}
                >
                  创建Offer
                </Button>
              )}
            </>
          )}
        </Space>
      </div>

      <Tabs defaultActiveKey="info">
        <TabPane tab="基本信息" key="info">
          <div className="detail-section">
            <Card title="基础信息">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="姓名">{candidate.name}</Descriptions.Item>
                <Descriptions.Item label="手机号">{candidate.phone}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{candidate.email}</Descriptions.Item>
                <Descriptions.Item label="简历链接">
                  {candidate.resumeUrl ? (
                    <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                      查看简历
                    </a>
                  ) : '无'}
                </Descriptions.Item>
                <Descriptions.Item label="来源">{CANDIDATE_SOURCE_LABELS[candidate.source]}</Descriptions.Item>
                <Descriptions.Item label="当前阶段">
                  <Tag color={CANDIDATE_STAGE_COLORS[candidate.stage]}>
                    {CANDIDATE_STAGE_LABELS[candidate.stage]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="负责人">{candidate.owner?.name}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(candidate.createdAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {candidate.remark || '无'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
          <div className="detail-section">
            <Card title="应聘职位">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="职位名称">{candidate.job?.title}</Descriptions.Item>
                <Descriptions.Item label="所属部门">{candidate.job?.department}</Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        </TabPane>

        <TabPane tab="阶段流转时间线" key="timeline">
          <Card>
            {candidate.timelineEvents && candidate.timelineEvents.length > 0 ? (
              <Timeline
                items={candidate.timelineEvents.map((event: TimelineEvent) => ({
                  color: event.actionType === ActionType.STAGE_CHANGE ? 'blue' : 'green',
                  children: (
                    <div className="timeline-event">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color="blue">{ACTION_TYPE_LABELS[event.actionType]}</Tag>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {event.fromStage && event.toStage && (
                          <div>
                            阶段变更:
                            <Tag color={CANDIDATE_STAGE_COLORS[event.fromStage as keyof typeof CANDIDATE_STAGE_COLORS]}>
                              {CANDIDATE_STAGE_LABELS[event.fromStage as keyof typeof CANDIDATE_STAGE_LABELS]}
                            </Tag>
                            →
                            <Tag color={CANDIDATE_STAGE_COLORS[event.toStage as keyof typeof CANDIDATE_STAGE_COLORS]}>
                              {CANDIDATE_STAGE_LABELS[event.toStage as keyof typeof CANDIDATE_STAGE_LABELS]}
                            </Tag>
                          </div>
                        )}
                        {event.description && <div style={{ marginTop: 4 }}>{event.description}</div>}
                        <div style={{ marginTop: 4, color: '#666', fontSize: 12 }}>
                          操作人: {event.operator?.name}
                        </div>
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <div className="empty-container">暂无时间线记录</div>
            )}
          </Card>
        </TabPane>

        <TabPane tab="面试记录" key="interviews">
          <Table
            rowKey="id"
            dataSource={interviews}
            columns={interviewColumns}
            pagination={false}
          />
        </TabPane>

        <TabPane tab="评价记录" key="evaluations">
          {evaluations.length > 0 ? (
            <Table
              rowKey="id"
              dataSource={evaluations}
              columns={[
                {
                  title: '面试轮次',
                  dataIndex: ['interview', 'round'],
                  key: 'round',
                  render: (round: InterviewRound) => INTERVIEW_ROUND_LABELS[round],
                },
                {
                  title: '面试官',
                  dataIndex: ['interview', 'interviewer', 'name'],
                  key: 'interviewer',
                },
                {
                  title: '评分',
                  dataIndex: 'score',
                  key: 'score',
                  render: (score: number) => <Rate disabled value={score} />,
                },
                {
                  title: '是否通过',
                  dataIndex: 'passed',
                  key: 'passed',
                  render: (passed: boolean) => (
                    <Tag color={passed ? 'green' : 'red'}>{passed ? '通过' : '不通过'}</Tag>
                  ),
                },
                {
                  title: '优点',
                  dataIndex: 'strengths',
                  key: 'strengths',
                },
                {
                  title: '风险点',
                  dataIndex: 'concerns',
                  key: 'concerns',
                },
                {
                  title: '评价时间',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
                },
              ]}
              pagination={false}
            />
          ) : (
            <div className="empty-container">暂无评价记录</div>
          )}
        </TabPane>

        <TabPane tab="Offer信息" key="offers">
          <Table
            rowKey="id"
            dataSource={offers}
            columns={offerColumns}
            pagination={false}
          />
        </TabPane>
      </Tabs>

      <Modal
        title="阶段流转"
        open={stageModalVisible}
        onOk={handleStageChange}
        onCancel={() => {
          setStageModalVisible(false);
          stageForm.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={stageForm} layout="vertical">
          <Form.Item
            label="当前阶段"
          >
            <Tag color={CANDIDATE_STAGE_COLORS[candidate.stage]}>
              {CANDIDATE_STAGE_LABELS[candidate.stage]}
            </Tag>
          </Form.Item>
          <Form.Item
            name="newStage"
            label="目标阶段"
            rules={[{ required: true, message: '请选择目标阶段' }]}
          >
            <Select
              placeholder="请选择目标阶段"
              options={availableStages.map((stage) => ({
                value: stage,
                label: CANDIDATE_STAGE_LABELS[stage as keyof typeof CANDIDATE_STAGE_LABELS],
              }))}
            />
          </Form.Item>
          <Form.Item name="description" label="操作说明">
            <TextArea rows={3} placeholder="请输入操作说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CandidateDetail;
