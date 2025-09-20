import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import { useState } from "react";

export default function Files() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  // 修复 useQuery 调用方式
  const { data, isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const res = await api.get("/files");
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/files/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      setFile(null);
      alert("上传成功");
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">文件管理</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => uploadMutation.mutate()}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          上传
        </button>
      </div>
      {isLoading ? (
        <p>加载中...</p>
      ) : (
        <ul className="space-y-2">
          {data?.map((f: any) => (
            <li key={f.id} className="flex justify-between p-2 border rounded">
              <span>{f.filename}</span>
              <a
                href={`/api/files/download/${f.id}`}
                className="text-blue-500 hover:underline"
              >
                下载
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}