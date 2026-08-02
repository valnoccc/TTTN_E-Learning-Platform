import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseDetailShell from './CourseDetailShell';
import CourseOverview from './tabs/CourseOverview';
import { PolicyModal } from '../../../components/common/PolicyModal';
import axiosClient from '../../../api/axios';

export default function CourseCreate() {
  const navigate = useNavigate();
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (!user.instructorPolicyAcceptedAt) {
        setShowPolicy(true);
      }
    }
  }, []);

  const handleAcceptPolicy = async () => {
    try {
      const response = await axiosClient.patch('/users/me/policies', { policyType: 'instructor' });
      // Update local storage
      if (response.data && response.data.data) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.instructorPolicyAcceptedAt = response.data.data.instructorPolicyAcceptedAt;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      setShowPolicy(false);
    } catch (error) {
      console.error('Failed to accept policy', error);
      // maybe a toast
    }
  };

  const handleDeclinePolicy = () => {
    navigate(-1); // Go back if declined
  };

  if (showPolicy) {
    return (
      <PolicyModal 
        isOpen={showPolicy}
        type="instructor"
        onAccept={handleAcceptPolicy}
        onDecline={handleDeclinePolicy}
      />
    );
  }

  return (
    <CourseDetailShell mode="create">
      <CourseOverview />
    </CourseDetailShell>
  );
}
