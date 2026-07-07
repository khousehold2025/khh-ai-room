"use client";

import { useRef } from "react";

type Props = {
  image: string | null;
  onSelect: (file: File) => void;
};

export default function UploadPanel({
  image,
  onSelect,
}: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">

        공간 사진

      </h2>

      <div
        onClick={() => input.current?.click()}
        className="border-2 border-dashed rounded-xl h-96 cursor-pointer overflow-hidden flex items-center justify-center"
      >
        {image ? (
          <img
            src={image}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400">
            클릭해서 업로드
          </span>
        )}
      </div>

      <input
        hidden
        ref={input}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (!e.target.files?.length) return;

          onSelect(e.target.files[0]);
        }}
      />
    </div>
  );
}