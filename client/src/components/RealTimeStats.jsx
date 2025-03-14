// client/src/components/RealTimeStats.jsx
useEffect(() => {

    const socket = io('http://localhost:5000');

    socket.on('click', (data) => {
      setClicks(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, []);