export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export enum Role {
  HR = 'HR',
  INTERVIEWER = 'INTERVIEWER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
}

export enum JobStatus {
  RECRUITING = 'RECRUITING',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  headcount: number;
  status: JobStatus;
  description: string;
  ownerId: string;
  owner: User;
  participants?: User[];
  createdAt: string;
  updatedAt: string;
  _count?: { candidates: number };
}

export enum CandidateSource {
  OFFICIAL = 'OFFICIAL',
  REFERRAL = 'REFERRAL',
  HEADHUNTER = 'HEADHUNTER',
  PLATFORM = 'PLATFORM',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

export enum CandidateStage {
  SCREENING = 'SCREENING',
  HR_INTERVIEW = 'HR_INTERVIEW',
  TECH_INTERVIEW = 'TECH_INTERVIEW',
  FINAL_INTERVIEW = 'FINAL_INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  resumeUrl?: string;
  source: CandidateSource;
  jobId: string;
  job: { id: string; title: string; department: string };
  stage: CandidateStage;
  ownerId: string;
  owner: User;
  remark?: string;
  interviews?: Interview[];
  timelineEvents?: TimelineEvent[];
  offers?: Offer[];
  createdAt: string;
  updatedAt: string;
}

export enum ActionType {
  STAGE_CHANGE = 'STAGE_CHANGE',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_CANCELLED = 'INTERVIEW_CANCELLED',
  INTERVIEW_EVALUATED = 'INTERVIEW_EVALUATED',
  OFFER_CREATED = 'OFFER_CREATED',
  OFFER_UPDATED = 'OFFER_UPDATED',
}

export interface TimelineEvent {
  id: string;
  candidateId: string;
  actionType: ActionType;
  fromStage?: CandidateStage;
  toStage?: CandidateStage;
  operatorId: string;
  operator: User;
  description?: string;
  createdAt: string;
}

export enum InterviewRound {
  HR_INTERVIEW = 'HR_INTERVIEW',
  TECH_INTERVIEW = 'TECH_INTERVIEW',
  FINAL_INTERVIEW = 'FINAL_INTERVIEW',
}

export enum InterviewMethod {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  PHONE = 'PHONE',
}

export enum InterviewStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Interview {
  id: string;
  candidateId: string;
  candidate: { id: string; name: string; phone?: string; email?: string };
  jobId: string;
  job: { id: string; title: string; department?: string };
  round: InterviewRound;
  interviewerId: string;
  interviewer: User;
  startTime: string;
  endTime: string;
  method: InterviewMethod;
  location?: string;
  status: InterviewStatus;
  evaluation?: InterviewEvaluation;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewEvaluation {
  id: string;
  interviewId: string;
  candidateId: string;
  score: number;
  strengths: string;
  concerns: string;
  passed: boolean;
  remark?: string;
  createdAt: string;
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface Offer {
  id: string;
  candidateId: string;
  candidate: { id: string; name: string; phone?: string; email?: string };
  jobId: string;
  job: { id: string; title: string; department?: string };
  salaryRange: string;
  onboardDate: string;
  status: OfferStatus;
  remark?: string;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  recruitingJobCount: number;
  newCandidateCount: number;
  pendingInterviewCount: number;
  completedInterviewCount: number;
  offerCount: number;
  hiredCount: number;
  rejectedCount: number;
  stageDistribution: { stage: CandidateStage; count: number }[];
  sourcePassRate: { source: CandidateSource; total: number; passed: number; passRate: number }[];
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.HR]: 'HR',
  [Role.INTERVIEWER]: '面试官',
  [Role.ADMIN]: '管理员',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.RECRUITING]: '招聘中',
  [JobStatus.PAUSED]: '已暂停',
  [JobStatus.CLOSED]: '已关闭',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  [JobStatus.RECRUITING]: 'green',
  [JobStatus.PAUSED]: 'orange',
  [JobStatus.CLOSED]: 'red',
};

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSource, string> = {
  [CandidateSource.OFFICIAL]: '官网投递',
  [CandidateSource.REFERRAL]: '内推',
  [CandidateSource.HEADHUNTER]: '猎头',
  [CandidateSource.PLATFORM]: '招聘平台',
  [CandidateSource.EVENT]: '线下活动',
  [CandidateSource.OTHER]: '其他',
};

export const CANDIDATE_STAGE_LABELS: Record<CandidateStage, string> = {
  [CandidateStage.SCREENING]: '简历初筛',
  [CandidateStage.HR_INTERVIEW]: 'HR面试',
  [CandidateStage.TECH_INTERVIEW]: '技术面试',
  [CandidateStage.FINAL_INTERVIEW]: '终面',
  [CandidateStage.OFFER]: 'Offer',
  [CandidateStage.HIRED]: '已入职',
  [CandidateStage.REJECTED]: '已淘汰',
};

export const CANDIDATE_STAGE_COLORS: Record<CandidateStage, string> = {
  [CandidateStage.SCREENING]: 'blue',
  [CandidateStage.HR_INTERVIEW]: 'cyan',
  [CandidateStage.TECH_INTERVIEW]: 'geekblue',
  [CandidateStage.FINAL_INTERVIEW]: 'purple',
  [CandidateStage.OFFER]: 'gold',
  [CandidateStage.HIRED]: 'green',
  [CandidateStage.REJECTED]: 'red',
};

export const INTERVIEW_ROUND_LABELS: Record<InterviewRound, string> = {
  [InterviewRound.HR_INTERVIEW]: 'HR面试',
  [InterviewRound.TECH_INTERVIEW]: '技术面试',
  [InterviewRound.FINAL_INTERVIEW]: '终面',
};

export const INTERVIEW_METHOD_LABELS: Record<InterviewMethod, string> = {
  [InterviewMethod.ONLINE]: '线上',
  [InterviewMethod.OFFLINE]: '线下',
  [InterviewMethod.PHONE]: '电话',
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  [InterviewStatus.PENDING]: '待开始',
  [InterviewStatus.COMPLETED]: '已完成',
  [InterviewStatus.CANCELLED]: '已取消',
};

export const INTERVIEW_STATUS_COLORS: Record<InterviewStatus, string> = {
  [InterviewStatus.PENDING]: 'blue',
  [InterviewStatus.COMPLETED]: 'green',
  [InterviewStatus.CANCELLED]: 'red',
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  [OfferStatus.PENDING]: '待确认',
  [OfferStatus.ACCEPTED]: '已接受',
  [OfferStatus.REJECTED]: '已拒绝',
  [OfferStatus.WITHDRAWN]: '已撤回',
};

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  [OfferStatus.PENDING]: 'blue',
  [OfferStatus.ACCEPTED]: 'green',
  [OfferStatus.REJECTED]: 'red',
  [OfferStatus.WITHDRAWN]: 'orange',
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  [ActionType.STAGE_CHANGE]: '阶段变更',
  [ActionType.INTERVIEW_SCHEDULED]: '安排面试',
  [ActionType.INTERVIEW_CANCELLED]: '取消面试',
  [ActionType.INTERVIEW_EVALUATED]: '面试评价',
  [ActionType.OFFER_CREATED]: '创建Offer',
  [ActionType.OFFER_UPDATED]: 'Offer更新',
};
