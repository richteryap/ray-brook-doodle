import { useLocation, useNavigate, useParams } from 'react-router-dom';

export const useHashUid = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const setHashUid = (newUid: string) => {
    if (newUid) {
      navigate(`/u/${newUid}${location.search}${location.hash}`);
    }
  };

  return [uid || "", setHashUid] as const;
};