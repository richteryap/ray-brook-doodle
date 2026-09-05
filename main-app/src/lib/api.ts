const API_URL = "http://127.0.0.1:5000";

export const fetchLogs = async () => {
  const response = await fetch(`${API_URL}/logs`);
  return response.json();
};

export const createLog = async (data: any) => {
  const response = await fetch(`${API_URL}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};
