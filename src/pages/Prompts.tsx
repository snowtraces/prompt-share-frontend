import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import type { ApiResponse, PaginatedResponse } from "../types";

interface Prompt {
  id: number;
  title: string;
  description: string;
}

const Prompts: React.FC = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // 获取提示词列表
  const { data: prompts, isLoading } = useQuery<ApiResponse<PaginatedResponse<Prompt>>>({
    queryKey: ["prompts"],
    queryFn: async () => {
      const res = await api.get("/prompts");
      return res.data;
    },
  });

  // 创建提示词
  const createPrompt = useMutation({
    mutationFn: async () => {
      await api.post("/prompts", { title, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setTitle("");
      setDescription("");
    },
  });

  // 删除提示词
  const deletePrompt = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">提示词管理</h1>

      {/* 新建提示词表单 */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">新增提示词</h2>
        <input
          type="text"
          placeholder="标题"
          className="border p-2 w-full mb-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="描述"
          className="border p-2 w-full mb-2 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={() => createPrompt.mutate()}
          disabled={createPrompt.isPending || !title}
        >
          {createPrompt.isPending ? "提交中..." : "提交"}
        </button>
      </div>

      {/* 提示词列表 */}
      <ul className="space-y-3">
        {prompts?.data.list.map((prompt) => (
          <li
            key={prompt.id}
            className="bg-gray-100 shadow rounded p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold">{prompt.title}</h3>
              <p className="text-sm text-gray-700">{prompt.description}</p>
            </div>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => deletePrompt.mutate(prompt.id)}
              disabled={deletePrompt.isPending}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Prompts;