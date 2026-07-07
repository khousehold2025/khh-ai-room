"use client";

import { useRef } from "react";

type Props = {
  onImageSelect: (file: File) => void;
};

export default function UploadArea({ onImageSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">

      <h2 className="text-xl font-bold mb-4">

        ① 공간 사진

      </h2>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl h-96 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
      >

        <p className="text-gray-400">

          클릭해서 이미지를 선택하세요

        </p>

      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {

          if (!e.target.files?.length) return;

          onImageSelect(e.target.files[0]);

        }}
      />

    </div>
  );
}