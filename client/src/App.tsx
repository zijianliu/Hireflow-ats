import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import JobList from './pages/job/JobList';
import JobForm from './pages/job/JobForm';
import JobDetail from './pages/job/JobDetail';
import CandidateList from './pages/candidate/CandidateList';
import CandidateForm from './pages/candidate/CandidateForm';
import CandidateDetail from './pages/candidate/CandidateDetail';
import InterviewList from './pages/interview/InterviewList';
import InterviewForm from './pages/interview/InterviewForm';
import EvaluationForm from './pages/evaluation/EvaluationForm';
import OfferList from './pages/offer/OfferList';
import OfferForm from './pages/offer/OfferForm';
import Dashboard from './pages/dashboard/Dashboard';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const DefaultRedirect: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'INTERVIEWER') {
      navigate('/interviews', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<DefaultRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="jobs" element={<JobList />} />
              <Route path="jobs/new" element={<JobForm />} />
              <Route path="jobs/:id/edit" element={<JobForm />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="candidates" element={<CandidateList />} />
              <Route path="candidates/new" element={<CandidateForm />} />
              <Route path="candidates/:id/edit" element={<CandidateForm />} />
              <Route path="candidates/:id" element={<CandidateDetail />} />
              <Route path="interviews" element={<InterviewList />} />
              <Route path="interviews/new" element={<InterviewForm />} />
              <Route path="interviews/:id/evaluate" element={<EvaluationForm />} />
              <Route path="offers" element={<OfferList />} />
              <Route path="offers/new" element={<OfferForm />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
