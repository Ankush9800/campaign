// client/src/components/RealTimeStats.jsx
useEffect(() => {
    const socket = io('https://taskwala-backend.onrender.com');
    socket.on('click', (data) => {
      setClicks(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, []);