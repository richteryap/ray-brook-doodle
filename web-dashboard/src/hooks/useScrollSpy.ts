import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const useScrollSpy = (sectionIds: string[]) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentHash = useRef(location.hash);

  useEffect(() => {
    currentHash.current = location.hash;
  }, [location.hash]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const newHash = `#${entry.target.id}`;
            
            if (currentHash.current !== newHash) {
              currentHash.current = newHash;
              navigate(`${location.pathname}${location.search}${newHash}`, { 
                replace: true 
              });
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sectionIds, navigate, location.pathname, location.search]);
};

export default useScrollSpy;