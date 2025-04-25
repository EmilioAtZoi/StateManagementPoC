import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";

const fetchCloudState = async () => {
  const response = await fetch("/api/cloud-state");
  return response.json();
};

const updateCloudState = async (state: {
  isOnline: boolean;
  lastUpdated: number;
}) => {
  await fetch("/api/cloud-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
};

export const useCloudState = () => useQuery(["cloudState"], fetchCloudState);

export const useUpdateCloudState = () => {
  const queryClient = new QueryClient();
  return useMutation({
    mutationFn: updateCloudState,
    onSuccess: () => {
      queryClient.invalidateQueries(["cloudState"]);
    },
  });
};

export const syncCloudStateWithBLE = (connected: boolean) => {
  const updateCloudState = useUpdateCloudState();
  updateCloudState.mutate({
    isOnline: connected,
    lastUpdated: Date.now(),
  });
};
