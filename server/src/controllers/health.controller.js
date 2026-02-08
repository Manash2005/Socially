// Health Check Controller
export const checkHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running correctly',
    timestamp: new Date().toISOString(),
  });
};
