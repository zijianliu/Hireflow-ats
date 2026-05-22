import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, DatePicker, Spin, message, Empty } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  SmileOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi, jobApi } from '../../api';
import {
  DashboardStats,
  Job,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_SOURCE_LABELS,
  CandidateSource,
} from '../../types';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const statCards = [
  { key: 'recruitingJobCount', label: '招聘中职位数', icon: <TeamOutlined />, color: '#1890ff' },
  { key: 'newCandidateCount', label: '新增候选人', icon: <UserOutlined />, color: '#52c41a' },
  { key: 'pendingInterviewCount', label: '待面试数量', icon: <ScheduleOutlined />, color: '#faad14' },
  { key: 'completedInterviewCount', label: '已完成面试', icon: <CheckCircleOutlined />, color: '#13c2c2' },
  { key: 'offerCount', label: 'Offer发放数量', icon: <GiftOutlined />, color: '#722ed1' },
  { key: 'hiredCount', label: '入职人数', icon: <SmileOutlined />, color: '#52c41a' },
  { key: 'rejectedCount', label: '淘汰人数', icon: <CloseCircleOutlined />, color: '#ff4d4f' },
];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobList, setJobList] = useState<Job[]>([]);
  const [jobId, setJobId] = useState<string | undefined>();
  const [department, setDepartment] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const { user } = useAuthStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (jobId) params.jobId = jobId;
      if (department) params.department = department;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      const res = await dashboardApi.getStats(params);
      setStats(res.data.data);
    } catch (err: any) {
      message.error(err.message);
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
    fetchJobs();
  }, []);

  const handleSearch = () => {
    fetchData();
  };

  const handleReset = () => {
    setJobId(undefined);
    setDepartment(undefined);
    setDateRange(null);
    setTimeout(fetchData, 0);
  };

  const getStageChartOption = () => {
    if (!stats?.stageDistribution) return {};
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '阶段分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: stats.stageDistribution.map((item) => ({
            name: CANDIDATE_STAGE_LABELS[item.stage as keyof typeof CANDIDATE_STAGE_LABELS],
            value: item.count,
          })),
        },
      ],
    };
  };

  const getSourceChartOption = () => {
    if (!stats?.sourcePassRate) return {};
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['总数', '通过数'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: stats.sourcePassRate.map((item) =>
          CANDIDATE_SOURCE_LABELS[item.source as keyof typeof CANDIDATE_SOURCE_LABELS]
        ),
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '总数',
          type: 'bar',
          data: stats.sourcePassRate.map((item) => item.total),
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '通过数',
          type: 'bar',
          data: stats.sourcePassRate.map((item) => item.passed),
          itemStyle: { color: '#52c41a' },
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">招聘统计看板</h2>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder="选择职位"
              value={jobId}
              onChange={setJobId}
              style={{ width: '100%' }}
              allowClear
              options={jobList.map((j) => ({ value: j.id, label: j.title }))}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择部门"
              value={department}
              onChange={setDepartment}
              style={{ width: '100%' }}
              allowClear
              options={Array.from(new Set(jobList.map((j) => j.department))).map((d) => ({
                value: d,
                label: d,
              }))}
            />
          </Col>
          <Col span={8}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <button
              type="button"
              onClick={handleSearch}
              style={{ marginRight: 8, padding: '4px 15px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 4 }}
            >
              搜索
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{ padding: '4px 15px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 4 }}
            >
              重置
            </button>
          </Col>
        </Row>
      </Card>

      {stats ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {statCards.map((card) => (
              <Col span={8} key={card.key}>
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#666' }}>{card.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 600, color: card.color, marginTop: 8 }}>
                        {(stats as any)[card.key] || 0}
                      </div>
                    </div>
                    <div style={{ fontSize: 48, color: card.color, opacity: 0.3 }}>{card.icon}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="各阶段候选人数量分布">
                {stats.stageDistribution && stats.stageDistribution.length > 0 ? (
                  <ReactECharts option={getStageChartOption()} style={{ height: 300 }} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="不同来源候选人通过率">
                {stats.sourcePassRate && stats.sourcePassRate.length > 0 ? (
                  <ReactECharts option={getSourceChartOption()} style={{ height: 300 }} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Empty description="暂无数据" />
      )}
    </div>
  );
};

export default Dashboard;
