// client/src/components/RealTimeStats.jsx
useEffect(() => {
<<<<<<< HEAD
    const socket = io('https://taskwala-backend.onrender.com');
=======
    const socket = io('http://localhost:5000');
>>>>>>> e19ccf6f (Added all files)
    socket.on('click', (data) => {
      setClicks(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, []);